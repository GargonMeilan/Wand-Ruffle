# Outfit animations and event powers

[English](special-actions.md) · [Español](special-actions.es.md) · [Documentation](README.md)

## How to use an existing special action

Equip the exact outfit, leave the other clothing slots empty unless the rule
includes them, and press **D** while the game has keyboard focus, or choose
Dance from the actions menu. Wave uses a separate set of rules. Chat input must
not have keyboard focus when using a shortcut.

These actions do not require activating an event in the manager. The client
already chooses them from the player's clothing. Colour and background are
outside the six clothing slots used for this comparison.

| Trigger | Exact clothing IDs | Animation |
| --- | --- | --- |
| Dance | Head `403`; all other slots empty | Hard Hat drill, action `36` |
| Dance | Head `465`, body `299`; other slots empty | Firefighter, action `46` |
| Dance | Head `1745`, body `24008`, feet `6212`; other slots empty | Toy Robot, action `140` |
| Wave | Face `123`, neck `302`, body `765`; other slots empty | Shadow Guy, action `39` (configuration inspected; not runtime-tested) |

## What the client and server actually do

`penguin_action_frames.json` contains 685 rules: 629 for dance (input frame 26),
54 for wave (25), and two other rules. The copy inside `game_configs.bin` matches
the loose English JSON in the inspected checkout. All external animation files
referenced by these rules are present. Ordinary wave/dance frames are built in
and do not need separate SWFs.

The shell builds a key from **head, face, neck, body, hand, feet**, then looks it
up in the selected input frame's rules. It normalizes redemption IDs in the
10001–19999 and 30000–39999 ranges by subtracting 10000. A match supplies
`secret_frame`; the engine loads `content/global/penguin/actions/<frame>.swf`.
Without a match, it uses the ordinary action. This is why an extra hat, necklace
or hand item can disable an otherwise valid special dance.

Houdini's `u/sf` handler broadcasts the input frame to the room; the clients
resolve the outfit animation. `special_dance` in the account/new-player flow
records a tutorial milestone; it is not a global power switch.

To inspect exact combinations without running Flash:

```sh
python scripts/audit-special-actions.py
python scripts/audit-special-actions.py --item 403
python scripts/audit-special-actions.py --outfit 403,0,0,0,0,0
python scripts/audit-special-actions.py --trigger wave --outfit 0,123,302,765,0,0
python scripts/audit-special-actions.py --json
```

The six IDs in `--outfit` follow the slot order above; `0` means empty. The
script checks the base configuration, not any modifications a party module may
make at runtime. Its list describes configured resources, not a guarantee that
all 685 rules work in Ruffle.

## Marvel powers are a separate mechanism

### Iron Man actions added by this fork

This fork adds flight and repulsors to Iron Man: cowl `1412` and bodysuit
`4621`. Accessories are allowed; a recognized hand weapon takes priority for
throwing, while the suit keeps its dance effect. Press **D**
or choose Dance to hover with boot thrusters. Move to land. Press **T** and
click a target to fire a repulsor instead of a snowball. Changing clothing or
transforming also ends the flight.

These are new effects implemented here, not recovered original Iron Man
animations. They use normal frame/snowball messages, so other clients running
the updated module can display them. They do not add damage, mission progress
or event rewards. An active Marvel room package is not required.

The extension source is `world_manager/client/costume-effects.as`. A compiled
copy of `rooms_common.swf` preserves Vanilla's original classes and adds this
bootstrap. Nginx serves it through Dash on both shared and separate media hosts.
The Vanilla submodule is unchanged. Deploy the updated web template and Dash
extension, then reload each game client. Java/FFDec are not required at runtime.

To rebuild after changing the action source:

```sh
python scripts/build-costume-effects.py --ffdec /path/to/ffdec.jar --java java
```

Use FFDec 26.3.0. The builder rejects an unreviewed upstream base SWF and records
source/compiler/output hashes in `world_manager/client/build.json`. Commit the
source, generated SWF and build record together. No compilation is needed to
equip the outfit, dance, shoot or change rooms.

<!-- abilities:start -->
### Expanded ability catalogue

This expansion enables **47 equipment profiles using 63 item IDs**. The table
lists the required pieces; other accessories are allowed. Redemption item IDs
are normalized as in the original client (for example Olaf `34174` matches
`24174`). No inventory items are granted and no event activation is required.

