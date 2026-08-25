# MVP Specification

## Purpose

Build the smallest vertical slice that can disprove or support the player-authored Atlas premise. This is a specification, not evidence that a build exists.

## Browser validation status

The [first owner browser playtest](../playtests/PLAYTEST-0001-owner.md) failed the comprehension,
motivation, interface, and strategic-depth gates. The map and exploration premise remain a positive
signal, but Phase 1 cannot be considered complete until the substantial
[Revision 0.2 response](REVISION_0.2_PLAYTEST_RESPONSE.md) is implemented and validated. Revision 0.2
is planned work; its Commission, resource, reward, salvage, route-evidence, shell, and summary systems
do not yet exist merely because they are specified.

## Proof obligations

The slice must demonstrate route planning from incomplete information; a short risk/reward Expedition; selective Observation and publication; visible Atlas change; at least one Report becoming stale; cross-session consequence; meaningful solo-human play; and deterministic replay/simulation.

## Included features

- Guest-first local identity and a persistent Logbook.
- One compact archipelago region with one Waystation, branching routes, hidden Ground truth, and fogged/uncertain Atlas presentation.
- Structured route, hazard, condition, and opportunity Observations.
- Three loadout instruments with distinct information tradeoffs and a small shared supply budget.
- Turn/step-based travel, encounters, resource pressure, retreat, success, failure, and one recoverable Trace form.
- Selective publication with age, provenance, confidence, corroboration, and change warnings.
- One deterministic Drift rule that can stale at least one relevant Report.
- One bounded Waystation contribution project that persists across sessions.
- Limited baseline system Reports and simulated explorer activity for cold start, marked by source class.
- Seeded command/event replay plus headless bot execution for all included rules.
- Accessible responsive Atlas and structured encounter UI at functional fidelity.

## Explicit non-goals

No unrestricted chat, direct PvP, fabricated Reports, monetization, real-money exchange, energy timers, mandatory account registration, production hosting, large authored world, final art, live matchmaking, guilds, complex economy, multiple Waystations, provider commitment, WebGPU requirement, or final commercial naming.

## User flow

1. Begin as guest and see a focused Atlas around the Waystation.
2. Within about 30 seconds, select a route goal and loadout.
3. Travel through branching legs; inspect Report evidence and current encounters.
4. Spend resources to move, observe, mitigate, salvage, contribute, or turn back.
5. Return within a target three-to-seven-minute session or fail and leave a possible Trace.
6. Review the Logbook and select limited Observations to publish.
7. See the Atlas update, advance a controlled Drift boundary, and observe staleness or corroboration.
8. Start a later Expedition whose planning state reflects prior Reports, contribution, or Trace.

## Provisional tuning parameters

All values are reversible starting hypotheses, not design law.

| Parameter | Initial value |
| --- | --- |
| Region | 12 nodes, 18 routes, 1 Waystation |
| Route choice at start | 2–3 plausible goals |
| Expedition length | 8–16 decision steps; 3–7 minutes |
| Loadout | choose 2 of 3 instruments; 6 supply units |
| Observation cost | 1 supply or one movement opportunity |
| Publication capacity | up to 3 Observations per return |
| Drift | after every 3 resolved Expeditions; affects 1–2 subjects |
| Baseline Reports | 6, mixed age and confidence |
| Trace recovery | up to 50% of eligible unbanked findings |
| Waystation project | 12 contribution units across sessions |
| Simulator cohort | at least 6 policies × 1,000 seeded Expeditions per study |

## Acceptance criteria

- A fresh guest can complete the full loop without another human online.
- The first meaningful decision median is at most 30 seconds in a small moderated test.
- At least 80% of valid test Expeditions finish in two to eight minutes; the target band remains three to seven.
- Two plausible routes differ materially because of Atlas evidence, not only reward magnitude.
- Observation has an opportunity cost and publication forces a real selection.
- Published information visibly changes a later planning view without revealing Ground truth.
- A Report visibly ages and becomes possibly stale after deterministic Drift.
- Replaying the same initial state, seed, and command sequence produces byte-equivalent canonical state/events.
- Bots use the same commands and rules as human-controlled clients.
- Keyboard-only completion is possible; information is not encoded by color alone; essential map facts have structured text equivalents.
- Synthetic and human activity remain separable in telemetry and are not presented deceptively.

## Technical validation targets

Pure rules run headlessly without DOM, network, database, wall clock, or global randomness. Invalid commands are rejected deterministically. Event logs reconstruct canonical state and carry schema versions. Property tests cover resource conservation, legal reachability, publication provenance, independent corroboration, and bounded Drift. Critical browser workflow tests cover guest start through later-session Atlas consequence. A simulated 10,000-Expedition run completes reproducibly within a practical local development budget; the exact performance budget is set after baseline measurement.

## Usability targets

Players can explain the difference between Observation, Report, Atlas, and Ground truth after one loop; identify age and corroboration before committing to a risky reported route; understand why a Report may be stale; and locate press-on/return, resources, and publication controls without instruction. Mobile layouts preserve decision parity with desktop, and reduced-motion mode preserves all state cues.

## Reconsideration conditions

Reconsider the concept—not merely tune it—if repeated prototype tests show that players cannot form useful trust judgments; Atlas evidence does not alter routes; publication has a stable obvious optimum or no felt value; Drift consistently feels arbitrary despite clear cues; the core loop requires a large live population; solo/bot activity cannot sustain corroboration honestly; deterministic constraints prevent viable design iteration; or accessible map alternatives remove essential understanding. Any decision to proceed despite such evidence requires a new decision record.
