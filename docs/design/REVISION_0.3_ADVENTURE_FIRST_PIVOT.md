# Revision 0.3 Adventure-First Pivot

## Status and evidence

This document defines one **provisional, reversible, bounded design experiment** in response to
[PLAYTEST-0002](../playtests/PLAYTEST-0002-owner.md). Revision 0.3 is not implemented. It does not
authorize map expansion, a general encounter framework beyond the slice, networking, or production
infrastructure.

Revision 0.2 is technically complete and its interface improvements remain useful, but it failed the
engagement and core-fantasy gate. The branch remains unmerged and Phase 1 remains open.

## North star

> Venture into a living and dangerous archipelago, follow uncertain leads, confront encounters,
> interpret incomplete evidence, uncover discoveries worth caring about, and decide what knowledge
> to reveal before the world changes again.

The primary player verbs are:

- **Venture**
- **Encounter**
- **Interpret**
- **Risk**
- **Discover**
- **Return**
- **Reveal**

This replaces the current foreground impression—retrieve data, file data, earn capacity to retrieve
more data. Evidence collection remains important, but supports adventure rather than constituting
the surface fantasy.

## Preserved foundation and changed foreground

Potentially valuable existing systems remain: the cartographic map, known and unknown routes,
historical and conflicting claims, player-safe information boundaries, Provisions, Vessel Integrity,
instruments, Return Reserve, Drift, the Atlas, and deterministic replay.

Their presentation and priority change:

- Reports move into the supporting information model. “File Report” cannot remain the primary
  fantasy. Routine factual publication may occur automatically where no meaningful decision exists.
- Explicit publication exists only when revealing or withholding knowledge changes a consequence.
- Findings may remain a secondary preparation resource, but cannot be the sole emotional reward.
- Commissions may eventually be presented as Leads, Rumors, Signals, or Expeditions. This document
  records the naming problem and candidates; it does not lock final terminology.
- Atlas administration, personal logs, and detailed claims remain secondary to the current Lead,
  encounter, danger, clues, discovery, and return decision.

## Bounded vertical slice: The Bell Beneath North Mark

### Scope and duration

The slice targets approximately ten to fifteen minutes and one compact mystery chain in the existing
region. It must prove or disprove the adventure-first premise without expanding the map.

### Premise

After a recent Drift, explorers report a strange bell-like sound beneath North Mark. Existing claims
disagree about its origin. It may be a submerged ruin, a navigational phenomenon, a living organism,
deliberate deception, or something else. The player follows uncertainty toward a mystery rather than
accepting an administrative verification assignment.

### Setup

An Expedition Lead, provisionally named **The Bell Beneath North Mark**, states:

- **What is happening:** a repeating tone is sounding beneath North Mark after Drift.
- **Why it is interesting:** historical claims disagree, and the pattern cannot be explained by the
  known chart.
- **Where to go:** North Mark, reached through existing uncertain routes.
- **What is at stake:** the phenomenon may reveal a passage or discovery, while delay allows Drift or
  another explorer to act first.
- **What may help:** the Sounding Line can triangulate depth, the Weather Glass can separate currents
  from the signal, and other loadouts preserve different options and risks.

The player chooses a route and loadout to investigate the mystery. Setup copy prioritizes the Lead
and its stakes; resource explanations remain concise and contextual.

### Travel

Historical route evidence, conflicts, Provisions, Vessel Integrity, and known Return Reserve remain.
Route planning creates tension and shapes available encounter resources, but is preparation for the
arrival rather than the entire activity. Unknown and stale evidence never imply safety, and projected
return margins still exclude unknown damage.

### Arrival encounter

Reaching North Mark triggers a concrete encounter with the pulsing underwater tone. It is not another
Observation-category menu. Initial approaches are:

1. **Listen from the surface.** Low risk and no Integrity cost; spend time or one instrument Charge
   to identify the repeating interval. Gain a reliable acoustic clue, but not the source or permanent
   reward.
2. **Triangulate with the Sounding Line.** Spend a Sounding Line Charge and 1 Provision. Gain a mapped
   origin beneath a fractured shelf and the clue that older “natural shoal” claims are incomplete.
   This enables a safer descent decision.
3. **Descend into the resonance.** Risk 1–2 deterministic Vessel Integrity damage and spend 1
   Provision. Without triangulation the danger is higher. Success reaches the source and can recover
   the discovery; insufficient Integrity forces withdrawal after a partial clue.
4. **Withdraw with incomplete evidence.** Preserve resources and return with the clues already
   gathered. The Lead remains unresolved and the outside actor may publish first.

