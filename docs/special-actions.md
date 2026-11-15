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

On 15 November 2026, the isolated Ruffle/Houdini test passed for all four
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
modified to add these existing animations.
