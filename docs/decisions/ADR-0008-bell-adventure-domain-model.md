# ADR-0008: Bell adventure domain model

## Status

Accepted for the bounded Revision 0.3 Stage 1 experiment.

## Context

Revision 0.2 proved the deterministic core and browser loop but failed the owner playtest's
adventure and core-fantasy gate. Replacing the validated browser flow before the new model is proven
would combine domain, interface, and playtest risk. Stage 1 therefore adds one parallel, narrowly
scoped adventure path while retaining the existing Commission, preparation, route-evidence,
publication, Atlas, Drift, and summary path.

## Decision

Protocol 5 and development scenario 1.4.0 add maintained schemas and strict types for Leads, active
Lead state, encounter phases and actions, clues, discoveries, capabilities, disclosure choices,
simulated outside claims, visible Drift events, resolutions, and the player-safe adventure
projection. The browser command record advances independently to version 5; v1-v4 histories are
detected but never replayed or migrated under the new rules.

`The Bell Beneath North Mark` is the only primary Lead in the fresh adventure state. It uses the
existing preparation plan, instruments, resources, travel rules, and two known paths to North Mark.
No node or traversable route is added. Arrival activates a single-use encounter state machine and
suppresses travel, generic Observation, and salvage until descent or withdrawal resolves it.

The exact approaches are:

- Listen from the surface: no cost or damage; grants the interval clue.
- Triangulate with the Sounding Line: one Charge and one Provision; grants the fractured-shelf clue
  and reduces descent damage.
- Separate the current with the Weather Glass: one Charge and no Provision; grants the
  current-independent clue, improves interpretation, and reduces descent damage.
- Inspect shelf debris with the Field Lens: one Charge and no Provision; grants the worked-stone
  interpretive clue but does not reduce damage.
- Descend: requires a clue and costs one Provision. Damage is 2, or 1 if either Sounding Line or
  Weather Glass mitigation exists; combined mitigation never lowers it below 1.
- Withdraw: costs and damages nothing, preserves clues, and ends the Lead incomplete.

Surviving descent grants the submerged-waystone clue, Resonant Waystone Fragment discovery, and
permanent Resonance Compass capability. Reaching zero Integrity records truthful partial evidence
but grants neither discovery nor capability. A recovered fragment is banked on return, and the Lead
remains pending until an explicit share/withhold decision; generic Report publication cannot replace
that decision.

Sharing creates public Resonant Waystone knowledge and a non-traversable resonance annotation on
existing route `r-nd`, increments Atlas Contribution, and selects `Follow the Divided Resonance`.
Withholding keeps the precise discovery and `r-nd` direction private, exposes only a public anomaly,
grants the next-Expedition Compass clue, and selects `Return Before the Rival Charts the Bell`.
Neither choice changes current route truth.

Mara Venn is always projected as `Mara Venn — simulated expedition source` with explicit
`simulated-prototype` provenance. She contributes exactly one structured deterministic claim: a
partial but directionally conflicting `r-nr` claim after sharing, or a lower-quality independent
`r-nr` claim after withholding or incomplete return. This is not a real player, chat system, or
general NPC framework.

Every Bell resolution schedules `drift-event-north-mark-resonance`. It increments world revision,
changes one bounded hidden condition on existing `r-nd` or `r-nr`, preserves historical claims, and
projects only North Mark, a safe shelf/current-shift summary, and potentially stale public claim IDs.
It remains pending until explicitly acknowledged. The exact property and before/after values remain
canonical-only.

## Existing and temporary structures

- Revision 0.2 gameplay remains the existing browser-facing Commission and Report path.
- Revision 0.3 gameplay is the Bell Lead, encounter, discovery, capability, disclosure, simulated
  claim, visible Drift, and next-Lead path exercised through protocol/core/headless tests.
- A bounded bridge reuses the existing Expedition start and preparation machinery so both paths can
  coexist. It is temporary parallel support, not a second general mission-authoring system.

## Alternatives considered

- Redesign the browser first: rejected because it would test presentation and unproven rules at the
  same time.
- Replace Commissions and publication immediately: rejected because validated Revision 0.2
  regression coverage remains useful during the bounded experiment.
- Add new Deep Spur topology: rejected; an annotation on existing `r-nd` communicates direction
  without asserting traversability.
- Use ordinary Drift or free-form simulated-player copy: rejected because both would obscure the
  visible consequence and provenance contracts being tested.
- Generalize encounters or content authoring now: rejected as premature scope.

## Consequences and risks

The slice is deterministic, replayable, safe-projected, and independently testable before interface
investment. The cost is temporary parallel domain flow and some scenario-specific code. Headless
success does not establish that the experience is understandable or engaging, and browser-local
authority remains unsuitable for production or shared play.

If the bounded owner playtest again fails the adventure/core-fantasy gate, remove the Bell commands,
state, projections, runner, and version-5-only browser record after preserving the evidence in
documentation. Do not generalize the model, expand topology, or redesign the foreground browser
flow unless the slice demonstrates memorable discovery, meaningful risk, and a consequential
reveal decision.