The approaches differ in risk, resource cost, evidence, discovery access, permanent reward, and
future consequences. The deterministic outcome must be projected honestly where knowable without
revealing the hidden result in advance.

### Provisional discovery

The slice's named discovery is the **Resonant Waystone Fragment**: a worked piece of an older submerged
navigation structure whose tone responds to changing currents. It establishes that the bell is
neither merely weather nor a living call, while leaving the structure's origin unresolved.

- Surface listening learns the interval and confirms the phenomenon, but not the structure.
- Triangulation identifies the submerged shelf and disproves the simplest shoal explanation.
- A prepared descent recovers the fragment and reveals a faint route resonance beyond North Mark.
- An unprepared or damaged descent yields a partial structural glimpse but no fragment.
- Withdrawal preserves safety and knowledge already earned, while allowing the rival response to
  shape the Atlas first.

The fragment is memorable, named, visible in the outcome reveal, and connected to a capability—not
merely converted into currency.

### Return and visual payoff

A successful return produces all of the following in the slice:

- North Mark changes from an unresolved tone marker to a named **Resonant Waystone** annotation when
  the discovery is revealed;
- a resonance arc or provisional passage marker appears beyond North Mark;
- the discovery receives a concise illustrated/SVG reveal treatment;
- the Atlas explains which claims were challenged or remain unresolved;
- the **Resonance Compass** appears visibly in the loadout as an unlocked capability; and
- the player makes a strategic reveal-or-withhold decision.

Success cannot resolve only as a text row or Findings increase. CSS and SVG are sufficient; no
third-party art is required.

## Reveal or withhold

Routine “Publish Reports” language is removed from the foreground resolution. After recovering the
fragment, the player chooses one deterministic consequence:

### Mark the Atlas / Share the Discovery

- The Resonant Waystone annotation and provisional passage become public Atlas knowledge.
- Atlas Contribution increases.
- The simulated explorer, Mara Venn, publishes a partial corroboration plus a conflicting claim that
  the resonance continues east rather than north.
- The next Lead becomes **Follow the Divided Resonance**, emphasizing shared but disputed knowledge.
- The Resonance Compass remains unlocked.

### Keep the Discovery Private

- The public Atlas shows only that North Mark has an unresolved post-Drift anomaly; it does not show
  the fragment or passage direction.
- The player's private Logbook and map layer retain the precise discovery and grant one private
  advantage: on the next Expedition, the Resonance Compass exposes one anomalous-route clue before
  travel.
- Mara Venn publishes an independent, lower-quality claim and visibly marks the region as contested.
- The next Lead becomes **Return Before the Rival Charts the Bell**.

Both choices change the next planning state. Sharing improves common knowledge and creates an
explicit conflict; withholding preserves a temporary private informational advantage but allows the
outside actor to frame the public Atlas first. Neither choice uses unrestricted text.

## Capability reward: Resonance Compass

Recovering the Resonant Waystone Fragment unlocks the **Resonance Compass**. It is a permanent
prototype capability, separate from Findings and ordinary preparation.

Its bounded deterministic function is:

- on the next Expedition, identify one otherwise hidden **anomalous acoustic clue** attached to a
  known legal route;
- distinguish which one of two conflicting acoustic claims is consistent with the recovered
  fragment's signature, without revealing the route's current hazard or condition; and
- unlock a **Tune the Compass** approach at the next resonance encounter.

The safe projection exposes only the clue and unlocked approach. It never exposes hidden route truth,
future Drift, or travel damage. A fixed scenario fixture makes the capability testable. The second
Expedition visibly differs through the loadout badge, the anomalous clue, and the new encounter
choice. Findings may still buy preparation, but the Compass is the memorable reward.

## Simulated outside actor

The bounded slice includes one clearly labeled deterministic simulated explorer: **Mara Venn —
simulated expedition source**. This is prototype behavior, not a human player or fabricated social
proof.

Mara may publish exactly one structured claim during the slice. Her claim is selected
deterministically from the player's reveal choice:

- after sharing, she partially corroborates the structure but contradicts the inferred passage
  direction;
- after withholding, she publishes a lower-quality independent acoustic claim and marks the anomaly
  contested.

Her claim has ordinary provenance, age, quality, and corroboration fields. It visibly changes the
Atlas and creates a later decision, but does not require an NPC faction system, chat, accounts,
networking, or multiplayer.

## Drift as a visible world event

Drift becomes an anticipated event with an explicit before-and-after presentation. When it occurs:

- the map visibly pulses or redraws the affected North Mark region using a reduced-motion-safe
  alternative;
