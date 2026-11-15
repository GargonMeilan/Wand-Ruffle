# Online player monitoring

[English](online.md) · [Español](online.es.md) · [Documentation](README.md)

## Access

Open **Online players** at `/manager/online` using a moderator account. Both the page and `/manager/online/data` check the session and permissions on every request. Responses are not cached.

## Available information

The table shows username/ID, world, room, client type (Legacy or Vanilla) and connection duration. Igloos and backyards include the owner's ID.

Search by name, ID or location, or filter by world. The page refreshes every five seconds and offers a manual refresh control. If the API fails, it clears old rows rather than presenting them as current.

The monitor does not expose player IPs, email addresses, access keys or passwords. It does not retain a persistent movement history.

## Data freshness

| Stage | Timing |
| --- | --- |
| World publication to Redis | Every 5 seconds |
| Manager refresh | Every 5 seconds |
| Redis snapshot expiry | 20 seconds |

Typical observation delay is up to ten seconds. A healthy world with no players is different from a world with no recent snapshot; the panel displays that distinction. If a world stops abruptly, its snapshot expires automatically.

Publication failures are logged and retried without stopping the world.

## Coverage

The four configured worlds are Blizzard, Glaciar, Avalanche and Yeti (IDs 3100–3103). Presence supports room movement, igloos, backyards, minigames and disconnects.

Snowflake does not publish internal match locations. During Snow gameplay, the monitor only has the location still held by Houdini.

If adding a world, update `SERVERS` in `world_manager/presence.py` and use the extension's world-start wrapper for that service.

## Deployment and verification

Recreate Dash and the four world services after installing the extension. No SQL schema migration is required. See [updates](redeploy.md).

Tests cover expiry, Redis failure, task cancellation, permissions, filters and removal of stale UI data. Local integration checked two authenticated sessions in separate worlds, movement, disconnects and world recovery. See [validation](validation.md).
