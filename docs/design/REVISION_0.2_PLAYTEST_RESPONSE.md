# Revision 0.2 Playtest Response

## Status and evidence

This document records the implemented response to
[PLAYTEST-0001](../playtests/PLAYTEST-0001-owner.md) and the evidence from
[PLAYTEST-0002](../playtests/PLAYTEST-0002-owner.md). Revision 0.2 is technically complete on the
unmerged feature branch. Its interface and structural improvements remain useful, but it failed the
engagement and core-fantasy gate.

The player-authored Atlas, hidden Ground truth, deterministic game core, player-safe projection, and
short-Expedition premise remain authoritative. The first playtest supports preserving the
cartographic centerpiece, but shows that the current interface, economy, purpose, rewards, and depth
do not yet satisfy Phase 1.

All numeric values in this document are reversible initial tuning parameters, not permanent design
law.

**Final status:** The shell, resources, Commissions, preparation, player-safe route evidence,
projected return consequences, contextual guidance, authoritative Expedition journal, and
return/failure/finalized summaries are implemented and technically validated. PLAYTEST-0002 occurred.
The cleaner interface did not make the game compelling: Findings felt repetitive, Atlas change lacked
payoff, Drift remained opaque, and Report filing made the foreground fantasy feel administrative.
Revision 0.2 therefore passes its technical and interface-structure gates but fails its engagement,
emotional-payoff, and second-Expedition gates. Phase 1 remains open.

Further incremental polishing of the retrieve-file-upgrade loop is not the approved response. The
bounded [Revision 0.3 adventure-first pivot](REVISION_0.3_ADVENTURE_FIRST_PIVOT.md) will test one
named mystery, encounter, discovery, capability reward, visible Drift event, outside claim, and
consequential reveal-or-withhold choice. Revision 0.3 is not implemented.

## 1. Desktop information architecture

The desktop application will be a deliberate single-screen game shell rather than one long webpage:

- a compact top status bar presents the Commission, Provisions, Return Reserve, Vessel Integrity,
  instrument Charges, and banked Findings;
- the map remains the main visual centerpiece;
- a dedicated mission/action panel stays visible and never overlays, moves beneath, or is covered by
  scrolling content;
- Atlas, Logbook, and Activity use tabs or an equivalently compact secondary-information system;
- panels scroll internally where necessary;
- the current turn can be understood and played without scrolling to the bottom of the page; and
- mobile uses an intentional stack—status and Commission, map, actions, then secondary information—
  with the action area remaining directly accessible.

The Logbook is secondary reference information, not the moment-to-moment control surface. Activity
history is tertiary information.

## 2. Explicit Expedition Commission

Before departure, the player chooses one system-generated Commission derived from current Atlas
needs. Initial Commission families are:

- verify an old, stale, low-confidence, or weakly corroborated Report;
- survey a specified route or location category;
- reach a frontier location and return; and
- recover salvage from a specified area.

The selected Commission remains visible throughout the Expedition and states, in plain language:

- objective;
- destination or subject;
- completion requirement;
- Findings reward; and
- current progress.

The local prototype generates Commissions from structured state. Revision 0.2 adds neither free-form
text nor handcrafted narrative requirements.

## 3. Revised resource model

Initial values are:

| Resource or rule | Revision 0.2 value |
| --- | --- |
| Base starting Provisions | 8 |
| Travel | 1 Provision per leg |
| Selected instruments | 2 Charges each |
| Observation | 1 corresponding instrument Charge; no Provision |
| Salvage | 1 Provision |
| Base Vessel Integrity | 4 |
| Failure | Vessel Integrity reaches 0 |

Hazards can reduce Vessel Integrity. **Vessel Integrity** is the player-facing label; compatible
internal terminology may remain during migration where it does not leak into player-facing text.

The Waystation clearly restores base Provisions, instrument Charges, and Vessel Integrity before
every Expedition. A **Return Reserve** continuously shows the minimum known Provision cost from the
current location to the Waystation. Reaching or crossing that reserve produces a strong warning. The
reserve is calculated only from routes and evidence the player is entitled to use; it is not a
promise of safe return and never exposes hidden Ground truth.

## 4. Salvage outcomes and purpose

Salvage provides immediate, understandable utility through these initial outcome families:

- recoverable Findings;
- a Provision cache; or
- repair material that restores Vessel Integrity, up to the applicable Expedition maximum.

Before committing, the interface identifies the broad opportunity family when player-safe evidence
permits it. Exact value may remain uncertain. Salvage costs 1 Provision and consumes an opportunity
that could otherwise support exploration or return, so it remains a strategic tradeoff.

## 5. Reward and preparation loop

**Findings** are the single spendable personal reward in Revision 0.2. They are earned through
successful salvage, Commission completion, and useful publication when a Commission specifically
requests public verification. Findings remain unbanked during an Expedition and are banked only
after successful return.

At the Waystation, banked Findings buy temporary preparation for the next Expedition:

| Preparation | Cost | Initial cap per Expedition |
| --- | ---: | ---: |
| Additional starting Provisions | 1 Finding each | +2 Provisions |
| Reinforced starting Vessel Integrity | 2 Findings | +1 Vessel Integrity |
| Additional Charges for one selected instrument | 1 Finding each | +1 Charge per instrument |

Purchases apply only to the next Expedition and are consumed when it begins. A player may combine
options within the stated caps. These low costs are deliberately easy to test and retune.

**Atlas Contribution** is a visible, non-spendable lifetime/session record of useful Reports
published. It is not a second currency and buys nothing in Revision 0.2. No other overlapping
currency is added.

## 6. Always-legible actions

