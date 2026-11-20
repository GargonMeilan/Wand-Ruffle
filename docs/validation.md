# Validation and compatibility

[English](validation.md) · [Español](validation.es.md) · [Documentation](README.md)

## How to interpret results

This page distinguishes automated coverage, previously recorded local integration and deployment-specific verification. A successful loader, TCP echo or preview does not establish a complete playable event.

The baseline integration merged in PR #1 passed both GitHub Actions jobs: general validation and backend build/startup. The [recorded workflow](https://github.com/GargonMeilan/wand-ruffle/actions/runs/43653518711) completed successfully. Its associated documentation commit was `dfd3bed`; later documentation revisions do not represent a new game compatibility test.

## Automated coverage

| Group | Coverage |
| --- | --- |
| JavaScript tests | Legacy/Vanilla options, HTTPS/WSS, Snow parameters, reload notices and player-list behavior |
| Python tests | Catalogue integrity/state, room publications/restoration, revisions, routes, permissions, presence and Websockify framing |
| Compose | Base, direct-access, compatibility and generated Dokploy configurations |
| Nginx | Separate domains, prefixes, shared host, Flash fallback, CAPTCHA and WASM MIME |
| Proxy chain | Nginx → Websockify → TCP, fixed destinations, origin rejection and registration POST preservation |
| Data/mounts | PostgreSQL/Redis persistence after recreation and missing-source mount behavior |
| Backends | Image builds, cold start, protocol readiness and coordinated recovery |

The catalogue revision recorded 34 Python tests and 12 JavaScript tests. Test counts describe that revision; use the current runner output for later versions.

## Recorded local integration

On 13 November 2026, an isolated Docker stack was used to verify real sessions, the manager, room configurations and resource delivery. The later catalogue checks included all 16 packages and their referenced resources.

A Chromium/Ruffle session authenticated, selected Blizzard and loaded Marvel Town with music 325. The monitor observed users across worlds, moves and disconnects. State survived Dash recreation.

See [the detailed local report](local-validation.md). These are recorded results, not a claim that every installation or browser behaves identically.

## Known limitations

### Surf: blue screen on entry

Catchin' Waves could initialize its menu during the loading frame and remain
blue in Ruffle 0.7.1. The compatibility copy in `web/compat/CatchinWaves.swf`
defers initialization to the following tick. Nginx serves it at the original URL
with CORS and no caching. Submodule media remain intact. Rebuild and redeploy
**web**, then reload the browser with Ctrl+F5 to apply the fix.

The isolated fixture retains the engine classes and AS3/AVM1 layout, checking
the menu and entry into Freestyle with different download timings. It does not
certify coins, stamps or a complete authenticated game.

```sh
python scripts/build-waves-fix.py --ffdec .validation/ffdec/ffdec.jar
python tests/build-waves-fixture.py --ffdec .validation/ffdec/ffdec.jar
node tests/waves-browser-smoke.cjs
```

The patched SWF is included. FFDec 26.3.0, Java and Playwright are only needed
to rebuild it or run the test. Hashes are recorded in `web/compat/waves-build.json`.

### Card-Jitsu Water: startup freeze

Each card reacted to render events from all characters and cells. The isolated
fixture reproduced 9,625 card refreshes during startup. The fix in
`web/compat/water-frame.as` filters for the card's own artwork and reduces that
to 14. In Chromium/Ruffle 0.7.1 the first heartbeat improved from about 12 seconds
to about 3 seconds.

The fixture retains engine classes and AS3/AVM1 nesting. It checks board and
card readiness, engine startup and card selection, including a delayed locale
download. Server packets are simulated; a complete authenticated match and all
reported crashes remain unverified. Docker was unavailable for Nginx checks.

```sh
python scripts/build-water-fix.py --ffdec .validation/ffdec/ffdec.jar
python tests/build-water-fixture.py --ffdec .validation/ffdec/ffdec.jar
node tests/water-browser-smoke.cjs
```

The patched SWF and hashes (`web/compat/water-build.json`) are included. Nginx
serves it at the original URL with CORS and no cache. Rebuild and redeploy **web**,
then refresh with Ctrl+F5. Submodule media remain intact.

### Other limitations

| Area | Remaining limit |
| --- | --- |
| Card-Jitsu Snow | Context/socket fixes and regression tests do not certify a complete match |
| Card-Jitsu Water | Render storm fixed in isolation; full authenticated match pending |
| Historical events | Resources checked; powers, transformations, tasks, rewards and full purchases not certified |
| Activation | A legacy activation URL returned 404 in the local test; accounts were already active |
| Membership | A historical URL omitted the nonstandard local port and failed |
| Social autocomplete | The observed preflight lacked a valid CORS response |
| CAPTCHA | Real keys and the full account flow need installation-specific checks |
| Browsers | Chromium evidence does not certify Firefox/Edge or every AS2/AS3 module |
| Public hosting | TLS, certificates, Traefik and real domains were outside the local HTTP test |

The observed inherited requests were `/social/autocomplete/v2/search/clientRules`, `/play//web_service/activate_player.php` and `/web-service/membership`. They did not prevent the recorded room session; no fake success responses were added to hide them.

## Verification after deployment

Check real account creation/activation if enabled, authentication, world selection, room entry, audio, reconnects and moderator workflows. Inspect network/console errors and WS/WSS upgrades. Verify persistent state with a controlled recreation and test the browsers you intend to support.

Use [development](development.md) for reproducible commands and [deployment](ruffle.md) for operational checks. Keep statements about supported behavior tied to those results.
