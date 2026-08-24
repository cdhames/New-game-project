# Core Loop and Systems

## Status key

Systems marked **launch-critical** must exist in the first vertical slice at minimal depth. Items marked **future** are deliberately excluded until the central premise validates. Numeric examples are tuning parameters.

## Nested loops

### Moment-to-moment Expedition loop — launch-critical

At a Waystation, choose a small supply and instrument loadout and a route suggested by incomplete Atlas information. Travel one leg, reveal current conditions or an encounter, then allocate limited resources among movement, Observation, mitigation, salvage, and retreat. Each choice updates risk and remaining return capacity. Repeatedly decide whether another uncertain leg is worth endangering banked findings. A normal Expedition targets three to seven minutes.

The player cannot simultaneously maximize personal reward, distance, safety, and public knowledge. Thorough Observation consumes resources or opportunity; salvaging competes with surveying; pressing farther makes return less certain.

### Session loop — launch-critical

Inspect the Atlas and Logbook, choose a purpose, equip, travel, observe, return or fail, resolve rewards, publish selected Reports, and inspect the changed Atlas. A second Expedition should be informed by the first or by prior activity.

### Return and publication — launch-critical

A successful return banks eligible findings and transfers valid Observations to the Logbook. The player selects a limited subset to publish as Reports. Publication is structured, not free text, and may trade off against private advantage or another benefit. Unpublished Observations remain personal. Failure banks less and may create a Trace.

## Information model

### Ground truth and player knowledge

**Ground truth** is the hidden, server-authoritative state: actual nodes, routes, hazards, opportunities, conditions, and Drift history. A player's planning view is derived only from their Observations, accessible Reports, and explicit uncertainty rules. Client presentation must never become an accidental oracle.

### Observations

An **Observation** is immutable evidence directly obtained during an Expedition: for example route passability, hazard class, condition intensity, resource opportunity, or local change. It records subject, category, observed value/range, world revision or logical time, observing Expedition, instrument/method, and quality. The MVP uses system-validated Observations; players cannot manufacture them.

### Reports and the Atlas

A **Report** is a valid Observation deliberately published to the shared **Atlas**. The Atlas aggregates claims; it does not replace them with automatic certainty. Every displayed claim exposes:

- **Age:** logical time or Drift cycles since Observation, shown in human-readable form.
- **Provenance:** source class and Expedition identity/pseudonymous attribution sufficient to assess independence, without exposing personal data.
- **Confidence:** evidence quality produced by instrument, conditions, and validation—not a guarantee of current truth.
- **Corroboration:** number and recency of independent compatible Reports; repeated evidence from the same Expedition is not independent.
- **Change warning:** whether known Drift could have affected the subject since Observation.

Conflicting valid Reports may coexist when they describe different times or uncertain readings. The interface must explain disagreement rather than silently choose one.

### Drift — launch-critical at minimal depth

**Drift** is controlled, deterministic world change applied at explicit logical boundaries. It may alter route conditions, hazards, opportunities, or local topology. Drift never retroactively edits a Report; it makes the historical claim potentially stale. The MVP includes at least one visible Drift event and clear age/change cues. Frequency and scope are tuning parameters.

## Persistent systems

### Waystations

A **Waystation** is a collectively developed landmark and Expedition start. Launch-critical scope includes one starting Waystation and one bounded contribution project whose completion improves a local property, such as safer departure, greater range, route stability, or Observation reliability. Future possibilities include branching specializations, multiple sites, maintenance, histories, and regional networks.

### Traces

A **Trace** is recoverable evidence left by failure. Launch-critical scope is one structured Trace containing a bounded portion of lost findings or route evidence, recoverable in a later session. A Trace must not expose unrestricted player text. Future scope may include cooperative rescue chains and specialized recovery instruments.

### Logbook

The **Logbook** is the player's personal history of Expeditions, Observations, discoveries, publications, recovered Traces, and contributions. MVP scope is a concise session history and comparison between personal knowledge and published Atlas state. Search, annotation, collections, and long-form narrative are future possibilities.

## Progression

Personal progression is horizontal: unlock or choose instruments that reveal categories, improve Observation precision, alter route planning, or enable different strategies. Established players gain options, not overwhelming numerical strength. The MVP demonstrates loadout differentiation without a large unlock tree.

Collective progression occurs through Waystation projects that create persistent shared capability and history. Contributions compete with immediate personal use. MVP scope is one project across sessions; economies, governance, trading, and maintenance burdens are deferred.

## Failure and recovery

Failure should close an Expedition promptly, preserve the Logbook record, forfeit or reduce unbanked rewards, and optionally leave a Trace. It must be consequential without erasing long-term identity or making recovery impossible. Exact loss and Trace recovery rates are tuning parameters. Recovery should create a later planning opportunity, not undo all risk automatically.

## Low-population operation

One human can plan, travel, observe, publish, experience Drift, recover a Trace, and affect a later session. The initial Atlas includes a small, visibly aged set of system-generated baseline Observations. Deterministic simulated explorers can produce valid synthetic Reports and Waystation contributions under the same rules. Their source class remains distinguishable internally for analytics and, wherever provenance affects player trust, honestly represented in the interface. Synthetic rate diminishes as sufficient independent human activity appears; it never fabricates popularity or named people.

## Future social possibilities

After evidence and moderation review: constrained route requests, Waystation project priorities, opt-in cohorts, structured acknowledgments, and asynchronous specialist roles. Unrestricted public text chat, direct PvP, intentional fabrication, real-money trading, and synchronous matchmaking are not MVP features and are not presumed roadmap commitments.
