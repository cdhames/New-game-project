# The Long Map

> **Working title:** not a legally cleared or final commercial name.

The Long Map is a persistent, asynchronous exploration game in which players cross a shifting
archipelago and decide which limited Observations to publish into a shared, imperfect Atlas.

## Status

This feature branch contains the first locally playable browser prototype plus the deterministic,
headless TypeScript foundation for protocol, Expedition rules, replay, player-safe projections,
tests, and seeded simulations. A local player can complete the Expedition, return or failure,
publication, changed Atlas, and Drift loop in a responsive React interface. Protocol 2 and scenario
1.1.0 implement the Revision 0.2 resource foundation: 8 Provisions, 4 Vessel Integrity, 2 Charges
per selected instrument, known-route Return Reserve, typed salvage, and Findings.

This is not a hosted online game. There is no production service, persistent online world, API,
database, deployment, account system, secure server authority, networking, or telemetry collection.
Browser-local Ground truth is suitable only for prototype validation.

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
pnpm dev:web
```

Individual checks are `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
`pnpm sim:smoke`, `pnpm test:web`, and `pnpm build:web`. The browser development server binds to
`127.0.0.1`; `pnpm preview:web` previews a production build locally. The smoke command prints
deterministic machine-readable JSON; it validates infrastructure and is not evidence that the game
is balanced.

Browser history now uses the v2 local record. If a v1 prototype history is found, the app leaves it
untouched and asks for a confirmed reset; reset removes only the known Long Map v1/v2 keys.
