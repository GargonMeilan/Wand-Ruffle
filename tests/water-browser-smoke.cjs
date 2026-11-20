// python tests/build-water-fixture.py --ffdec .validation/ffdec/ffdec.jar
// node tests/water-browser-smoke.cjs
// Real engine classes, AS3/AVM1 nesting and Water assets; simulated server packets.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('../.validation/node_modules/playwright');
const runtime = 'web/ruffle/node_modules/@ruffle-rs/ruffle';
const fixture = '.validation/water-fixture';
let scenario;
const report = [];
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
        if (url.pathname === '/favicon.ico') { res.writeHead(204).end(); return; }
        if (url.pathname === '/') {
            res.setHeader('Content-Type', 'text/html');
            res.end(`<script src="/ruffle/ruffle.js"></script><div id="player"></div>
                <script>window.addEventListener('load', async () => {
                    const player = RufflePlayer.newest().createPlayer();
                    player.style.width = '760px'; player.style.height = '480px';
                    document.getElementById('player').append(player);
                    await player.ruffle().load({url:'/as3.swf', autoplay:'on', logLevel:'info', unmuteOverlay:'hidden'});
                });</script>`);
            return;
        }
        let file;
        if (url.pathname === '/as3.swf' || url.pathname === '/harness.swf') file = fixture + url.pathname;
        else if (url.pathname.startsWith('/ruffle/')) file = runtime + '/' + path.basename(url.pathname);
        else {
            assert(url.pathname.startsWith('/media/play/v2/games/water/'));
            if (url.pathname.endsWith('/water.swf') && scenario.patched) file = 'web/compat/water.swf';
            else file = 'vanilla-media' + url.pathname;
            scenario.requests.push(url.pathname);
            if (url.pathname.endsWith(scenario.delay || '__none__')) await new Promise(resolve => setTimeout(resolve, 350));
        }
        res.setHeader('Content-Type', ({ '.wasm': 'application/wasm', '.js': 'text/javascript' })[path.extname(file)] || 'application/x-shockwave-flash');
        res.end(fs.readFileSync(file));
    } catch (error) {
        scenario.errors.push(error.message);
        res.writeHead(404).end();
    }
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true,
        executablePath: process.env.CHROMIUM_PATH || path.resolve('.validation/browsers/chromium-1194/chrome-win/chrome.exe'),
        args: ['--enable-unsafe-swiftshader'] });
    try {
        for (const test of [{ name: 'original', patched: false }, { name: 'fixed', patched: true },
                            { name: 'fixed-slow-locale', patched: true, delay: 'locale.swf' }]) {
            scenario = { ...test, requests: [], errors: [], states: [], packets: [] };
            report.push(scenario);
            const page = await browser.newPage({ viewport: { width: 800, height: 520 } });
            // Historic analytics is unrelated to the game. Keep the fixture offline.
            await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1'
                ? route.continue() : route.fulfill({ status: 204 }));
            page.on('pageerror', error => scenario.errors.push(error.message));
            page.on('crash', () => scenario.errors.push('Renderer crashed'));
            const started = Date.now();
            page.on('console', message => {
                const state = message.text().match(/WATER state (true|false) (true|false) (true|false) (true|false) (\d+)/);
                if (state) scenario.states.push({ ms: Date.now() - started, values: state.slice(1) });
                const packet = message.text().match(/WATER send (gz|zm) ([^ ]*)/);
                if (packet) scenario.packets.push(packet.slice(1));
            });
            await page.goto(`http://127.0.0.1:${server.address().port}/`);
            const deadline = Date.now() + 30000;
            while ((!scenario.states.some(s => s.values[3] === 'true') || scenario.states.length < 4) && Date.now() < deadline)
                await page.waitForTimeout(100);
            assert.ok(scenario.states.some(s => s.values.slice(0, 4).every(v => v === 'true')), 'board, dialogs, cards and engine must be ready');
            const refreshes = Number(scenario.states.at(-1).values[4]);
            if (test.patched) {
                assert.ok(refreshes >= 7 && refreshes < 100, `card refreshes must stay bounded: ${refreshes}`);
                await page.mouse.click(310, 460, { delay: 100 });
                await page.waitForTimeout(800);
                assert.ok(scenario.packets.some(p => p[0] === 'zm' && p[1].startsWith('110,')), 'selecting a card must reach the server');
                assert.ok(Number(scenario.states.at(-1).values[4]) < 100, 'card selection must keep refreshes bounded');
            } else assert.ok(refreshes > 1000, 'original must reproduce the render event storm');
            assert.ok(scenario.requests.some(url => url.endsWith('/lang/es/locale.swf')));
            assert.deepEqual(scenario.errors, []);
            await page.screenshot({ path: `${fixture}/${test.name}.png` });
            await page.close();
            console.log(`${test.name}: OK (${refreshes} card refreshes, first heartbeat ${scenario.states[0].ms}ms)`);
        }
    } finally {
        fs.writeFileSync(`${fixture}/regression-report.json`, JSON.stringify(report, null, 2));
        await browser.close();
        server.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
