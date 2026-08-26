# ADR-0007: Route Evidence and Expedition Outcomes

- **Status:** Accepted and implemented for the Revision 0.2 playtest candidate
- **Date:** 2026-08-26

## Context

The first owner playtest showed that route risk, Expedition purpose, rewards, and results were not
understandable. Combining route IDs, Atlas claims, and Return Reserve independently in React would
duplicate authority and risk exposing hidden Ground truth or contradictory outcomes.

## Decision

Protocol 4 and scenario 1.3.0 expose one authoritative safe travel-option collection. Each legal
option contains destination, visited status, one-Provision cost, projected Provisions, known-route
Return Reserve and margin, warning, and grouped historical route, hazard, and condition evidence.
Evidence is explicitly unknown, single-value, or conflicting-values and preserves every Report in a
deterministic order: non-stale first, then newer revision, stronger quality, greater corroboration,
lower age, and stable Report ID. Reported values remain claims; no current hidden value is projected.

Projected margin is calculated after the known travel cost and before unknown hazard resolution.
Return Reserve uses known topology only and is neither a damage forecast nor a promise of safety.
The command validator and projection use the same legal travel-option predicate.

Canonical Expedition state journals starting resources, safe ordered route legs, accumulated damage,
Observations, resolved salvage effects, recovered Findings, preparation, and Commission progress.
One authoritative latest outcome summary records return or failure, Commission result and reward,
resources, routes, damage, evidence retention/loss, salvage, Findings, publication, Atlas contribution,
and Trace association. While returned or failed it is projected as the current summary; after
publication or when a later Expedition begins it is projected as the finalized previous summary.
React renders these structures and never infers authoritative outcomes from raw events.

Browser record version 4 uses `the-long-map.local-prototype.v4`, validates protocol 4 and scenario
1.3.0, and replays only version-4 histories. Known v1–v3 records remain untouched until confirmed
targeted reset; no speculative migration is attempted.

## Alternatives considered

- Join Reports and route IDs in React: rejected because presentation could disagree with core rules.
- Collapse conflicts to one best reading: rejected because the Atlas is a historical claims system.
- Project current hazard or exact future damage: rejected as hidden-state leakage and false certainty.
- Reconstruct summaries from raw event snapshots in React: rejected because snapshots contain broad
  canonical state and presentation would own outcome logic.
- Maintain separate Commission and Expedition result records: rejected because duplicate facts could
  diverge.

## Consequences and risks

The player can compare evidence and projected return pressure at decision time, replay reconstructs
the same journal and summary, and returned/failure explanations no longer depend on Activity. Costs
include larger protocol projections, denser route cards, a breaking local-history transition, and
continued usability risk on compact screens. Historical Reports can still be sparse or misleading by
age; the interface must keep uncertainty and projection limitations explicit.

## Reconsideration criteria

Revisit this decision if the second owner playtest shows that route cards do not change decisions,
claim conflicts remain unintelligible, projected margins are mistaken for safety guarantees,
summaries fail to explain gains/losses, or the safe contract cannot remain deterministic and free of
hidden topology. Phase 1 remains open until PLAYTEST-0002 evidence is reviewed.
