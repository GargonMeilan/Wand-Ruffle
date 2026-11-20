// Uses only the disposable Docker fixture. Real keyboard/mouse game actions.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('../.validation/node_modules/playwright');
const meta=JSON.parse(fs.readFileSync('.validation/local-stack/meta.json'));
assert.ok(meta.project.startsWith('wand-local-check-'));
const compose=['compose','-p',meta.project,'-f',path.resolve('.validation/local-stack/compose.json')];
execFileSync('docker',[...compose,'exec','-T','db','psql','-U','postgres','-d','postgres','-c',
    "UPDATE room SET spawn=(id=100); INSERT INTO penguin_quest_task(task_id,penguin_id,complete) SELECT 1,id,FALSE FROM penguin WHERE username IN ('testmod','testuser') ON CONFLICT DO NOTHING; UPDATE penguin SET head=1412,body=4621,face=NULL,neck=NULL,hand=NULL,feet=NULL WHERE username='testmod';"],{stdio:'pipe'});
execFileSync('docker',[...compose,'up','-d','--no-deps','--force-recreate','--wait','houdini_blizzard'],{stdio:'pipe',timeout:90000});
(async()=>{
    const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||path.resolve('.validation/browsers/chromium-1194/chrome-win/chrome.exe'),
        args:['--host-resolver-rules=MAP *.localhost 127.0.0.1','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
    const results={errors:[],frames:[],extensionLoaded:[],effects:[]};
    const base=`http://play.localhost:${meta.port}`;
    async function login(name){
        const context=await browser.newContext({viewport:{width:1280,height:1000}});
        const page=await context.newPage();const packets=[];
        await page.route('**/__wand/ruffle/vanilla.js',async route=>{
            await route.fulfill({contentType:'application/javascript',body:fs.readFileSync('web/ruffle/vanilla.js','utf8').replace('logLevel: "warn"','logLevel: "info"')});
        });
        page.on('console',m=>{if(m.text().includes('WandCostume')){results.effects.push({name,text:m.text()});console.log(name,m.text());}});
        page.on('pageerror',e=>results.errors.push({name,error:e.message}));
        page.on('response',r=>{if(r.url().includes('/client/rooms_common.swf'))results.extensionLoaded.push({name,status:r.status()});});
        page.on('websocket',ws=>ws.on('framereceived',e=>packets.push(String(e.payload))));
        await page.goto(base+'/');await page.locator('#penguin-login').click();
        await page.waitForResponse(r=>r.url().includes('/client/login.swf')&&r.ok(),{timeout:60000});
        await page.waitForTimeout(5000);
        await page.mouse.click(650,230);await page.keyboard.type(name);
        await page.mouse.click(650,280);await page.keyboard.type('FixturePass123!');
        await page.mouse.click(650,468);await page.waitForTimeout(10000);
        await page.mouse.click(550,300);
        for(let n=0;n<60&&!packets.some(s=>s.includes('%xt%jr%'));n++)await page.waitForTimeout(500);
        assert.ok(packets.some(s=>s.includes('%xt%jr%')),name+' must join');
        await page.waitForTimeout(4000);
        await page.screenshot({path:`.validation/local-stack/ironman-ready-${name}.png`});
        console.log('Ready',name);
        return {page,packets};
    }
    try{
        const actor=await login('testmod');const observer=await login('testuser');
        await actor.page.bringToFront();
        await actor.page.keyboard.press('d');await actor.page.waitForTimeout(1500);
        await actor.page.screenshot({path:'.validation/local-stack/ironman-flying.png'});
        await observer.page.screenshot({path:'.validation/local-stack/ironman-observer-flight.png'});
        assert.ok(observer.packets.some(s=>s.includes('%xt%sf%')&&s.includes('%26%')),'Observer must receive dance');
        await actor.page.mouse.click(600,740);await actor.page.waitForTimeout(1800);
        await actor.page.screenshot({path:'.validation/local-stack/ironman-landed.png'});
        for(const name of ['testmod','testuser']){
            assert.ok(results.effects.some(e=>e.name===name&&e.text.includes('WandCostume flight 102')),'Both clients must execute flight');
            assert.ok(results.effects.some(e=>e.name===name&&e.text.includes('WandCostume landed 102')),'Both clients must land after moving');
        }
        await actor.page.keyboard.press('d');await actor.page.waitForTimeout(1000);
        await actor.page.keyboard.press('t');await actor.page.mouse.click(950,350);
        await actor.page.waitForTimeout(60);
        await Promise.all([
            actor.page.screenshot({path:'.validation/local-stack/ironman-repulsor.png'}),
            observer.page.screenshot({path:'.validation/local-stack/ironman-observer-repulsor.png'})]);
        await actor.page.waitForTimeout(600);
        assert.ok(observer.packets.some(s=>s.includes('%xt%sb%')),'Observer must receive shot');
        for(const name of ['testmod','testuser'])assert.ok(results.effects.some(e=>e.name===name&&e.text.includes('WandCostume repulsor 102')),'Both clients must execute repulsor');
        results.frames=observer.packets.filter(s=>s.includes('%xt%sf%')||s.includes('%xt%sb%'));
        assert.deepEqual(results.errors,[]);
        assert.equal(results.extensionLoaded.filter(r=>r.status===200).length,2);
        console.log(JSON.stringify(results,null,2));
    }finally{
        fs.writeFileSync('.validation/local-stack/ironman-results.json',JSON.stringify(results,null,2));
        await browser.close();
    }
})().catch(e=>{console.error(e);process.exitCode=1});