- copy states that currents and the submerged shelf shifted;
- the player sees that North Mark was touched, without receiving exact hidden values;
- affected historical claims receive a visible potentially-stale treatment;
- the anomaly, a route opportunity, or the current Lead visibly changes; and
- a new question appears: whether the resonance moved, opened a passage, or made Mara's claim more
  urgent.

The intended player explanation is: **“The world changed, so some old knowledge may no longer be
reliable.”** Drift does not retroactively rewrite claims and does not reveal exact hidden Ground
truth.

## Adventure-first interface requirements

The map remains the centerpiece. Route evidence is concise by default and detailed on demand. The
primary mission panel prioritizes, in order:

1. current Lead and stakes;
2. immediate danger and resources;
3. encounter approaches;
4. discovered objects and clues; and
5. return or press-on decision.

Atlas administration, detailed claims, personal logs, and activity remain secondary panels. The
single-screen responsive shell, keyboard access, semantic reading order, non-color cues, touch
targets, and reduced-motion support remain requirements. “Publish Reports” is not the primary
end-of-Expedition call to action.

## Technical and architectural boundaries

Revision 0.3 preserves deterministic core authority, player-safe projection, command-log replay,
hidden Ground truth, local prototype persistence, browser accessibility, and the responsive
single-screen shell.

Implementation may require versioned protocol and canonical structures for Lead, encounter, choice,
discovery, capability unlock, reveal/withhold decision, simulated outside claim, and visible Drift
event. Those structures are not implemented by this document. The slice adds no API, database,
hosted service, account system, telemetry, network multiplayer, secrets, or unrestricted player text.

## Bounded acceptance criteria

Revision 0.3 passes only if the adventure-first owner playtest demonstrates all of the following:

1. The owner can state the central mystery within 30 seconds.
2. The first meaningful encounter occurs within roughly three minutes.
3. The owner can identify at least one memorable discovery.
4. At least one decision has an understandable risk-versus-discovery tradeoff.
5. The map or world visibly changes after return.
6. The owner can explain Drift without outside instruction.
7. The reward unlocks a new capability, not only additional capacity.
8. Reveal versus withhold feels strategic rather than administrative.
9. The simulated outside actor makes the Atlas feel shared.
10. The owner wants to undertake a second Expedition.
11. The experience is described as an adventure, mystery, exploration game, or strategy game rather
    than a workflow.
12. Filing or publishing information is not identified as the primary fantasy.

### Stop condition

If the bounded vertical slice still feels primarily like a workflow or fails to produce a credible
desire for another Expedition, pause implementation and reconsider the core concept before further
expansion.

## Staged implementation sequence

No stage below is implemented by this document.

1. Add versioned deterministic Lead, encounter, choice, discovery, and capability contracts.
2. Implement The Bell Beneath North Mark encounter chain.
3. Implement reveal-versus-withhold consequences.
4. Implement the Resonance Compass capability unlock and second-Expedition approach.
5. Add Mara Venn's deterministic simulated claim and explicit synthetic provenance.
6. Make Drift a visible event that changes the region and creates a new Lead.
7. Integrate the adventure-first hierarchy into the existing browser shell.
8. Add protocol, core, replay, hidden-information, simulation, browser, accessibility, and responsive
   tests.
9. Conduct the bounded owner adventure-first playtest and record the evidence.

Existing Revision 0.2 systems are treated as follows:

| Treatment | Systems |
| --- | --- |
| Remain unchanged unless implementation evidence requires a versioned change | deterministic authority, player-safe boundary, replay, hidden Ground truth, base resource tuning, Return Reserve, responsive shell |
| Move into the background | detailed Reports, Atlas administration, outcome accounting, Logbook, routine evidence publication |
| Candidate player-facing rename | Commission → Lead/Rumor/Signal/Expedition; publish/file → Mark Atlas/Share Discovery/Keep Private |
| Temporarily bypass in the slice | generic Commission rotation and routine end-of-Expedition publication selection when no consequence exists |
| Remove from the foreground loop | retrieve-file-upgrade framing and Findings as the only visible reason to continue |

## Risks and questions

- The authored encounter may be engaging once but lack replay value.
- Reveal/withhold consequences may feel artificial without a larger world economy.
- The simulated explorer may feel mechanical rather than socially meaningful.
- A capability unlock could accidentally expose hidden truth or become an obvious choice.
- Stronger encounter presentation may create an unsustainable content-production burden.
- The ten-to-fifteen-minute target may conflict with the earlier short-session promise and requires
  direct evidence rather than silent normalization.
- Preserving the shared-knowledge design lock while backgrounding Reports may require a later ADR if
  the pivot succeeds.

