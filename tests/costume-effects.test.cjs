const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const source=fs.readFileSync('world_manager/client/costume-effects.as','utf8');
function fixture() {
    const player={player_id:102,head:1412,body:4621,face:0,neck:0,hand:0,feet:0,frame:1,avatarVO:{isSpriteTransformed:false}};
    const clips=[];
    function clip() {const c={_y:0,_x:100,is_ready:true,getNextHighestDepth:()=>100,
        createEmptyMovieClip(name){return this[name]=clip();},removeMovieClip(){this.removed=true;},
        clear(){},lineStyle(){},moveTo(){},lineTo(){},beginFill(){},endFill(){}};clips.push(c);return c;}
    const mc=clip();mc._parent=clip();
    for(const name of ['art_mc','head_mc','face_mc','neck_mc','body_mc','hand_mc','feet_mc'])mc[name]=clip();
    let ordinaryThrows=0;
    const engine={getPlayerMovieClip:()=>mc,findAngle:()=>0,findDirectionQuarters:()=>1,
        updatePlayerFrame(id,frame){player.frame=frame;mc.frame=frame;},
        snowballManager:{throwBall(){ordinaryThrows++;}}};
    const shell={getPlayerObjectById:()=>player};
    const global={getCurrentEngine:()=>engine,getCurrentShell:()=>shell};
    vm.runInNewContext(source,{_global:global,getTimer:()=>1000,setInterval:()=>1,trace:()=>{},Math});
    const effects=global.wandCostumeEffects;effects.tick();
    return {player,engine,effects,mc,clips,ordinaryThrows:()=>ordinaryThrows};
}
test('flight stops and restores all clothing offsets after movement, unequipping or transformation',()=>{
    for(const change of [f=>{f.player.frame=1;f.mc.is_moving=true;},f=>{f.player.body=0;},f=>{f.player.avatarVO.isSpriteTransformed=true;}]){
        const f=fixture();f.engine.updatePlayerFrame(102,26,false);f.effects.tick();
        assert.ok(f.mc.body_mc._y < -20);assert.ok(f.mc.wandThrusters);
        change(f);f.effects.tick();assert.equal(f.mc.body_mc._y,0);assert.equal(f.effects.flights[102],undefined);
        assert.equal(f.mc.wandThrusters.removed,true);
    }
});
test('ordinary outfits keep their dances and snowballs while Iron Man uses a temporary repulsor',()=>{
    const f=fixture();f.engine.snowballManager.throwBall(102,250,200);
    assert.equal(f.ordinaryThrows(),0);
    const beam=f.mc._parent.wandRepulsor102;assert.ok(beam);assert.equal(beam.endX,250);
    f.player.head=403;f.player.body=0;
    f.engine.updatePlayerFrame(102,26,false);assert.equal(f.player.frame,26);assert.equal(f.effects.flights[102],undefined);
    f.engine.snowballManager.throwBall(102,250,200);assert.equal(f.ordinaryThrows(),1);
});
test('compiled delivery artifact matches the recorded normalized action source',()=>{
    const meta=JSON.parse(fs.readFileSync('world_manager/client/build.json'));
    const hash=s=>createHash('sha256').update(s).digest('hex');
    assert.equal(hash(source.replaceAll('\r\n','\n')),meta.source_sha256);
    assert.equal(hash(fs.readFileSync('world_manager/client/rooms_common.swf')),meta.output_sha256);
});
