// Real keyboard actions against the disposable local-stack fixture only.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {chromium} = require('../.validation/node_modules/playwright');
const meta = JSON.parse(fs.readFileSync('.validation/local-stack/meta.json'));
assert.ok(meta.project.startsWith('wand-local-check-'));
const compose = ['compose', '-p', meta.project, '-f', path.resolve('.validation/local-stack/compose.json')];
const cases = [
    {name:'hard-hat', head:403, body:0, action:36},
    {name:'firefighter', head:465, body:299, action:46},
    {name:'toy-robot', head:1745, body:24008, feet:6212, action:140},
    {name:'iron-man', head:1412, body:4621, action:null}
];
function outfit(test) {
    const sql = `UPDATE penguin SET head=${test.head},face=NULL,neck=NULL,body=${test.body || 'NULL'},hand=NULL,feet=${test.feet || 'NULL'},status_field=2147483647,opened_playercard=TRUE WHERE username='testmod';`;
    execFileSync('docker', [...compose,'exec','-T','db','psql','-U','postgres','-d','postgres','-c',sql], {stdio:'pipe'});
}
(async()=>{
    const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || path.resolve('.validation/browsers/chromium-1194/chrome-win/chrome.exe'),
        args:['--host-resolver-rules=MAP *.localhost 127.0.0.1','--enable-unsafe-swiftshader']});
    const results=[];
    try {
        for(const test of cases.filter(test=>!process.env.DANCE_CASE || test.name===process.env.DANCE_CASE)) {
            outfit(test);
            const context=await browser.newContext({viewport:{width:1280,height:1000}});
            const page=await context.newPage();
            const received=[],actions=[],errors=[];
            page.on('pageerror',e=>errors.push(e.message));
            page.on('response',r=>{if(r.url().includes('/penguin/actions/'))actions.push({url:r.url(),status:r.status()});});
            page.on('websocket',ws=>{
                ws.on('framereceived',e=>received.push(String(e.payload)));
            });
            const base=`http://play.localhost:${meta.port}`;
            await page.goto(base+'/');
            await page.locator('#penguin-login').click();
            await page.waitForResponse(r=>r.url().includes('/client/login.swf')&&r.ok(),{timeout:60000});
            await page.waitForTimeout(5000);
            await page.mouse.click(650,230);await page.keyboard.type('testmod');
            await page.mouse.click(650,280);await page.keyboard.type('FixturePass123!');
            await page.mouse.click(650,468);await page.waitForTimeout(10000);
            await page.mouse.click(550,300);
            await page.waitForFunction(()=>!!document.querySelector('ruffle-player'));
            for(let n=0;n<40&&!received.some(s=>s.includes('%xt%jr%'));n++)await page.waitForTimeout(500);
            assert.ok(received.some(s=>s.includes('%xt%jr%')),'Must join a real room');
            await page.waitForTimeout(5000);
            const beforeDance=received.length;
            await page.keyboard.press('d');await page.waitForTimeout(2500);
            await page.screenshot({path:`.validation/local-stack/dance-${test.name}.png`});
            const danceEcho=received.slice(beforeDance).some(s=>s.includes('%xt%sf%')&&s.includes('%26%'));
            const result={name:test.name,danceEcho,actions,errors};results.push(result);
            console.log(JSON.stringify(result));
            assert.ok(danceEcho,'Keyboard dance must produce a fresh frame-26 server response');
            if(test.action)assert.ok(actions.some(a=>a.status===200&&a.url.includes('/'+test.action+'.swf')),'Expected special action must load');
            else assert.equal(actions.length,0,'This outfit has no configured special action');
            assert.deepEqual(errors,[]);
            await context.close();
        }
    } finally {
        fs.writeFileSync('.validation/local-stack/special-dance-results.json',JSON.stringify(results,null,2));
        await browser.close();
    }
})().catch(e=>{console.error(e);process.exitCode=1});
