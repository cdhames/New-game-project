# ADR-0004: Local Browser Authority and Command Log

- **Status:** Accepted for the Phase 1 browser prototype
- **Date:** 2026-08-24

## Context

The first player-facing prototype must exercise the deterministic Phase 1 core without creating an
API, database, account system, networking, or hosted infrastructure. The core owns hidden Ground
truth and currently emits events containing broad canonical snapshots. A browser prototype also
needs durable local continuity and safe recovery from incompatible storage.

## Decision

Use an in-process local authority in `apps/web` for this single-process prototype. It alone owns
`CanonicalState`, validates `PlayerCommand` inputs, applies them through the deterministic game core,
and constructs `PlayerSafeProjection`. React components receive only that projection, sanitized event
summaries, legal-command dispatch functions, and local lifecycle controls.

Persist a versioned record containing the deterministic seed and ordered accepted command history.
Record version 3 stores protocol version 3 and scenario version 1.2.0 under the v3 key. Known v1 and
v2 records are left untouched and produce a recovery screen because replay outcomes changed;
confirmed reset removes only the known v1, v2, and v3 keys. No speculative migration is performed.
On load, validate every stored command with `PlayerCommandSchema` and reconstruct state by replaying
commands from the initial seed. Persist only after command acceptance. Do not store React state,
canonical snapshots, or raw Domain events.

Browser-local command IDs use `local-command-N`. Loading derives the committed sequence from the
greatest valid persisted `N`, not command count; gaps remain valid and are not rewritten. A stored
command using another otherwise valid StableId form is treated as an incompatible local record with
a recovery message. Schema-invalid, core-rejected, and failed-to-persist attempts do not consume an
accepted sequence number.

Command application is transactional at this boundary: validate and calculate candidate core state,
persist the next complete record, then commit in-memory canonical state, accepted history, activity,
and sequence. Storage failure leaves the prior authority state intact. Confirmed reset removes only
the prototype record and installs a new authority generation so the React view-owning shell remounts
with a fresh projection immediately.

## Rationale

The safe projection boundary prevents ordinary presentation code from becoming an accidental oracle
and keeps controls aligned with core-derived affordances. Validated command history is compact,
auditable, deterministic, and exercises the same replay path needed by later authority work. It also
allows incompatible or corrupt storage to fail closed without silently erasing valid history.

This approach is suitable for local loop, usability, accessibility, and presentation validation
because it requires no infrastructure while preserving the conceptual host/UI split.

## Alternatives considered

- Store arbitrary React state or a serialized projection: easy, but not authoritative, replayable, or
  sufficient to reconstruct deterministic hidden state.
- Store canonical snapshots or raw events: direct, but exposes broad hidden payloads to persistence
  consumers and couples the prototype to the current event snapshot format.
- Put rules in React reducers/components: initially convenient, but duplicates the authoritative core
  and breaks simulation, replay, and future-host consistency.
- Build the Phase 3 local API now: creates networking, persistence, concurrency, and security scope
  before the browser loop has produced evidence.

## Consequences

Positive consequences are one rule implementation, deterministic reload, small persisted records,
safe UI contracts, targeted reset, and an authority interface that can later move behind a server.
Costs include replay time growing with command history, explicit record/version and browser-local ID
compatibility, no durability guarantee beyond the browser's localStorage behavior, sanitization
discipline, and the fact that local browser owners can inspect or alter their own process and storage.

The in-process authority is therefore **not** secure server authority and is unsuitable for
competitive, shared, persistent online production. It provides architecture discipline, not a trust
boundary.

## Replacement criteria

Replace this authority with a server-authoritative host when work begins on shared persistence,
multiple clients, meaningful competitive or cooperative state, authentication, concurrency,
idempotent network delivery, protected Ground truth, operational recovery, or durable production
worlds. Replacement must preserve versioned commands, core determinism, player-safe projections,
hidden-state filtering, and replay compatibility while adding authorization, transactional
persistence, migrations, and threat-tested transport boundaries.
