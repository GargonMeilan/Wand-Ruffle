function launch()
{
   var game = this;
   titlescreen.gotoAndPlay("loading");
   var listener = new Object();
   listener.onLoadComplete = function()
   {
      com.clubpenguin.util.Loader.removeEventListener(listener);
      // Nested MovieClipLoader completion can precede the title clip's first
      // timeline update in Ruffle. Initialize on the following player tick so
      // that update cannot overwrite gotoAndPlay("title") with frame 1.
      var startup = setInterval(function()
      {
         clearInterval(startup);
         game.init();
      },1);
   };
   com.clubpenguin.util.Loader.addEventListener(listener);
}
