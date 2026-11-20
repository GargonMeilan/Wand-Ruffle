_global.waterRefreshes = 0;
_global.fixtureShell = new Object();
_global.fixtureShell.getLocalizedFrame = function() { return 4; };
_global.fixtureShell.hideLoading = function() { trace("FIXTURE hideLoading"); };
_global.fixtureShell.startGameMusic = function() {};
_global.fixtureShell.getMyPlayerId = function() { return 1; };
_global.fixtureShell.isMyPlayerMember = function() { return true; };
_global.fixtureShell.isItemOnMyPlayer = function() { return false; };
_global.fixtureShell.getMyPlayerHex = function() { return 3368652; };
_global.getCurrentShell = function() { return _global.fixtureShell; };
_root.myPlayer = {Colour:1};
_root.myCrumbs = {colors:{}};
_root.showWindow = function() { trace("FIXTURE gameOver"); };
_global.fixtureShell.getPlayerColoursObject = function() { return {}; };
_global.fixtureShell.getPlayerObjectById = function() { return {colour_id:1}; };
_global.fixtureShell.getGamesPath = function() { return "/media/play/v2/games/"; };
_global.fixtureShell.logLoadGameTime = function() {};
_global.fixtureShell.showLoading = function() { trace("FIXTURE showLoading"); };
_global.fixtureShell.loadingScreenLoadProgress = function() {};
_global.fixtureShell.sendAS3StopNotificationServices = function() {};
var SHELL = _global.fixtureShell;
function removeRoom() {}
function removeGame() {}
function setGameOverRoom() {}
function trackGameStarted() {}
var AS3Manager = {isUnderAS3:function() { return true; }};
var PROGRESS_RATE = 40;
function loadGame(game_ob)
{
   var _loc7_ = !(_global.getCacheVersion() == undefined || _global.getCacheVersion() == "") ? "?cacheVersion=" + _global.getCacheVersion() : "";
   var _loc6_ = game_ob.path + _loc7_;
   var _loc9_ = game_ob.name;
   removeRoom();
   removeGame();
   setGameOverRoom(undefined);
   this.createEmptyMovieClip("game_mc",100);
   game_mc.createEmptyMovieClip("load_mc",1);
   game_mc._lockroot = true;
   game_mc.myCrumbs = new Object();
   game_mc.myCrumbs.colors = SHELL.getPlayerColoursObject();
   var _loc4_ = SHELL.getPlayerObjectById(SHELL.getMyPlayerId());
   game_mc.myPlayer = new Object();
   game_mc.myPlayer.Colour = _loc4_.colour_id;
   var _loc3_;
   if(com.clubpenguin.world.rooms.common.triggers.PlayerAction.isPlayer(_loc4_,com.clubpenguin.world.rooms.common.triggers.PlayerAction.WALKING_PUFFLE) && !_loc4_.attachedPuffle.isWildPuffle())
   {
      switch(_loc4_.attachedPuffle.color)
      {
         case "blue":
            _loc3_ = 750;
            break;
         case "pink":
            _loc3_ = 751;
            break;
         case "black":
            _loc3_ = 752;
            break;
         case "green":
            _loc3_ = 753;
            break;
         case "purple":
            _loc3_ = 754;
            break;
         case "red":
            _loc3_ = 755;
            break;
         case "yellow":
            _loc3_ = 756;
            break;
         case "white":
            _loc3_ = 757;
            break;
         case "orange":
            _loc3_ = 758;
            break;
         case "brown":
            _loc3_ = 759;
            break;
         default:
            _loc3_ = _loc4_.hand;
      }
      game_mc.myPlayer.Hand = _loc3_;
   }
   game_mc.myMediaPath = SHELL.getGamesPath().split("/").slice(0,-2).join("/") + "/";
   game_mc.checkPlayerItem = LEGACY_checkPlayerItem;
   game_mc.showWindow = LEGACY_showWindow;
   game_mc.joinRoom = LEGACY_joinRoom;
   var loader = new MovieClipLoader();
   var gameURL = _loc6_;
   loader.loadClip(gameURL,game_mc.load_mc,"game.as loadGame()");
   trackGameStarted(game_ob.key);
   SHELL.sendAS3StopNotificationServices();
   var listener = new Object();
   listener.onLoadError = function(target_mc, errorCode, httpStatus)
   {
      _trackerAS2.sendToAS3LogError("Movieclip load error","Loading game: " + gameURL,"httpStatus:" + httpStatus + " errorCode:" + errorCode);
   };
   listener.onLoadProgress = function(target_mc, bytes_loaded, bytes_total)
   {
      var _loc1_ = Math.floor(bytes_loaded / bytes_total * 100);
      SHELL.loadingScreenLoadProgress(bytes_loaded,bytes_total);
      WINDOW.progressbar_mc.gotoAndStop(_loc1_);
   };
   listener.onLoadInit = function(target_mc)
   {
      SHELL.logLoadGameTime(getTimer());
      loader.removeListener(listener);
      SHELL.hideLoading();
      SHELL.startGameMusic();
   };
   SHELL.showLoading();
   loader.addListener(listener);
   __listener = listener;
   if(AS3Manager.isUnderAS3())
   {
      clearInterval(__progressInterval);
      __progressInterval = setInterval(trackProgress,PROGRESS_RATE,this.game_mc.load_mc);
   }
}
function trackProgress(mc)
{
   if(mc.getBytesLoaded() == mc.getBytesTotal() && mc.getBytesTotal() > 4)
   {
      __listener.onLoadInit(mc);
      clearInterval(__progressInterval);
   }
   __listener.onLoadProgress(mc,mc.getBytesLoaded(),mc.getBytesTotal());
}
_global.fixtureShell.getCurrentServerRoomId = function() { return 995; };
_global.fixtureShell.getCookie = function() { return {mode:0}; };
_global.fixtureAir = {listeners:{}};
_global.fixtureAir.addListener = function(cmd, fn, ctx) { this.listeners[cmd] = {fn:fn,ctx:ctx}; };
_global.fixtureAir.removeListener = function() {};
_global.fixtureAir.receive = function(cmd, args) { var l=this.listeners[cmd]; l.fn.apply(l.ctx,args); };
_global.fixtureAir.send = function(ext, cmd, data) {
 trace("WATER send " + cmd + " " + data);
 if(cmd == "gz") {
 var t=setInterval(function() {
 clearInterval(t);
 _global.fixtureAir.receive("gz",[[995]]);
 var art = com.clubpenguin.games.cardjitsu.water.card.GameCardArtwork.prototype;
 art.fixtureApply = art.applyDefinition;
 art.applyDefinition = function(def) { _global.waterRefreshes++; return this.fixtureApply(def); };
 _global.fixtureAir.receive("zm",[[995,"po&0"]]);

 _global.fixtureAir.receive("zm",[[995,"bi&7&10-3-0,11-3-0,12-3-0,13-3-0,14-3-0,15-3-0,16-3-0|20-3-0,21-3-0,22-3-0,23-3-0,24-3-0,25-3-0,26-3-0|30-0-2,31-1-2,32-2-2,33-0-2,34-1-2,35-2-2,36-0-2|40-1-2,41-2-2,42-0-2,43-1-2,44-2-2,45-0-2,46-1-2|50-2-2,51-0-2,52-1-2,53-2-2,54-0-2,55-1-2,56-2-2|60-0-2,61-1-2,62-2-2,63-0-2,64-1-2,65-2-2,66-0-2|70-1-2,71-2-2,72-0-2,73-1-2,74-2-2,75-0-2,76-1-2|80-2-2,81-0-2,82-1-2,83-2-2,84-0-2,85-1-2,86-2-2"]]);

 _global.fixtureAir.receive("zm",[[995,"ci&1-0|11-1|21-2|4-3|15-4|26-5|71-6"]]);
 },100);
 }
 if(cmd == "zm" && data[0] == 103 && !_global.waterStarting) {
 _global.waterStarting = true;
 var start = setInterval(function() {
 clearInterval(start);
 _global.fixtureAir.receive("zm",[[995,"bv&8&4"]]);
 _global.fixtureAir.receive("zm",[[995,"cv&10&0"]]);
 _global.fixtureAir.receive("zm",[[995,"pi&0|Tester|1|1,6&1|Sensei|14|3,6"]]);
 trace("WATER playing");
 },3000);
 }

};
_global.getCurrentAirtower = function() { return _global.fixtureAir; };
_global.getCurrentInterface = function() { return {}; };
loadGame({path:"/media/play/v2/games/water/water.swf",name:"water",key:"water"});
setInterval(function() {
 var g = game_mc.load_mc.game;
 trace("WATER state " + g.__dialogsReady + " " + g.__boardReady + " " + g.__playerReady + " " + g.engineRunning + " " + _global.waterRefreshes);
},1000);
stop();
