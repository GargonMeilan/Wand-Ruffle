// python tests/build-waves-fixture.py --ffdec .validation/ffdec/ffdec.jar
// node tests/waves-browser-smoke.cjs
// Real engine classes + AS3 wrapper + real surf assets, without accounts/backend.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('../.validation/node_modules/playwright');
const runtime = 'web/ruffle/node_modules/@ruffle-rs/ruffle';
const fixture = '.validation/waves-fixture';
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
            assert(url.pathname.startsWith('/media/play/v2/games/waves/'));
            if (url.pathname.endsWith('/CatchinWaves.swf') && scenario.patched) file = 'web/compat/CatchinWaves.swf';
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
        for (const test of [{ name: 'original', patched: false, delay: 'CatchinWaves.swf' }, { name: 'fixed', patched: true },
                            { name: 'fixed-slow-game', patched: true, delay: 'CatchinWaves.swf' },
                            { name: 'fixed-slow-locale', patched: true, delay: 'locale.swf' }]) {
            scenario = { ...test, requests: [], errors: [], states: [] };
            report.push(scenario);
            const page = await browser.newPage({ viewport: { width: 800, height: 520 } });
            page.on('pageerror', error => scenario.errors.push(error.message));
            page.on('console', message => {
                const state = message.text().match(/FIXTURE state (\d+) (\d+|undefined) (\d+) (true|false)/);
                if (state) scenario.states.push(state.slice(1));
            });
            await page.goto(`http://127.0.0.1:${server.address().port}/`);
            const deadline = Date.now() + 20000;
            while (scenario.states.length < 3 && Date.now() < deadline) await page.waitForTimeout(100);
            assert.ok(scenario.states.length >= 3, 'fixture must finish loading');
            // The original race depends on resource/frame timing. Record its
            // result, while requiring every patched load to reach the menu.
            const title = test.patched ? '2' : scenario.states.at(-1)[1];
            assert.ok(['1', '2'].includes(title));
            assert.deepEqual(scenario.states.at(-1), ['1', title, '2', 'true'], test.name + ': title frame and locale');
            assert.equal(scenario.requests.filter(url => url.endsWith('/CatchinWaves.swf')).length, 1);
            assert.ok(scenario.requests.some(url => url.endsWith('/lang/es/locale.swf')));
            await page.screenshot({ path: `${fixture}/${test.name}.png` });
            if (test.patched) {
                await page.mouse.move(300, 390);
                await page.waitForTimeout(150);
                await page.mouse.click(300, 390, { delay: 100 }); // Freestyle.
                const until = Date.now() + 15000;
                while (!scenario.states.some(row => ['2', '3'].includes(row[0])) && Date.now() < until) await page.waitForTimeout(100);
                assert.ok(scenario.states.some(row => ['2', '3'].includes(row[0])), 'Freestyle must start');
                if (!scenario.states.some(row => row[0] === '3')) {
                    await page.mouse.click(690, 458, { delay: 100 }); // Skip intro.
                    const surfing = Date.now() + 12000;
                    while (!scenario.states.some(row => row[0] === '3') && Date.now() < surfing) await page.waitForTimeout(100);
                }
                assert.ok(scenario.states.some(row => row[0] === '3'), 'Surf gameplay frame must run');
                await page.screenshot({ path: `${fixture}/${test.name}-playing.png` });
            }
            assert.deepEqual(scenario.errors, []);
            await page.close();
            console.log(test.name + ': OK');
        }
    } finally {
        fs.writeFileSync(`${fixture}/regression-report.json`, JSON.stringify(report, null, 2));
        await browser.close();
        server.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
