# Updates, backups and recovery

[English](redeploy.md) · [Español](redeploy.es.md) · [Documentation](README.md)

## Preserve the deployment identity

Use the existing application, Compose project name, credentials and persistent volumes. The volumes are named from `COMPOSE_PROJECT_NAME`, with `wand` as the fallback.

| Storage | Preserve |
| --- | --- |
| PostgreSQL | Database backup and existing `postgres_data` binding |
| Redis | Existing `redis_data` binding and persistence policy |
| World manager | Entire `world_data` volume: SQLite database and `assets/` |
| Configuration | Environment values, selected branch, domains and Compose project arguments |

Take a consistent database/world-state backup before changes. Do not run `down -v`, select Fresh Volumes or delete the application as an update procedure.

## Migration from older bind mounts

Older configurations stored PostgreSQL and Redis in `./.data` and `./.redis`. The current configuration uses named volumes outside the checkout.

Changing the Compose file does not copy those directories into the new volumes. An installation with accounts/progress to preserve needs a separate backup and migration with the relevant services stopped. Retain the old data until the migrated installation is verified.

Changing back to older code must not accidentally restore checkout-relative data mounts.

## Routine update

1. Review the changes and known compatibility limits.
2. Back up data and record the existing project/volume configuration.
3. Fetch the intended branch and initialize its pinned submodules.
4. Validate the chosen Compose configuration.
5. Build and recreate the complete stack using the same project/environment.
6. Check health, account access, world entry, manager state and player presence.

For a directly managed checkout using the direct-access override:

~~~sh
git pull --ff-only
git submodule update --init --recursive
docker compose -f docker-compose.yml -f docker-compose.direct.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.direct.yml up -d --build --force-recreate --wait --wait-timeout 180
~~~

These commands recreate services and can interrupt active sessions. Use only the Compose files selected for that installation; do not add direct ports to a Dokploy deployment.

## Dokploy checkout replacement

The backends bind-mount source code. If Dokploy replaces the checkout, reused containers can remain attached to the previous source mount.

After confirming persistence outside the checkout, use Dokploy's normal Compose command with `--force-recreate --wait --wait-timeout 180` added to the `up` arguments. Keep its project name, env-file and Compose path. The Command field supplies Docker arguments, not an arbitrary shell hook.

For containers created with the older mount definitions, stop the application once before recloning/deploying. Disable Auto Deploy and cancel queued deployments during that recovery. Do not delete the application or volumes.

Current source mounts use `create_host_path: false` so Docker fails on missing source directories instead of creating directories that obstruct submodule cloning. A post-clone Compose command cannot repair a clone failure that occurred earlier.

## Startup and recovery behavior

Login waits for PostgreSQL/Redis health. Worlds also wait for login. Dash, Snowflake, web and their dependencies are coordinated in Compose. Houdini health checks require an `apiOK` protocol response.

`depends_on.restart: true` propagates explicit Compose updates/restarts. `restart: always` restarts terminated processes, not live processes that merely become unhealthy.

Use **General → Deploy** to run the whole Dokploy operation. Restarting one container does not resume an aborted Compose deployment. Inspect logs and the dependency that failed before retrying.

## Rollback and branches

Record the previous code revision before updating. Roll back code using the same project and retained volume bindings; verify that the old application can read current state. Selecting `flash` only changes client embedding and does not revert storage.

`master` is the integration branch. Keep `feature/ruffle-support` if the test server deploys from it. A merge does not change Dokploy's selected branch; later integration commits do not automatically enter that branch.

See [deployment](ruffle.md) and [validation](validation.md).