While an Expedition is active, **Travel**, **Observe**, **Salvage**, and **Return** remain visible as
action categories. If an action is unavailable, it remains disabled and explains the relevant reason,
such as no valid destination, no compatible Charge, no salvage opportunity, or not being at the
Waystation. Players must not discover an action category only when it suddenly appears.

Failure resolution may remain contextual, but the interface must explain when and why it applies.
Map interactions and equivalent ordinary DOM controls remain synchronized and derive from the same
player-safe affordances.

## 7. Route evidence at decision time

Every route choice presents Report evidence the player is entitled to use:

- age;
- evidence quality;
- corroboration;
- potentially stale status;
- reported condition or hazard, where available; and
- an explicit unknown state where no Report exists.

Current hidden Ground truth is never displayed. The presentation must make it possible to explain why
two routes have different uncertainty or reported risk without implying that either Report is current
truth.

## 8. First-session guidance

Concise contextual guidance, placed beside the relevant control, teaches this sequence:

1. choose a Commission;
2. choose two instruments;
3. inspect route evidence;
4. leave the Waystation;
5. use instrument Charges for Observations;
6. preserve enough Provisions to return;
7. return and publish; and
8. spend Findings on the next preparation.

Guidance avoids modal overload and can yield to normal play after its point is understood. A first
meaningful choice must remain reachable in roughly 30 seconds.

## 9. Expedition completion summary

Return or failure opens a clear outcome summary containing:

- Commission result;
- route traveled;
- Observations made;
- Reports published;
- salvage recovered;
- Findings earned and, on success, banked;
- Atlas Contribution;
- damage sustained;
- what was lost;
- what changed in the Atlas; and
- what can be purchased or changed before the next Expedition.

The summary distinguishes return from failure and does not require inspection of raw Activity history
to understand the outcome.

## 10. Strategic depth target

Without expanding the map, Revision 0.2 must prove that the compact region supports:

- at least two plausible route choices;
- different loadout strategies;
- a meaningful choice among surveying, salvaging, going farther, and returning;
- a visible risk-versus-return calculation;
- at least two worthwhile Commission types;
- a reward that materially affects the next Expedition; and
- an explicit reason to begin a second Expedition.

## Acceptance criteria

- In a moderated test, a first-time player can explain the immediate objective within 30 seconds.
- The desktop prototype can be understood and played without scrolling through the entire page.
- The action panel never covers or is covered by another panel at supported desktop widths.
- Atlas, Logbook, and Activity remain reachable without dominating the play surface.
- Every major action category is visible with either availability or a disabled explanation.
- Provisions, Vessel Integrity, instrument Charges, Return Reserve, Findings, and Commission progress
  each have a visible plain-language explanation.
- Using base resources, a player can reach North Mark, perform a useful action, and return without one
  Observation forcing immediate retreat.
- At least one salvage result provides immediate utility during the current Expedition.
- A first successful return produces a clearly identified spendable Findings reward.
- Spending that reward can materially change the next Expedition within the stated preparation caps.
- Report evidence causes at least one meaningful route decision to differ from a no-evidence choice.
- A player can identify that hazards reduce Vessel Integrity and zero Vessel Integrity causes failure.
- After one loop, a player can distinguish private Observation, published Report, and hidden Ground
  truth.
- The completion summary gives the player an explicit reason to begin a second Expedition.

## Staged implementation plan

No stage below is implemented by this document.

| Stage | Status | Work | Primary ownership |
| ---: | --- | --- | --- |
| 1 | Implemented on this branch | Application shell, panel hierarchy, desktop scrolling correction, mobile stack | Browser-only presentation and layout |
| 2 | Implemented on this branch | Revised player-safe projection fields and player-facing resource terminology | Protocol and game core, then browser rendering |
| 3 | Implemented on this branch | Commission generation/progress/completion and Findings earning/banking | Protocol and game core, then browser controls and presentation |
| 4 | Implemented on this branch | Return Reserve, base Provisions, instrument Charges, salvage cost, Vessel Integrity, restoration and warnings | Protocol and game core for rules/projection; browser for explanation and warnings |
| 5 | Implemented on this branch | Player-safe route-evidence projection and decision-time presentation | Protocol/game core filtering; browser presentation |
| 6 | Implemented on this branch | Temporary preparation and comprehensive Expedition summaries | Protocol/game core for outcomes and purchases; browser summary and preparation UI |
| 7 | Complete; engagement gate failed | Unit, property, replay, simulation, browser, responsive and accessibility validation completed; PLAYTEST-0002 recorded a failed engagement/core-fantasy result | All affected packages, browser, and playtest evidence |

Stages that change commands, events, canonical state, deterministic rules, resource accounting,
Commission state, reward state, or safe projections require protocol/game-core work and replay
compatibility review. Layout, tabs, panel scrolling, contextual copy, and rendering of already-safe
data are browser-only. Browser code must not independently decide authoritative outcomes or infer
hidden state.

## Unresolved risks and later evidence

PLAYTEST-0002 resolved the central Revision 0.2 risk negatively: improved clarity did not create a
credible emotional reason for another Expedition. The following implementation-local risks remain
documented, but tuning them is not expected to repair the failed foreground fantasy:

- The preparation costs may create an obvious purchase order or trivialize return pressure.
- Return Reserve may be mistaken for a safety guarantee unless uncertainty language is effective.
- Commission rewards may overpower voluntary exploration or make publication feel compulsory.
- Separating Provisions and Charges may improve clarity but reduce the shared opportunity-cost tension.
- Salvage type previews may reveal too much or too little to support a real choice.
- A single-screen desktop shell may create density or accessibility problems at intermediate widths.
- The compact scenario may still lack route and loadout diversity after these changes.
- Revision 0.2 must verify that Atlas evidence, rather than reward magnitude alone, changes decisions.
