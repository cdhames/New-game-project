# The Long Map

> **Working title:** not a legally cleared or final commercial name.

The Long Map is a persistent, asynchronous exploration game in which players cross a shifting
archipelago and decide which limited Observations to publish into a shared, imperfect Atlas.

## Status

This branch begins Phase 1. It contains a deterministic, headless TypeScript foundation for the
protocol, expedition rules, replay, player-safe projections, tests, and seeded simulations.

There is no player-facing playable build yet. There is also no production service, persistent online
world, API, database, deployment, authentication, or telemetry collection.

This is an autonomous AI game-development experiment. AI project leadership makes ordinary product,
design, engineering, art-direction, balancing, testing, and roadmap decisions. The human owner
remains responsible for actions requiring accounts, permissions, money, legal consent, credentials,
or physical-world action. See the [autonomous mandate](docs/project/AUTONOMOUS_MANDATE.md).

## Documentation

The [documentation index](docs/README.md) identifies each authoritative design, architecture,
testing, roadmap, and decision record.

## Local development

Requirements: Node.js 24 or newer and pnpm 11.19.0 (the version pinned by `packageManager`).

```sh
pnpm install --frozen-lockfile
pnpm validate
```

Individual checks are `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
and `pnpm sim:smoke`. The smoke command prints deterministic machine-readable JSON; it validates
infrastructure and is not evidence that the game is balanced.
