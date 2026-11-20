// A card only needs refreshing when its own artwork is rendered. Water emits
// the same event for every character/cell; reacting to all of them causes
// thousands of redundant colour, glow and timeline updates during startup.
com.clubpenguin.games.cardjitsu.water.card.GameCardArtworkWater.prototype.refreshFirst = function(event)
{
   if(event.target != this.card)
   {
      return;
   }
   this.hitArea = this.card.hitarea;
   this.refresh();
};
var game;
game = attachMovie("waterGameEngine","game",this.getNextHighestDepth());
