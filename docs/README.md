# Documentation Index

These documents define the current project baseline. More specific decision records override general summaries where they address the same decision. Implementation must not silently contradict them; material changes require an updated authoritative document or a new decision record.

## Governance

- [Autonomous Mandate](project/AUTONOMOUS_MANDATE.md) — authority, owner boundaries, security, cost control, and project independence. This is the governing product mandate.

## Design

- [Concept Selection](design/CONCEPT_SELECTION.md) — selection criteria, finalists, rationale, and prototype assumptions.
- [Game Vision](design/GAME_VISION.md) — player promise, identity, pillars, anti-pillars, ethics, visual direction, and risks.
- [Core Loop and Systems](design/CORE_LOOP_AND_SYSTEMS.md) — authoritative system-level design, terminology, and launch/future boundaries.
- [MVP Specification](design/MVP_SPEC.md) — scoped first playable vertical slice, tuning parameters, acceptance tests, and reconsideration gates.
- [Revision 0.2 Playtest Response](design/REVISION_0.2_PLAYTEST_RESPONSE.md) — authoritative
  provisional redesign direction following the first browser playtest.

## Playtests

- [PLAYTEST-0001: First Owner Browser Playtest](playtests/PLAYTEST-0001-owner.md) — direct player
  observations, project-lead diagnosis, resulting decisions, and questions for later testing.

## Architecture and validation

- [Technical Direction](architecture/TECHNICAL_DIRECTION.md) — provisional repository shape, system boundaries, determinism, authority, persistence, testing, accessibility, and security.
- [Simulation and Telemetry](testing/SIMULATION_AND_TELEMETRY.md) — bot policies, replay, simulation studies, metrics, and privacy limits.
- [Roadmap](roadmap/ROADMAP.md) — phased outputs and evidence gates without calendar promises.
- [Phase 1 Core Foundation](implementation/PHASE1_CORE_FOUNDATION.md) — implemented package
  boundaries, deterministic rules, replay, simulation, validation, and limitations.
- [Phase 1 Browser Prototype](implementation/PHASE1_BROWSER_PROTOTYPE.md) — local player-facing loop,
  safe rendering boundary, command-log persistence, accessibility, testing, and limitations.

## Decision records

- [ADR-0001: Player-authored shared Atlas](decisions/ADR-0001-player-authored-shared-atlas.md) — the central internet-native mechanic.
- [ADR-0002: Deterministic game core](decisions/ADR-0002-deterministic-game-core.md) — isolation of rules for replay, simulation, and server authority.
- [ADR-0003: Phase 1 toolchain and workspace](decisions/ADR-0003-phase1-toolchain-and-workspace.md) —
  implemented TypeScript workspace, validation, and dependency choices.
- [ADR-0004: Local browser authority and command log](decisions/ADR-0004-local-browser-authority-and-command-log.md) —
  in-process prototype authority, safe projections, replay persistence, and replacement criteria.
- [ADR-0005: Revision 0.2 resource and return model](decisions/ADR-0005-revision-0.2-resource-and-return-model.md) —
  Provisions, Charges, Vessel Integrity, Return Reserve, salvage families, Findings, and replay versioning.
- [ADR-0006: Commission and preparation loop](decisions/ADR-0006-commission-and-preparation-loop.md) —
  deterministic Commission purpose, reward timing, temporary preparation, Atlas Contribution, and protocol-3 replay transition.

## Decision labels

- **Design lock:** central premise that requires explicit reconsideration to change.
- **Provisional decision:** current professional direction, intentionally reversible when evidence warrants.
- **Tuning parameter:** numeric or content value expected to change through testing.
- **Deferred decision:** deliberately left open until a stated validation stage.
