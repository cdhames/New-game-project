# Technical Direction

## Status

This architecture is **provisional** and documents intended boundaries only. No implementation, package manifest, infrastructure, or deployment configuration exists as part of this baseline.

## Proposed repository layout

```text
apps/
  web/          React + Vite browser client
  api/          Node/TypeScript authoritative API
packages/
  game-core/    pure deterministic state transitions and rules
  protocol/     versioned commands, events, identifiers, schemas
  sim/          bots, Monte Carlo runners, balance analysis
docs/           authoritative project documentation
```

TypeScript throughout with `pnpm` workspaces is the intended toolchain. Vitest is intended for unit, property, and simulation tests; Playwright for critical browser workflows; GitHub Actions for automated checks. These choices may be revised before scaffolding if compatibility evidence warrants.

## Boundaries

- **Web UI:** accessible DOM control surface and SVG and/or Canvas map rendering. It renders projected knowledge, gathers commands, and never decides authoritative outcomes.
- **API:** authenticates guest/account identity, validates commands, serializes authoritative processing, emits permitted events/projections, and coordinates persistence.
- **Protocol:** shared versioned command/event and validation schemas, with no UI or storage assumptions.
- **Game core:** pure functions over explicit state, command, seed/RNG state, and logical time. No rendering, network, wall-clock, database, filesystem, or ambient randomness.
- **Simulation:** policies that perceive allowed projections and issue ordinary commands. It may aggregate metrics but cannot bypass rules.
- **Persistence:** repositories/event stores behind interfaces; adapters do not leak database concepts into game rules.

## Deterministic state

Given the same canonical initial state, schema version, seeded RNG state, logical time, and ordered commands, the core must emit the same events and next state. Collection iteration, numeric behavior, identifiers, and serialization require canonical rules. Random results are requested through an injected seeded generator and recorded sufficiently for replay. Drift advances through explicit commands/events, never wall-clock reads inside rules.

## Command and event flow

```text
Client or bot command
  -> protocol schema validation
  -> identity/authorization and concurrency checks
  -> deterministic game-core decision
  -> ordered domain events
  -> atomic persistence
  -> player-safe projection and UI/simulator output
```

Events express facts such as Expedition started, route traversed, Observation made, Report published, Drift applied, Trace created/recovered, or Waystation contribution recorded. Rejections use stable structured reasons. Replay folds version-compatible events into state; migrations or explicit upcasters handle later schema evolution.

## Server authority

Persistent or competitively meaningful actions are server-validated. The client receives only knowledge it is entitled to see; hidden Ground truth and unrevealed outcomes remain server-side. Optimistic UI may predict presentation but must reconcile to authoritative events. Commands carry identity, expected revision/idempotency data, and are safe against duplicate delivery. Single-player local prototypes may use an in-process authority implementing the same boundary.

## Persistence evolution

Phase 1 may use memory or local durable storage behind interfaces. Phase 2 needs reproducible scenario/event fixtures. A later API prototype may use a simple transactional adapter. PostgreSQL is the likely production target only after the loop validates. Event history versus snapshot strategy, hosting provider, migrations, backup/restore targets, retention, and regional deployment are deferred.

## Identity

Guest-first identity uses a durable pseudonymous credential without mandatory registration. Account linking and recovery arrive later and must preserve history without exposing secrets to the client or repository. Authorization is resource-scoped. Public provenance should avoid personally identifying information.

## Testing strategy

- Unit and property tests for rules, invariants, schemas, Drift, knowledge filtering, and resource accounting.
- Golden deterministic replays across versions and seeds.
- Simulation tests using diverse bot policies and Monte Carlo studies.
- Contract tests across protocol, API, persistence, and projections.
- Playwright workflows for onboarding, Expedition, publication, staleness, later-session consequence, keyboard use, and responsive layouts.
- Security tests for authorization, hidden-state leakage, replay/idempotency abuse, malformed input, and rate limits.

## Accessibility

Use semantic DOM for controls and structured alternatives to map geometry. Support keyboard and touch, focus management, scalable text, screen-reader status, non-color evidence cues, reduced motion, contrast, and usable target sizes. Canvas, if used, is a visual layer rather than the sole interaction or information model. Accessibility acceptance begins with the MVP rather than post-launch remediation.

## Security

Validate all input at trust boundaries; keep Ground truth out of client payloads and logs accessible to players; use least privilege, secret injection, dependency review, output encoding, CSRF/session protections as applicable, rate limiting, audit events, and safe error messages. Treat command replay, stale revisions, bot abuse, Atlas scraping, provenance manipulation, and telemetry linkage as threat-model subjects. Never commit credentials.

## Scaling assumptions

Early load is modest and asynchronous. Prefer correctness and observability over premature distribution. Partitioning by world/region and serialized region commands are plausible later options. Stateless API scaling, queues, caching, read projections, and database partitioning remain deferred until measurements show need. Simulations must run locally and in bounded batch jobs without production dependencies.

## Deferred decisions

Hosting/cloud provider, production database topology, event-store product, authentication vendor, analytics vendor, queue, cache, CDN, rendering choice between SVG/Canvas hybrid variants, account model, moderation tooling, deployment regions, service-level targets, monetization, and final commercial name are deliberately deferred.
