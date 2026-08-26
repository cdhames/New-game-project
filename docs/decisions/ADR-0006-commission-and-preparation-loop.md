# ADR-0006: Commission and Preparation Loop

- **Status:** Accepted and implemented for the Phase 1 prototype
- **Date:** 2026-08-25

## Context

The first owner playtest found no clear Expedition purpose, reward, or reason to begin a second
journey. The response must preserve deterministic replay, hidden Ground truth, selective publication,
and the one-currency Findings economy.

## Decision

Protocol 3 and scenario 1.2.0 generate three or four stable Commission offers from public Atlas
claims and known topology only. The four typed families are verify-report, survey, reach-frontier,
and recover-salvage. Verify ranks stale, lower-quality, less-corroborated, older Reports first. Survey
ranks missing then stale/weak evidence and does not duplicate verify. Frontier uses known shortest
distance 2–3 and round-trip cost at most 6. Salvage requires a public opportunity Report and never
reveals exact value.

The selected offer is copied immutably into the Expedition. Travel, Observation, and salvage update
safe progress. Survey, frontier, and salvage grant their banked Findings reward once on successful
return when the objective is met. Verify grants once only when a matching current-Expedition
Observation is explicitly published after return. Failure grants none.

Preparation is not a mutable shop. `start-expedition` atomically commits the Commission, exactly two
instruments, and a plan. One Finding buys each of up to two extra starting Provisions; two Findings
buy +1 starting/maximum Vessel Integrity; one Finding buys +1 starting/maximum Charge for each
selected instrument. The core validates caps, compatibility, uniqueness, and funds before deduction.

Each published player Report adds one non-spendable Atlas Contribution. A bounded structured
previous-Commission result survives Expedition clearing. Browser record v3 uses a new key and stores
protocol/scenario versions; v1/v2 records are never replayed and remain untouched until targeted
confirmed reset.

## Alternatives considered

- Hand-authored or free-text objectives: rejected for scope, moderation, and determinism.
- Hidden-truth target generation: rejected because offers would become an oracle.
- Separate purchase commands: rejected because abandoned carts and replay ordering add unnecessary state.
- Grant verify reward on return: rejected because it would remove the requested publication choice.
- A second spendable contribution currency: rejected to keep Findings as the only currency.
- Migrating older command logs: rejected because changed outcomes cannot be reconstructed faithfully.

## Consequences and risks

Players receive explicit purpose and an immediate second-Expedition reward loop while bots and the
browser continue using ordinary safe commands. Costs include larger schemas/projections, more setup
density, a breaking replay transition, and tuning risks: one family or preparation order may dominate,
Commission rewards may overpower voluntary exploration, or publication incentives may feel coercive.

Revise after deterministic simulation or human playtesting if offers become repetitive, unsafe
targets appear, reward timing is unclear, preparation trivializes return pressure, or players still
lack a credible second-Expedition motivation. The final decision-time route-evidence presentation and
comprehensive Expedition completion summary remain planned outside this record.
