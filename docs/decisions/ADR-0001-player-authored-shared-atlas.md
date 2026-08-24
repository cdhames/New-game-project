# ADR-0001: Player-Authored Shared Atlas

- **Status:** Accepted as a design lock, subject to MVP validation
- **Date:** 2026-08-23

## Context

An internet-native game should depend meaningfully on networked human activity without requiring synchronous matches or a large launch population. Conventional omniscient maps make exploration information a solved interface problem. The project instead needs persistent cooperation, uncertainty, and trust that remain playable with one human online.

## Decision

The server maintains hidden **Ground truth** for the shifting archipelago. Players learn only from direct **Observations** and structured **Reports** deliberately published to the shared **Atlas**. Reports retain age, provenance, confidence, corroboration, and possible Drift exposure. Valid observations may be withheld but not fabricated in the first version. The Atlas is a claims system and historical public artifact, never an automatically accurate global map.

This becomes the central internet-native mechanic. Route planning, instruments, resource pressure, Drift, Waystations, Traces, Logbook history, progression, and asynchronous contribution must reinforce it.

## Alternatives considered

- An omniscient map with fog of war: clear but makes shared information secondary.
- Automatic sharing of every Observation: supports cooperation but removes disclosure choice.
- Individual maps only: viable solo exploration but weak persistent multiplayer meaning.
- Free-form player claims, including lies: deep social deduction but creates moderation, harassment, and cold-start trust problems outside MVP scope.
- Synchronous cooperative mapping: rich coordination but violates low-population and short-session goals.

## Positive consequences

- Network participation changes the primary play surface asynchronously.
- Knowledge can be valuable without direct PvP or unrestricted chat.
- Short Expeditions contribute to a persistent shared artifact.
- Age, corroboration, and Drift create recurring verification work.
- Bots and baseline Observations can support an honest cold start under the same rules.
- The Atlas supplies a distinctive visual and thematic identity.

## Negative consequences

- Players may experience uncertainty as confusion or unfairness.
- The UI must communicate evidence without information overload.
- Hidden state increases security, projection, replay, and debugging complexity.
- Publication may be dominated by an obvious strategy or ignored.
- Sparse populations complicate corroboration; high populations may solve regions too quickly.
- Historical claims require careful persistence and version semantics.

## Risks and mitigations

Mitigate opacity with structured evidence and accessible explanations; tune publication scarcity and incentives through simulation; bound Drift and surface change warnings; distinguish synthetic sources honestly; protect Ground truth server-side; retain conflicting time-indexed Reports rather than silently overwriting; and reconsider the premise if evidence still fails the criteria below.

## Validation criteria

In the MVP, players must alter route choices based on incomplete Atlas evidence, explain why a Report may be stale, face a meaningful publication selection, see a publication affect a later session, and play meaningfully with one human online. Simulations must show useful but non-omniscient coverage, more than one viable strategy, and no exploit that manufactures corroboration. Repeated failure across reasonable tuning ranges triggers explicit reconsideration under the [MVP failure conditions](../design/MVP_SPEC.md#reconsideration-conditions).