Press **D** for the dance effect, move to stop, and use **T + click** to throw.
**Existing native dances take priority** over the listed fallback. Costume
abilities take dance priority when paired with a supported weapon; that weapon
takes throw priority. These additions are new synchronized **visual effects**,
not restored original party scripts: they do not cause damage, freeze another
player, teleport the player, build furniture, or grant rewards.

The 685 original outfit/action rules remain in use. Native transformations and
ordinary clothing outside this catalogue keep their existing behavior. Profiles
live in `world_manager/client/costume-profiles.json`; the builder validates item
types and sprite availability. Rendering is in `ability-renderers.as` and both
source files plus the profile data are covered by the compiled build hashes.

| Equipped item or set | Required IDs | D fallback | T + click |
| --- | --- | --- | --- |
| Iron Man | head `1412`, body `4621` | Flight with thrusters | Repulsor |
| Iron Patriot | head `1574`, body `4828` | Flight with thrusters | Repulsor |
| Silver Centurion | head `1575`, body `4829` | Flight with thrusters | Repulsor |
| Mark 42 | head `1576`, body `4830` | Flight with thrusters | Repulsor |
| Heartbreaker | head `1577`, body `4831` | Flight with thrusters | Repulsor |
| Hulk | head `1419`, body `4632` | Stomp pulse | Heavy energy projectile |
| Red Hulk | head `1592`, body `4852` | Stomp pulse | Heavy energy projectile |
| She-Hulk | head `1593`, body `4853` | Stomp pulse | Heavy energy projectile |
| A-Bomb | head `1591`, body `4851` | Stomp pulse | Heavy energy projectile |
| Skaar | head `1594`, body `4854` | Stomp pulse | Heavy energy projectile |
| Spider-Man | body `4626` | Web aura | Web strike |
| Iron Spider | head `1590`, body `4850` | Web aura | Web strike |
| Venom | body `4627` | Web aura | Web strike |
| The Lizard | body `4629` | Energy aura | Slime projectile |
| Iron Fist | head `2064`, body `4624` | Energy aura | Energy projectile |
| Loki | head `1415`, body `4625` | Energy aura | Energy projectile |
| Nova | head `1414`, body `4623` | Flight with thrusters | Energy projectile |
| Ms Marvel | head `1413`, body `4622` | Flight with thrusters | Energy projectile |
| Captain Marvel | head `1570`, body `4824` | Flight with thrusters | Energy projectile |
| Captain America Shield | hand `5154` | Shield guard | Returning shield |
| Mjolnir | hand `5155` | Lightning aura | Lightning strike |
| Freezing Super Gloves | hand `5156` | Ice crystals | Ice projectile |
| Shocking Super Gloves | hand `5157` | Lightning aura | Lightning strike |
| Cosmic Super Gloves | hand `5158` | Energy aura | Energy projectile |
| Electro Blast Gloves | hand `5240` | Visual fade | Energy projectile |
| Force Wave Power Gloves | hand `5241` | Energy aura | Energy projectile |
| Magma Power Gloves | hand `5242` | Stomp pulse | Fireball |
| Crystal Shards Power Gloves | hand `5243` | Ice crystals | Crystal |
| Telekinesis Power Gloves | hand `5244` | Energy aura | Kinetic pulse |
| Ooze Power Gloves | hand `5245` | Energy aura | Slime projectile |
| Fireball Gloves | hand `5246` | Flames | Fireball |
| Brainwave Gloves | hand `5247` | Energy aura | Wave pulse |
| Construct Power Gloves | hand `5249` | Block aura | Block projectile |
| Snow Shuriken | hand `5225` | Ice crystals | Ice projectile |
| Fire Nunchaku | hand `5226` | Flames | Fireball |
| Water Hammer | hand `5227` | Water aura | Water projectile |
| Luke's Lightsaber | hand `5335` | Blade glow | Light beam |
| Anakin's Lightsaber | hand `5336` | Blade glow | Light beam |
| Darth Vader's Lightsaber | hand `5337` | Blade glow | Light beam |
| Blue Lightsaber | hand `5511` | Blade glow | Light beam |
| Purple Lightsaber | hand `5512` | Blade glow | Light beam |
| Dual Lightsabers | hand `5513` | Blade glow | Light beam |
| The Inquisitor's Lightsaber | hand `5514` | Blade glow | Light beam |
| Elsa's Coronation Dress | body `24177` | Ice crystals | Ice projectile |
| Elsa's Ice Queen Dress | body `24178` | Ice crystals | Ice projectile |
| Elsa's Spring Dress | body `24275` | Ice crystals | Ice projectile |
| Olaf's Costume | body `24174` | Snowflakes | Snowball |
<!-- abilities:end -->

