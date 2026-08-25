# Phase 1 Browser Prototype

## Status

This feature branch adds the first locally playable, player-facing browser prototype for The Long
Map. It presents the existing deterministic Phase 1 core through React and Vite; it does not move or
duplicate authoritative rules into UI components. It is a local development artifact, not a hosted
online game.

## Implemented loop

The interface supports every phase currently advertised by `PlayerSafeProjection.actions`: choosing
two of three instruments, starting an Expedition, traversing known routes, observing, salvaging,
returning or resolving an eligible failure, publishing zero to three Reports, and advancing required
Drift. The changed Atlas, personal Logbook, visible Traces, resources, and sanitized recent activity
remain available across local reloads.

The first screen contains the working title, tagline, a concise claims-not-truth explanation, six
baseline Reports, the known-map centerpiece, text-equivalent topology, three described instruments,
two default selections, and the departure action. No login or account is required.

## Local-authority boundary

`apps/web/src/authority.ts` owns `CanonicalState` inside an in-process local authority. React receives
only `PlayerSafeProjection`, sanitized event summaries, dispatch functions for legal commands, and
local lifecycle controls. Components derive controls only from safe affordances and never inspect or
mutate canonical state. Raw `DomainEvent` payloads are not passed into React because Phase 1 events
currently include broad canonical snapshots.

This boundary preserves the shape of a future authoritative host but does not create security. A
player controls their own browser process and storage, so browser-local Ground truth is not suitable
for a competitive, shared, persistent, or production world.

## Command-log persistence

The versioned localStorage key is `the-long-map.local-prototype.v1`. Its value stores only:

- local record version `1`;
- deterministic initial seed;
- accepted, schema-valid `PlayerCommand` values in order.

Load validates record shape and version, validates every command with `PlayerCommandSchema`, creates
the initial state, and replays each command through `applyCommand`. A rejected replay produces a safe
recovery screen without silently discarding history. Accepted commands receive monotonically
increasing IDs derived from the validated history length and are persisted only after core
acceptance. Domain events, canonical snapshots, and arbitrary React state are not persisted.

Reset requires confirmation, removes only this prototype key, and creates a fresh deterministic
world. Unrelated localStorage values are untouched.

## Default seed

The provisional development seed is `20260804`. The route between Lantern Harbor and Whisper Shoal
has zero initial hazard, so the default world always permits a simple first outward crossing and
return without unavoidable damage. Other routes retain the scenario's meaningful hazard and supply
risk. Bounded deterministic checking also confirms that after three simple resolved round trips the
seed's first Drift can mark at least one existing baseline Report potentially stale.

The seed is absent from the primary play surface and appears only under Developer details.

## Interface and visual system

- Atlas chart: fixed SVG presentation coordinates for the 12 provisional scenario nodes, filtered
  strictly by safe known node and route IDs; ordinary DOM route controls provide equivalent use.
- Expedition panel: phase-specific, affordance-driven instrument, travel, Observation, salvage,
  return, failure, publication, and Drift controls.
- Atlas Reports: reading, age, evidence quality, source class, independent corroboration, observed
  revision, and non-color staleness wording with category filtering.
- Personal Logbook: observations, publication state, Expedition provenance, and visible Traces.
- Activity: short summaries created from event kind and explicitly safe outcome fields; raw payloads
  and canonical snapshots never cross the rendering boundary.
- About/reset: prototype limitation, command count, seed detail, and confirmed targeted reset.

The original CSS/SVG presentation uses a dark shifting sea, luminous routes, current-line patterns,
cartographic labels, restrained glyphs, layered panels, responsive composition, and no external art.

## Accessibility

The page uses semantic headings and landmarks, a skip link, ordinary buttons/checkboxes/selects,
visible focus treatment, an `aria-live` outcome region, 44-pixel minimum controls, structured map
alternatives, and text or symbol indicators for selection, evidence, staleness, damage, location, and
visited state. No essential action requires hover or SVG interaction. Layout remains functional at
mobile widths. Motion is subtle and disabled under `prefers-reduced-motion` without removing state
information.

## Running locally

With Node.js 24 and pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm dev:web
```

Vite binds to `127.0.0.1`. Use `pnpm build:web`, `pnpm test:web`, and `pnpm preview:web` for the
focused browser workflows. Root typecheck, tests, build, and validation include the web package.

## Test coverage

Vitest, jsdom, and Testing Library cover initial Atlas/topology, absence of unrevealed topology,
legitimate baseline route revelation, exact loadout size, safe affordances, starting, Observation and
salvage visibility, deterministic round trip, zero-supply return precedence, publication and its
three-Report limit, publishing nothing, Drift gating/staleness, reload replay, corruption recovery,
targeted reset, accessible names, keyboard activation, reduced-motion information, and absence of
raw canonical/event snapshot content.

Existing protocol, core, property, replay, simulation, and smoke tests remain unchanged.

## Known limitations and deferred work

The prototype has one local player, one fixed scenario, provisional tuning, a compact activity
history, and no secure separation between browser owner and hidden state. It does not implement an
API, database, networking, accounts, multiplayer synchronization, hosted persistence, telemetry,
payments, production security, infrastructure, final branding, unrestricted social text, Trace
recovery commands not yet present in the core, or the deferred Waystation contribution rule. Those
remain later-phase work subject to the project evidence gates.
