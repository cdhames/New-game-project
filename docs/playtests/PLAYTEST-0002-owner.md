# PLAYTEST-0002: Revision 0.2 Owner Playtest

## Record status

- **Participant:** project owner; experienced gamer
- **Build:** Revision 0.2 technical candidate on `feature/phase1-browser-prototype`
- **Session type:** second owner playtest
- **Purpose:** test comprehension, engagement, reward, Atlas feedback, Drift, and desire for another
  Expedition
- **Result:** Revision 0.2 passed its technical and interface-structure goals but failed the
  engagement and core-fantasy gate

This record distinguishes the owner's direct observations from the project lead's interpretation.
The result is evidence about the design, not a failure by the player. The interface became clearer,
but clarity exposed a loop that did not provide a compelling emotional reason to continue.

## Direct owner observations

### Initial engagement

- The first 30-second impression produced marginal interest, but the game did not grab the player's
  attention.
- The concept felt similar to planning a hiking trip: choosing where to go and which scenic route to
  take.
- The map and route-planning premise retained some curiosity.
- The owner remains willing to continue exploring the project.

### Interface

- Revision 0.2's interface is cleaner and easier to understand than the first prototype.
- The game as a whole is still not intuitive.
- The improved interface structure did not solve the underlying engagement problem.

### Rewards and progression

- Findings introduced a marginal reward loop.
- Their purpose and value were not immediately intuitive after multiple playthroughs.
- Findings appeared mainly to purchase Provisions or extend further data retrieval.
- The reward loop felt clean but repetitive rather than rewarding.
- The reward did not create a sufficiently new possibility or emotional payoff.

### Atlas and world feedback

- There were insufficient visual cues that the player was exploring, updating, or changing the
  Atlas or world.
- Adding knowledge did not produce a memorable visual or strategic transformation.
- The Atlas behaved more like stored information than a world the player was changing.

### Drift

- Drift was not adequately explained.
- It appeared to happen without clear cause, anticipation, or visible consequence.
- The player guessed that Drift changed Observations, salvage, or location conditions, but the game
  did not confirm that interpretation.
- Drift did not function as an understandable or dramatic world event.

### Reports

- The purpose of publishing Reports remained unclear.
- The player wondered whether Reports existed primarily to gain Findings for additional Provisions.
- Filing Reports resembled an ordinary workplace activity.
- “File a Report” is not an enticing surface-level fantasy for many players seeking escape from
  daily monotony; players may reject the game before trying it if administrative filing appears to
  be the central activity.
- Reports might support a good game, but should not be assumed to be inherently enjoyable.

### Overall loop

- The surface loop appeared to be: retrieve data, file the data, receive a reward, and use the reward
  to extend further data retrieval.
- The implementation felt more like a workflow than a game.
- The concept remained intellectually interesting.
- The loop did not create a compelling emotional reason to continue.

The owner's concise agreed diagnosis was:

> “The concept is intellectually interesting, but the implementation feels more like a workflow.”

## Project-lead diagnosis

Revision 0.2 succeeded technically and structurally. It improved layout, route-evidence clarity,
resource explanations, deterministic outcome summaries, and lifecycle reliability. It nevertheless
failed the engagement and core-fantasy gate.

The failure is not primarily a shortage of explanation, Reports, Commission families, resource
tuning, or visual polish. The deeper problems are:

- the foreground fantasy is administrative;
- destinations lack memorable encounters;
- route planning does not lead to sufficiently meaningful events;
- Atlas changes are not visually or strategically rewarding;
- Findings mainly increase capacity to repeat the same verbs;
- Drift is opaque rather than dramatic;
- the solo prototype does not express “a world no one can see alone”;
- publication lacks a meaningful choice or consequence; and
- the player has little emotional investment in what is discovered.

Further incremental polishing of the retrieve-file-upgrade loop is unlikely to solve these problems.
The project should not be abandoned yet, because the map, uncertain routes, and exploration premise
retain curiosity. The evidence authorizes one bounded core-fantasy pivot before further expansion.

## Decisions resulting from the evidence

- Define Revision 0.3 as a bounded adventure-first experiment, specified in
  [Revision 0.3 Adventure-First Pivot](../design/REVISION_0.3_ADVENTURE_FIRST_PIVOT.md).
- Preserve the cartographic map, incomplete evidence, player-safe boundaries, resources, Drift,
  Atlas, and deterministic replay as supporting systems.
- Move Reports and routine publication out of the foreground fantasy.
- Center one named mystery, a concrete encounter, a memorable discovery, a capability reward, a
  visible Atlas transformation, and a strategic reveal-or-withhold decision.
- Add one clearly identified deterministic simulated outside explorer to make shared knowledge
  visible without networking or deceptive social proof.
- Make Drift a visible, causal world event that creates a new question or opportunity.
- Keep Phase 1 open and test the bounded slice before expanding the map, content, progression, social
  systems, or infrastructure.

## Unresolved questions

- Can a single authored mystery retain replay value when encounter outcomes are deterministic?
- Can reveal versus withhold feel strategic in a solo slice without a broader faction economy?
- Can one simulated outside explorer make the Atlas feel shared without feeling artificial?
- How much encounter presentation is needed for emotional payoff without creating an unsustainable
  content burden?
- Can the Resonance Compass create a materially different second Expedition while preserving
  player-safe uncertainty?
- Does moving Reports into the background preserve the shared-knowledge design lock, or does later
  evidence require a deeper reconsideration?
- Will a visible Drift event feel dramatic and fair without revealing hidden Ground truth?