### Original event modules

Iron Man cowl `1412` plus bodysuit `4621` has no special dance/wave entry in this
configuration. The presence of its clothing sprites alone does not establish a
power. Do not assign an unrelated animation ID as a substitute.

The compiled `rooms_common.swf` includes a **2013** `SuperHeroParty` class with
gloves `5240`–`5247` and `5249`, a stomp effect and robot/power logic. It expects
party cookie `20130424`, UI aliases, and messages including `shp#shphp`,
`shp#shpvp`, `shp#shprh` and `shpgp`. There are no corresponding `shp` handlers
in the inspected Houdini code. Its generic party cookie handler does not supply
this complete event protocol.

Making those powers work requires a compatible party initializer and engine
hooks, the matching UI/effect assets and configuration aliases, and server-side
handlers/state with equipment validation. Each power then needs a two-client
test for visibility and state consistency. The manager's **2012** Marvel room
package does not initialize this **2013** mechanic. Mixing editions would not
be a verified full event.

## Local verification

Before the new Iron Man extension, on 15 November 2026 the isolated Ruffle/Houdini test passed for all four
outfits: Hard Hat loaded action 36 and visibly drilled; Firefighter loaded
46 and visibly sprayed water; Toy Robot loaded dance 140 (and wave 143 on
equipment load); Iron Man sent/received the ordinary dance and loaded no
special action. Each keyboard dance produced a fresh server response and
none of these cases produced a JavaScript error. Screenshots were inspected.
This does not verify every outfit, room, remote spectator or event power.

`tests/special-dance-browser.cjs` uses only `tests/local-stack.py`'s disposable
Docker project, test accounts and a CLI-launched headless browser. It requires
seeded accounts from `tests/check-manager-live.py`, Playwright/Chromium as in
the other browser checks, and Ruffle media. It changes the test account's
clothing before login, presses D, checks a fresh server frame-26 response,
checks special animation downloads and saves screenshots/results under
`.validation/local-stack/`.

```sh
node tests/special-dance-browser.cjs
```

The CLI investigation used the official [FFDec](https://github.com/jindrapetrik/jpexs-decompiler)
portable release 26.3.0 to read the local shell, engine and common room module.
No SWF, production account, deployed server or event activation setting was
modified during that initial investigation. The new Iron Man extension serves
its own generated client copy; it does not edit the upstream SWF or production
accounts.

`tests/ironman-browser-smoke.cjs` checks two real connected Ruffle clients using
the disposable stack. It starts the fixture accounts' introductory quest so
the tour does not intercept game input, equips only the test account, and
captures flight, repulsor and landing. Native AVM1 traces distinguish the
effect running in each client from merely receiving a server packet.

The initial Iron Man two-client local run on 15 November 2026 passed: both clients executed
flight, landed after movement and rendered the repulsor. There were no
JavaScript errors. The change also passed 35 Python checks, 15 JavaScript
checks and the five Nginx host/path configurations. These results cover the
new Iron Man effects, not the separate original Marvel event protocol. An
existing Hard Hat dance also loaded action 36 successfully in the real client
with the extension installed.

The expanded catalogue was then checked with **all 47 profiles on two real
connected clients**, using normal server-validated equipment changes and real
D/T controls. Every profile passed its dance and throw checks on both clients;
three ninja weapons retained their native dance. There were no JavaScript
errors or missing clothing resources. The final regression passed **35 Python
and 18 JavaScript checks**. Screenshots and the build-tagged result are saved in
`.validation/local-stack/abilities-results.json` and `ability-*.png`.

Run `node tests/abilities-browser-smoke.cjs` after starting the disposable stack
to repeat the full matrix. It seeds only that fixture's accounts and inventory.
