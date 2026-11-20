// New visual abilities; original outfit animations take priority when present.
var abilities = _global.wandCostumeEffects;
abilities.normalize = function(n)
{
    n = Number(n) || 0;
    if ((n > 10000 && n < 20000) || (n >= 30000 && n < 40000)) n -= 10000;
    return n;
};
abilities.matchesProfile = function(player, profile)
{
    if (player == undefined || player.avatarVO.isSpriteTransformed) return false;
    for (var slot in profile.match)
        if (this.normalize(player[slot]) != profile.match[slot]) return false;
    return true;
};
abilities.profileFor = function(player, trigger)
{
    if (player == undefined || player.avatarVO.isSpriteTransformed) return undefined;
    var best;
    var score = -1;
    for (var i = 0; i < this.profiles.length; i++)
    {
        var p = this.profiles[i];
        if (!p[trigger]) continue;
        var rank = trigger == "dance" && p.priority == 40 ? 10 : p.priority;
        if (rank > score && this.matchesProfile(player, p)) { best = p; score = rank; }
    }
    return best;
};
abilities.matches = function(player) { return this.profileFor(player, "dance") != undefined; };
abilities.circle = function(mc, x, y, radius, color, alpha, width)
{
    mc.lineStyle(width, color, alpha);
    for (var i = 0; i <= 24; i++)
    {
        var a = i * Math.PI / 12;
        if (i == 0) mc.moveTo(x + radius, y);
        else mc.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
    }
};
abilities.star = function(mc, x, y, radius, color)
{
    mc.lineStyle(1, color, 100); mc.beginFill(color, 100);
    for (var i = 0; i <= 10; i++)
    {
        var a = i * Math.PI / 5 - Math.PI / 2;
        var r = i % 2 == 0 ? radius : radius * 0.45;
        if (i == 0) mc.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else mc.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    mc.endFill();
};
abilities.drawDance = function(f, age)
{
    var mc = f.mc.wandThrusters;
    var mode = f.profile.dance;
    var color = f.profile.color;
    var phase = (age % 850) / 850;
    this.circle(mc, 0, -4, 8 + phase * 30, color, 80 * (1 - phase), mode == "stomp" ? 4 : 2);
    if (mode == "shield")
    {
        this.circle(mc, 0, -20, 19, 0xEC4651, 65, 4);
        this.circle(mc, 0, -20, 14, 0xF4F9FF, 75, 3);
        this.circle(mc, 0, -20, 9, 0x286AB0, 90, 5);
        this.star(mc, 0, -20, 6, 0xFFFFFF);
    }
    for (var j = 0; j < 8; j++)
    {
        var angle = j * Math.PI / 4 + age / 900;
        var px = Math.cos(angle) * 23;
        var py = -20 + Math.sin(angle) * 13;
        mc.lineStyle(2, color, 80);
        if (mode == "lightning")
        { mc.moveTo(px, -55); mc.lineTo(px - 5, -36); mc.lineTo(px + 6, -39); mc.lineTo(px - 2, -15); }
        else if (mode == "web")
        { mc.moveTo(0, -6); mc.lineTo(Math.cos(angle) * 35, -6 + Math.sin(angle) * 20); }
        else if (mode == "ice" || mode == "snow")
        { mc.moveTo(px - 3, py); mc.lineTo(px + 3, py); mc.moveTo(px, py - 4); mc.lineTo(px, py + 4); }
        else if (mode == "fire")
        { mc.moveTo(px - 3, -3); mc.lineTo(px, -15 - phase * 14); mc.lineTo(px + 3, -3); }
        else if (mode == "construct")
        { mc.moveTo(px - 3, py - 3); mc.lineTo(px + 3, py - 3); mc.lineTo(px + 3, py + 3); mc.lineTo(px - 3, py + 3); mc.lineTo(px - 3, py - 3); }
        else if (mode == "saber")
        { if (j < 2) { mc.lineStyle(4, color, 70); mc.moveTo(px, py); mc.lineTo(-px, py - 20); } }
        else this.circle(mc, px, py, 2 + phase * 2, color, 75, 2);
    }
};
abilities.drawShot = function(mc, age)
{
    var kind = mc.kind;
    var duration = kind == "shield" ? 900 : 550;
    if (age > duration) { mc.removeMovieClip(); return; }
    var t = age / duration;
    var alpha = 100 * (1 - t * 0.7);
    mc.clear();
    if (kind == "lightning" || kind == "web" || kind == "saber" || kind == "sonic")
    {
        mc.lineStyle(8, mc.color, alpha * 0.35); mc.moveTo(mc.startX, mc.startY); mc.lineTo(mc.endX, mc.endY);
        mc.lineStyle(2, kind == "web" ? 0xFFFFFF : mc.color, alpha);
        mc.moveTo(mc.startX, mc.startY);
        for (var i = 1; i <= 10; i++)
        {
            var dx = mc.startX + (mc.endX - mc.startX) * i / 10;
            var dy = mc.startY + (mc.endY - mc.startY) * i / 10;
            if (kind == "lightning" && i < 10) dx += (i % 2 ? 10 : -10);
            mc.lineTo(dx, dy);
            if (kind == "sonic") this.circle(mc, dx, dy, 5 + t * 10, mc.color, alpha, 2);
        }
        if (kind == "web")
        {
            this.circle(mc, mc.endX, mc.endY, 20, mc.color, alpha, 2);
            this.circle(mc, mc.endX, mc.endY, 10, mc.color, alpha, 1);
            for (var k = 0; k < 8; k++)
            { mc.moveTo(mc.endX, mc.endY); mc.lineTo(mc.endX + Math.cos(k * Math.PI / 4) * 20, mc.endY + Math.sin(k * Math.PI / 4) * 20); }
        }
        else this.star(mc, mc.endX, mc.endY, 5 + t * 8, 0xE9FAFF);
        return;
    }
    var progress = kind == "shield" ? (t < 0.5 ? t * 2 : (1 - t) * 2) : Math.min(1, t * 1.4);
    var x = mc.startX + (mc.endX - mc.startX) * progress;
    var y = mc.startY + (mc.endY - mc.startY) * progress - Math.sin(progress * Math.PI) * 22;
    if (kind == "shield")
    {
        this.circle(mc, x, y, 12, 0xEC4651, 100, 4); this.circle(mc, x, y, 8, 0xFFFFFF, 100, 3);
        this.circle(mc, x, y, 5, 0x286AB0, 100, 3); this.star(mc, x, y, 4, 0xFFFFFF);
    }
    else if (kind == "ice" || kind == "snow" || kind == "crystal")
    { this.star(mc, x, y, kind == "snow" ? 6 : 11, mc.color); this.circle(mc, x, y, 13, mc.color, 35, 2); }
    else if (kind == "construct")
    { mc.lineStyle(3, mc.color, 100); mc.moveTo(x - 9, y - 9); mc.lineTo(x + 9, y - 9); mc.lineTo(x + 9, y + 9); mc.lineTo(x - 9, y + 9); mc.lineTo(x - 9, y - 9); }
    else
    {
        this.circle(mc, x, y, kind == "rock" ? 11 : 8, mc.color, 90, kind == "rock" ? 8 : 6);
        this.circle(mc, x, y, 3, 0xF5FBFF, 90, 3);
        for (var j = 1; j < 5; j++) this.circle(mc, x - j * 4, y + j * 2, 4 - j * 0.6, mc.color, 65 - j * 10, 3);
    }
};
abilities.repulsor = function(id, x, y, profile)
{
    if (typeof(_global.getCurrentInterface) == "function")
    {
        var ignored = _global.getCurrentInterface().getIgnoreList();
        for (var i = 0; i < ignored.length; i++) if (ignored[i].player_id == id) return;
    }
    if (profile.shot == "beam") { if (!this.ironManRepulsor(id, x, y)) return; }
    else
    {
        this.stopFlight(id);
        var mc = this.engine.getPlayerMovieClip(id);
        if (!mc.is_ready || mc.is_moving) return;
        var angle = this.engine.findAngle(mc._x, mc._y, x, y);
        this.engine.updatePlayerFrame(id, 26 + this.engine.findDirectionQuarters(angle), false);
        var shot = mc._parent.createEmptyMovieClip("wandRepulsor" + id, mc._parent.getNextHighestDepth());
        shot.startX = mc._x; shot.startY = mc._y - 14; shot.endX = x; shot.endY = y;
        shot.kind = profile.shot; shot.color = profile.color; shot.started = getTimer();
        shot.onEnterFrame = function() { _global.wandCostumeEffects.drawShot(this, getTimer() - this.started); };
    }
    trace("WandCostume shot " + profile.id + " " + id);
};
