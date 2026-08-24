# Phase 1 Core Foundation

## Status and proof

This branch establishes the first deterministic, headless implementation. It proves that a compact
versioned scenario can execute ordinary protocol commands, emit ordered replayable events, preserve
hidden Ground truth behind a player-safe projection, and run reproducible seeded bot cohorts.

It does not prove player comprehension, usability, accessibility, balance, persistent authority,
network security, scalability, or production readiness. Phase 1 is not declared complete.

## Package boundaries

- `packages/protocol` owns serializable identifiers, commands, events, rejections, Observation,
  Report, Trace, projection, and replay contracts. Zod validates protocol inputs at runtime.
- `packages/game-core` owns canonical mutable Ground truth initialized from the hidden scenario,
  injected xorshift32 RNG, command
  decisions, immutable-style evolution, replay, canonical serialization, checksums, and projections.
- `packages/sim` sees player-safe projections, enumerates ordinary commands, applies them through the
  same core boundary, retains replay data, and aggregates cohort metrics.

No package depends on React, browser or DOM APIs, a network, database, filesystem, environment
variables, wall-clock time, or ambient randomness for game outcomes.

## Command, event, RNG, and replay lifecycle

A command is schema-versioned and checked against the current phase, authorized knowledge, and
resources. A legal command advances explicit logical time, consumes only explicit RNG state when
needed, emits ordered fact events, and returns the next canonical state. Travel that reduces integrity
to zero emits `route-traversed` followed by `expedition-failed`. Rejections preserve the original state
and use a stable reason code. Events include a canonical post-event snapshot for this first replay
format; replay folds those snapshots. Consumers can identify domain outcomes from event kinds and
ordering, but snapshots remain intentionally broad and may be replaced by narrower versioned event
payloads later.

The RNG is xorshift32 with an unsigned 32-bit serializable state. Rules use integers, ordered arrays,
stable identifiers, locale-independent UTF-16 code-unit comparison, and recursive key-sorted JSON
serialization. Checksums use a stable FNV-1a summary for regression comparison, not cryptographic
security.

## Scenario and provisional tuning

Scenario `1.0.0` is an original compact archipelago with 12 nodes, 18 routes, one Waystation, two
hidden routes, route hazards and conditions, node opportunities, and six mixed-quality baseline
Reports with initial ages 6, 4, 3, 2, 1, and 0 logical steps. One hidden route is known through a
baseline route Report; the other remains unrevealed. Expeditions choose two of Sounding Line, Weather
Glass, and Field Lens; begin with six supply
and three integrity; spend supply on travel, Observation, and salvage; publish at most three valid
Observations after returning; and can leave a Trace containing at most half of eligible lost reward.

Current route and node truth is a serializable part of canonical state. Travel, Observation, and
salvage resolve against that mutable copy rather than module-level scenario data. A safe projection
shows only known local route IDs and endpoints; guessed unknown routes receive the same non-oracular
rejection as unavailable routes.

Every third resolved Expedition makes Drift due, and that requirement remains sticky until resolved.
Publication, including an empty selection, completes a returned Expedition before Drift; another
Expedition cannot start while Drift is due. An explicit Drift command uses seeded selection to choose
one or two unique routes, increments either condition or hazard with wraparound inside the integer
range 0–3, records each subject's change revision, and increments world revision. Historical
Observations and Reports remain immutable. The Atlas derives staleness from per-subject change
revisions without exposing changed values.

Corroboration is derived symmetrically from all current compatible Reports. It counts unique other
Expedition IDs at the same subject, category, value, observed revision, and logical observation time;
duplicate Reports from one Expedition and incompatible claims do not add evidence.

All names, rewards, costs, hazard thresholds, and instrument mappings are tuning parameters.

## Simulation policies

The smoke study runs 100 seeded Expeditions each for cautious return-focused, aggressive
distance-focused, and random legal-command policies. Output includes completion/failure rates,
decision steps, frontier depth, banked reward, Observations, Reports, and terminal checksum summaries.
Failed or incomplete runs retain seed, commands, events, RNG start, and terminal checksum.

The study validates deterministic infrastructure only. It is not a balance conclusion.

## Validation

Run `pnpm validate` after `pnpm install --frozen-lockfile`. It performs formatting, lint, strict
TypeScript checking, tests, builds, and the simulation smoke study. CI repeats those checks on pushes
and pull requests using only GitHub-maintained checkout and Node setup actions. CI invokes the pinned
pnpm release through `npx`, avoiding a third-party package-manager setup action.

## Known limitations and deferred work

The scenario is a compact proof fixture. Events currently carry full post-event snapshots. The policy
set is smaller than the six-policy Phase 2 target. Trace recovery, the Waystation contribution project,
multi-session identity/Logbook persistence, protocol migrations, a local authority host, and extensive
balance studies remain deferred. The browser-prototype task will add the first accessible player
interface while retaining these protocol and authority boundaries. No API or production service is
created here.
