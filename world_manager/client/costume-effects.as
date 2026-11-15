// Vanilla AVM1 extension. Original clothing stays intact; effects are new.
// Normal sf/sb packets synchronize these visuals for every client in the room.
if (_global.wandCostumeEffects == undefined)
{
    var effects = new Object();
    effects.engine = undefined;
    effects.flights = new Object();
    effects.parts = ["art_mc", "head_mc", "face_mc", "neck_mc", "body_mc", "hand_mc", "feet_mc"];
    effects.matches = function(player)
    {
        return player != undefined && player.head == 1412 && player.body == 4621 &&
            !player.face && !player.neck && !player.hand && !player.feet &&
            !player.avatarVO.isSpriteTransformed;
    };
    effects.stopFlight = function(id)
    {
        var flight = this.flights[id];
        if (flight == undefined) return;
        for (var i = 0; i < this.parts.length; i++)
        {
            var part = flight.mc[this.parts[i]];
            if (part._wandBaseY != undefined)
            {
                part._y = part._wandBaseY;
                delete part._wandBaseY;
            }
        }
        flight.mc.wandThrusters.removeMovieClip();
        delete this.flights[id];
        trace("WandCostume landed " + id);
    };
    effects.startFlight = function(id)
    {
        if (this.flights[id] != undefined) return;
        var mc = this.engine.getPlayerMovieClip(id);
        if (mc == undefined) return;
        this.flights[id] = {mc:mc, started:getTimer()};
        mc.createEmptyMovieClip("wandThrusters", mc.getNextHighestDepth());
        trace("WandCostume flight " + id);
    };
    effects.repulsor = function(id, x, y)
    {
        this.stopFlight(id);
        var mc = this.engine.getPlayerMovieClip(id);
        if (!mc.is_ready || mc.is_moving) return;
        trace("WandCostume repulsor " + id);
        var angle = this.engine.findAngle(mc._x, mc._y, x, y);
        this.engine.updatePlayerFrame(id, 26 + this.engine.findDirectionQuarters(angle), false);
        var beam = mc._parent.createEmptyMovieClip("wandRepulsor" + id, mc._parent.getNextHighestDepth());
        beam.startX = mc._x;
        beam.startY = mc._y - 14;
        beam.endX = x;
        beam.endY = y;
        beam.started = getTimer();
        beam.onEnterFrame = function()
        {
            var age = getTimer() - this.started;
            if (age > 350) { this.removeMovieClip(); return; }
            var opacity = 100 * (1 - age / 350);
            this.clear();
            this.lineStyle(9, 0x48BCEB, opacity * 0.35);
            this.moveTo(this.startX, this.startY);
            this.lineTo(this.endX, this.endY);
            this.lineStyle(4, 0x8BE8FF, opacity);
            this.moveTo(this.startX, this.startY);
            this.lineTo(this.endX, this.endY);
            this.lineStyle(1.5, 0xFFFFFF, opacity);
            this.moveTo(this.startX, this.startY);
            this.lineTo(this.endX, this.endY);
            this.lineStyle(5, 0xE9FAFF, opacity);
            this.moveTo(this.endX - 5, this.endY - 5);
            this.lineTo(this.endX + 5, this.endY + 5);
            this.moveTo(this.endX + 5, this.endY - 5);
            this.lineTo(this.endX - 5, this.endY + 5);
        };
    };
    effects.tick = function()
    {
        var engine = _global.getCurrentEngine();
        var shell = _global.getCurrentShell();
        if (engine == undefined || shell == undefined || engine.snowballManager == undefined ||
            typeof(engine.updatePlayerFrame) != "function") return;
        if (this.engine != engine)
        {
            this.engine = engine;
            this.shell = shell;
            this.flights = new Object();
        }
        if (!engine.wandCostumeHooks)
        {
            engine.wandCostumeHooks = true;
            engine.wandOriginalUpdateFrame = engine.updatePlayerFrame;
            engine.updatePlayerFrame = function(id, frame, isAction)
            {
                var fx = _global.wandCostumeEffects;
                fx.stopFlight(id);
                if (frame == 26 && fx.matches(fx.shell.getPlayerObjectById(id)))
                {
                    this.wandOriginalUpdateFrame(id, 1, false);
                    this.getPlayerMovieClip(id).frame = 26;
                    fx.shell.getPlayerObjectById(id).frame = 26;
                    fx.startFlight(id);
                }
                else this.wandOriginalUpdateFrame(id, frame, isAction);
            };
            var manager = engine.snowballManager;
            manager.wandOriginalThrow = manager.throwBall;
            manager.throwBall = function(id, x, y, snowballVO)
            {
                var fx = _global.wandCostumeEffects;
                if (fx.matches(fx.shell.getPlayerObjectById(id))) fx.repulsor(id, x, y);
                else this.wandOriginalThrow(id, x, y, snowballVO);
            };
        }
        for (var id in this.flights)
        {
            var player = shell.getPlayerObjectById(Number(id));
            var flight = this.flights[id];
            if (!this.matches(player) || player.frame != 26 || flight.mc._parent == undefined || flight.mc.is_moving)
            {
                this.stopFlight(id);
                continue;
            }
            var offset = -24 + Math.sin((getTimer() - flight.started) / 220) * 3;
            for (var i = 0; i < this.parts.length; i++)
            {
                var part = flight.mc[this.parts[i]];
                if (part != undefined)
                {
                    if (part._wandBaseY == undefined) part._wandBaseY = part._y;
                    part._y = part._wandBaseY + offset;
                }
            }
            var jets = flight.mc.wandThrusters;
            jets.clear();
            for (var side = -1; side <= 1; side += 2)
            {
                var x = side * 6;
                var y = offset + 1;
                var length = 12 + Math.random() * 7;
                jets.beginFill(0xFFB64D, 85);
                jets.moveTo(x - 3, y);
                jets.lineTo(x, y + length);
                jets.lineTo(x + 3, y);
                jets.endFill();
                jets.beginFill(0xDFF9FF, 100);
                jets.moveTo(x - 2, y);
                jets.lineTo(x, y + length * 0.6);
                jets.lineTo(x + 2, y);
                jets.endFill();
            }
        }
    };
    _global.wandCostumeEffects = effects;
    effects.timer = setInterval(effects, "tick", 40);
}
