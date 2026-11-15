// Equip only seeded disposable accounts through normal validated game packets.
// D/T remain real keyboard/mouse actions; both actual clients must run each effect.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('../.validation/node_modules/playwright');
const profiles=JSON.parse(fs.readFileSync('world_manager/client/costume-profiles.json')).profiles;
const meta=JSON.parse(fs.readFileSync('.validation/local-stack/meta.json'));
assert.ok(meta.project.startsWith('wand-local-check-'));
const compose=['compose','-p',meta.project,'-f',path.resolve('.validation/local-stack/compose.json')];
execFileSync('python',['-c',"import importlib.util;s=importlib.util.spec_from_file_location('live','tests/check-manager-live.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);m.seed()"],{stdio:'pipe'});
const ids=[...new Set(profiles.flatMap(p=>Object.values(p.match)).filter(Boolean))];
assert.ok(ids.every(Number.isInteger));
const sql="UPDATE room SET spawn=(id=100); INSERT INTO penguin_quest_task(task_id,penguin_id,complete) SELECT 1,id,FALSE FROM penguin WHERE username IN ('testmod','testuser') ON CONFLICT DO NOTHING; "+
 "INSERT INTO penguin_item(penguin_id,item_id) SELECT p.id,i.id FROM penguin p CROSS JOIN item i WHERE p.username='testmod' AND i.id IN ("+ids.join(',')+") ON CONFLICT DO NOTHING; "+
 "UPDATE penguin SET head=NULL,face=NULL,neck=NULL,body=NULL,hand=NULL,feet=NULL WHERE username IN ('testmod','testuser');";
execFileSync('docker',[...compose,'exec','-T','db','psql','-U','postgres','-d','postgres','-c',sql],{stdio:'pipe'});
execFileSync('docker',[...compose,'up','-d','--no-deps','--force-recreate','--wait','houdini_blizzard'],{stdio:'pipe',timeout:90000});
const build=JSON.parse(fs.readFileSync('world_manager/client/build.json')).output_sha256;
const startIndex=process.env.ABILITY_START?profiles.findIndex(p=>p.id===process.env.ABILITY_START):0;
assert.ok(startIndex>=0);
const report=startIndex?JSON.parse(fs.readFileSync('.validation/local-stack/abilities-results.json')):{build,profiles:[],errors:[],missingClothing:[]};
if(startIndex){assert.equal(report.build||build,build);report.build=build;report.profiles=report.profiles.filter(p=>profiles.findIndex(x=>x.id===p.id)<startIndex);}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||path.resolve('.validation/browsers/chromium-1194/chrome-win/chrome.exe'),
  args:['--host-resolver-rules=MAP *.localhost 127.0.0.1','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
 const base='http://play.localhost:'+meta.port;
 async function wait(check,message,ms=15000){const until=Date.now()+ms;while(!check()){if(Date.now()>until)throw Error(message);await new Promise(r=>setTimeout(r,100));}}
 async function login(name){
  const context=await browser.newContext({viewport:{width:1280,height:1000}});
  await context.addInitScript(()=>{const Native=window.WebSocket;window.WebSocket=class extends Native{constructor(...args){super(...args);if(String(args[0]).includes('/__wand/ws/blizzard'))window.fixtureWorldSocket=this;}};});
  const page=await context.newPage(),packets=[],effects=[];
  page.on('pageerror',e=>report.errors.push({name,error:e.message}));
  page.on('console',m=>{if(m.text().includes('WandCostume'))effects.push(m.text());});
  page.on('websocket',ws=>ws.on('framereceived',e=>packets.push(String(e.payload))));
  page.on('response',r=>{if(r.url().includes('/clothing/')&&r.status()>=400)report.missingClothing.push(r.url());});
  await page.route('**/__wand/ruffle/vanilla.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('web/ruffle/vanilla.js','utf8').replace('logLevel: "warn"','logLevel: "info"')}));
  await page.goto(base+'/');await page.locator('#penguin-login').click();
  await page.waitForResponse(r=>r.url().includes('/client/login.swf')&&r.ok(),{timeout:60000});
  await page.waitForTimeout(5000);
  await page.mouse.click(650,230);await page.keyboard.type(name);await page.mouse.click(650,280);await page.keyboard.type('FixturePass123!');
  await page.mouse.click(650,468);await page.waitForTimeout(10000);await page.mouse.click(550,300);
  await wait(()=>packets.some(s=>s.includes('%xt%jr%')),name+' join',30000);await page.waitForTimeout(4000);
  return {page,packets,effects};
 }
 let actor,observer,current;
 try{
  actor=await login('testmod');observer=await login('testuser');
  const accounts=JSON.parse(fs.readFileSync('.validation/local-stack/accounts.json')),id=accounts.testmod;
  const slots={head:'uph',face:'upf',neck:'upn',body:'upb',hand:'upa',feet:'upe'};
  for(const profile of profiles.slice(startIndex)){
   current=profile.id;
   const start=actor.packets.length;
   const expected=Object.entries(slots).map(([slot,command])=>({command,value:profile.match[slot]||0}));
   await actor.page.evaluate(rows=>{for(const row of rows)window.fixtureWorldSocket.send(new TextEncoder().encode('%xt%s%s#'+row.command+'%-1%'+row.value+'%\0'));},expected);
   await wait(()=>expected.every(r=>actor.packets.slice(start).some(s=>s.includes('%xt%'+r.command+'%')&&s.includes('%'+id+'%'+r.value+'%'))),'Equipment rejected: '+profile.id);
   await actor.page.waitForTimeout(900);
   const a=actor.effects.length,b=observer.effects.length;
   await actor.page.bringToFront();await actor.page.keyboard.press('d');
   const dance=events=>events.some(s=>s.includes('WandCostume dance '+profile.id+' '+id)||s.includes('WandCostume native '+profile.id+' '+id));
   await wait(()=>dance(actor.effects.slice(a))&&dance(observer.effects.slice(b)),'Dance missing: '+profile.id);
   await actor.page.waitForTimeout(300);
   await observer.page.screenshot({path:'.validation/local-stack/ability-'+profile.id+'-dance.png'});
   await actor.page.bringToFront();await actor.page.keyboard.press('t');await actor.page.waitForTimeout(180);await actor.page.mouse.click(950,350);
   const shot=events=>events.some(s=>s.includes('WandCostume shot '+profile.id+' '+id));
   await wait(()=>shot(actor.effects.slice(a))&&shot(observer.effects.slice(b)),'Shot missing: '+profile.id);
   await observer.page.screenshot({path:'.validation/local-stack/ability-'+profile.id+'-shot.png'});
   await actor.page.waitForTimeout(1100);await actor.page.mouse.click(600,740);await actor.page.waitForTimeout(300);
   report.profiles.push({id:profile.id,dance:actor.effects.slice(a).some(s=>s.includes('WandCostume native '))?'native':profile.dance,shot:profile.shot,bothClients:true});
   fs.writeFileSync('.validation/local-stack/abilities-results.json',JSON.stringify(report,null,2));
   console.log(report.profiles.length+'/'+profiles.length,profile.id,'OK');
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.missingClothing,[]);
 }catch(error){
  report.failure={id:current,error:error.message,actorEffects:actor?.effects.slice(-8),observerEffects:observer?.effects.slice(-8)};
  if(actor)await actor.page.screenshot({path:'.validation/local-stack/ability-failure.png'});
  throw error;
 }finally{fs.writeFileSync('.validation/local-stack/abilities-results.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
