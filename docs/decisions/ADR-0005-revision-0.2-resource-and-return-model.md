# ADR-0005: Revision 0.2 Resource and Return Model

- **Status:** Accepted and implemented for the Phase 1 prototype
- **Date:** 2026-08-25

## Context

The first owner playtest found that one six-Supply pool obscured exploration cost, observation
capacity, damage, and reward. The deterministic contracts and persisted replay therefore require a
coherent breaking revision rather than presentation-only aliases.

## Decision

Protocol 3 and scenario 1.2.0 retain 8 base Provisions, 4 base Vessel Integrity, and 2 base Charges for each
selected instrument. Travel costs 1 Provision; Observation costs one matching Charge and no
Provision; salvage costs 1 Provision before resolving. Zero Vessel Integrity fails the Expedition.
The Waystation restores the base loadout only when a new Expedition starts.

Return Reserve is deterministic breadth-first search from the current location to Lantern Harbor
over player-known route endpoints. Each leg costs 1 Provision. It ignores hazards and conditions,
excludes unrevealed routes, permits legitimately known hidden routes, and is unknown when no known
path exists. Margin warnings are comfortable at 2 or more, caution at 1, at-reserve at 0, and
below-reserve when negative, with explicit Waystation and route-unknown states. It is an estimate,
not a safety guarantee.

Salvage is data-driven and one-time per Expedition. Whisper Shoal is a 2-Provision cache; North Mark
is a 2-Findings cache; Pale Inlet repairs 1 Vessel Integrity; Far Sound and Last Cairn grant 3 and 4
Findings. Restoration is capped. The safe projection exposes family but not exact value before
resolution. Findings are unbanked until legal return, lost on failure, and may leave a bounded Trace.
Resolved salvage events preserve both the nominal scenario value and the bounded value actually
applied, plus Provision cost, net Provision change, and resulting resource totals. Presentation uses
the applied result so capped caches or repair never overstate their effect.

Browser record version 3 uses a new key and stores protocol and scenario versions. Known v1/v2
history is not migrated or replayed under changed rules; it remains untouched until confirmed targeted reset.

## Alternatives considered

- Retain one Supply pool: simpler but preserves the playtest ambiguity.
- Keep deprecated aliases: lowers caller work but creates two authoritative vocabularies.
- Compute reserve from Ground truth: more complete but leaks hidden topology.
- Migrate v1 command logs: command syntax alone cannot preserve changed deterministic outcomes.
- Reveal exact salvage values: clearer optimization but removes intended uncertainty.

## Consequences

Positive consequences are legible planning, independent observation capacity, reversible warning
thresholds, immediate salvage utility, explicit reward banking, and safe UI explanations. Negative
consequences are a breaking replay/storage transition, larger projections, more UI density, and
provisional tuning that still needs simulation and playtest evidence.

ADR-0006 extends these base maximums with one-Expedition preparation purchases and variable Charge
maximums. Revise this decision if fixed-seed simulation exposes systematic legal-action dead ends or if
playtests show reserve warnings, Charge scarcity, salvage value, or Findings banking are confusing or
produce poor choices. The final route-evidence presentation and comprehensive completion summary
remain planned.
