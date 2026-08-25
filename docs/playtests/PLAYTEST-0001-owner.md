# PLAYTEST-0001: First Owner Browser Playtest

## Record status

- **Participant:** project owner; experienced gamer
- **Build:** first Phase 1 browser prototype
- **Session type:** owner playtest
- **Purpose:** record direct first-use evidence and define the project response

This record separates what the player directly reported from the project lead's interpretation. The
prototype failed to communicate and reward its intended systems; this is not a claim that the player
misunderstood them.

## Direct player observations

### Positive signal

- The map was the first thing noticed and was visually interesting.
- The map briefly captured the attention of an experienced gamer.

### Interface and information hierarchy

- The interface was not intuitive.
- The player had to scroll a long distance to reach the Logbook.
- The Logbook appeared potentially important, but its actual importance was unclear.
- The right-side Observation/salvage control panel behaved strangely while scrolling.
- The rest of the interface moved underneath or obscured selectable controls.
- The page felt awkward and structurally confusing.

### Resources and mechanics

- Every Expedition appeared to begin with exactly six Supply.
- There was no understandable way to obtain more Supply during an Expedition.
- The small Supply budget sharply limited actions and exploration.
- The player reached North Mark, performed an Observation, and then felt compelled to turn around.
- Integrity and other displayed attributes did not appear to have a meaningful or understandable
  function.
- A third action category appeared to exist but did not appear during the playtest.
- Dynamically absent controls made the available action set unclear.

### Motivation and rewards

- The player could not determine the purpose of making Observations.
- The player could not determine the purpose of salvage.
- No reward system was visible or intuitive.
- There was no compelling reason to continue playing.
- The prototype briefly held attention and then quickly lost it.
- The experience lacked depth, while acknowledging that this was a first pass.

## Project-lead diagnosis

The prototype currently fails the following design gates:

- first meaningful understanding within roughly 30 seconds;
- clear purpose for the Expedition;
- clear value of Observation and salvage;
- understandable resource economy;
- understandable risk and Integrity;
- motivation for a second Expedition;
- meaningful strategic depth; and
- stable and coherent desktop layout.

The cartographic map and exploration premise remain a positive signal worth preserving. One playtest
does not justify abandoning The Long Map concept. It does justify a substantial second prototype
rather than cosmetic polishing.

## Decisions resulting from the evidence

- Revision 0.2 will use a deliberate single-screen game shell with the map as its centerpiece and a
  stable, always-legible action surface.
- Each Expedition will have an explicit, persistent Commission with a stated objective, progress,
  completion condition, and reward.
- The resource model will separate travel Provisions from instrument Charges, make Vessel Integrity
  and return cost legible, and restore the base loadout at the Waystation.
- Salvage will advertise an understandable opportunity family and produce immediate utility.
- Findings will be the one spendable personal reward, banked on successful return and used for
  temporary next-Expedition preparation. Atlas Contribution will remain non-spendable.
- All major action categories will remain visible, with disabled reasons when unavailable.
- Route choices will present player-safe Report evidence without revealing current hidden Ground
  truth.
- Contextual first-session guidance and a clear completion summary will replace dependence on the raw
  Logbook or Activity history.
- The compact region must demonstrate strategic depth before any map expansion.

The authoritative provisional response is specified in
[Revision 0.2 Playtest Response](../design/REVISION_0.2_PLAYTEST_RESPONSE.md).

## Questions for later testing

- Can a first-time player explain the Commission and make a meaningful choice within 30 seconds?
- Do route-evidence cues change an actual route decision without overwhelming the map?
- Are eight base Provisions, two Charges per selected instrument, and four Vessel Integrity enough to
  support tension without forcing an immediate retreat?
- Does the Return Reserve create useful pressure without being mistaken for a guarantee of safety?
- Are salvage opportunity families informative while leaving worthwhile uncertainty?
- Are Findings costs and caps large enough to change preparation but small enough to preserve risk?
- Can players distinguish a private Observation, a published Report, and hidden Ground truth after
  one Expedition?
- Does the completion summary make Atlas change and reward value clear?
- Does the revised compact region offer a credible reason to begin a second Expedition?
- Does the intentional mobile stack preserve action access and decision parity?
