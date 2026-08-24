# Simulation and Telemetry

## Purpose

Simulation is a core product capability for testing the knowledge economy before population or content scale. Telemetry is permitted only when tied to a concrete design question and collected with privacy-conscious limits.

## Bot-policy framework

Bots consume the same player-safe projection and issue the same versioned commands as a client. A policy defines goals, risk tolerance, information valuation, publication behavior, contribution preference, memory limits, and deterministic tie-breaking. Initial policies are:

- **Cautious return-focused explorer:** prioritizes survival and early banking.
- **Aggressive distance-focused explorer:** accepts failure risk to reach frontier nodes.
- **Knowledge-focused surveyor:** spends resources on high-value Observations and publishes broadly.
- **Personal-reward-focused salvager:** favors bankable findings and selective disclosure.
- **Route-verification specialist:** targets old, conflicting, or weakly corroborated Reports.
- **Waystation contributor:** routes resources toward collective project completion.

Random, heuristic, and adversarial fuzz policies provide baselines, not player archetype claims. Synthetic activity carries an internal source class and must not masquerade as human popularity.

## Deterministic replay

Every run records scenario/schema version, canonical initial state, policy versions, seed/RNG state, logical time inputs, ordered commands, outcomes, and terminal checksum. A failure must replay exactly. Golden replays detect rule drift; event-version migrations require compatibility tests. Sensitive identifiers are excluded or pseudonymized before analysis.

## Monte Carlo goals

Sweep seeds, world layouts, tuning parameters, population mixes, policy mixes, and Drift schedules to estimate outcome distributions rather than a single average. Early studies test completion/failure, session length proxy, frontier growth, information freshness, resource flows, Trace recovery, Waystation pace, and cold-start transition. Confidence intervals and sample sizes accompany conclusions; simulation guides human testing but does not replace it.

## Balance, exploit, and dominant-strategy detection

Check conservation and bounded-growth invariants, unreachable states, infinite loops, free-resource cycles, duplicate publication/corroboration exploits, knowledge leakage, safe reward farming, intentional-failure benefits, Trace loops, and Waystation contribution abuse. Compare policies on multi-objective outcomes: personal reward, survival, distance, information value, and collective contribution. A strategy is suspect when it dominates across diverse seeds and scenarios with no compensating cost, remains prevalent after reasonable counter-tuning, or collapses meaningful choice. Apparent dominance in bots must be verified with playtests and sensitivity analysis.

## Cold-start testing

Run cohorts with one human-like policy plus varying baseline Reports and synthetic explorer rates, then ramp real-policy participation while synthetic activity diminishes. Measure whether useful route choices, corroboration, fresh information, and Waystation progress persist without pretending a crowd exists. Compare zero-, low-, and healthy-population states and test recovery after inactivity.

## Design questions and initial metrics

| Design question | Metrics and cuts |
| --- | --- |
| Is Expedition risk legible and fair? | completion/failure rate by route evidence, policy, loadout, step, and failure cause; duration distribution |
| Does exploration spread? | route concentration, frontier visits, unexplored-region discovery rate, repeat-visit rate |
| Is publication a real choice? | Report publication rate by category/quality/age; personal reward and survival tradeoff |
| Is the Atlas useful without becoming omniscient? | Report age and accuracy distribution against Ground truth in protected analysis; planning changes attributable to Reports |
| Does verification matter? | corroboration rate, independent sources, conflict resolution time, verification specialist value |
| Is Drift fair? | stale-Report action rate, change-warning visibility, losses associated with age, recovery after Drift |
| Is the economy stable? | resource generation/consumption, sinks/sources, inventory distribution, loop exploits |
| Is collective progress paced well? | Waystation completion pace, contributor share, free-rider outcomes, post-completion route effects |
| Are strategies diverse? | policy/action entropy, outcome Pareto frontier, dominant strategies, loadout diversity |
| Is progression healthy? | progression velocity and option usage without veteran power gaps |
| Does cold start work? | viable route choices, completion, fresh coverage, corroboration, and synthetic share at each population level |

Human usability studies add time-to-first-decision, terminology comprehension, age/provenance cue recognition, return-decision comprehension, publication reasoning, accessibility task completion, and second-Expedition intent. These are questions, not engagement quotas.

## Privacy-conscious principles

Collect the minimum event fields needed for named questions; prefer aggregate counts, coarse durations, pseudonymous rotating identifiers, and server-known schema values over content or fingerprints. Do not collect unrestricted text, precise location, contacts, cross-site behavior, or unnecessary device traits. Separate operational security logs from product analysis, restrict access, define short retention, support deletion/account rights when accounts exist, and document synthetic/human classification. Consent and policy language must precede production telemetry. Do not optimize compulsive use or infer sensitive traits.

## Interpretation criteria

Predeclare the scenario, metric, expected direction, guardrails, and decision threshold for consequential studies. Report distributions, uncertainty, cohort sizes, seeds, exclusions, and negative results. Segment by strategy and accessibility mode where appropriate without creating identifying cohorts. Treat correlation as hypothesis, reproduce surprising results, and require human playtest evidence for emotional or comprehension claims. Revise tuning when results are local; reconsider a system when failure persists across parameter ranges and representative policies.
