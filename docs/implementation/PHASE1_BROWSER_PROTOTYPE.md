# Phase 1 Browser Prototype

## Status

This feature branch adds the first locally playable, player-facing browser prototype for The Long
Map. It presents the existing deterministic Phase 1 core through React and Vite; it does not move or
duplicate authoritative rules into UI components. It is a local development artifact, not a hosted
online game.

## Implemented loop

The interface supports every phase currently advertised by `PlayerSafeProjection.actions`: choosing
two of three instruments, starting an Expedition, traversing known routes, observing, salvaging,
returning or resolving an eligible failure, publishing zero to three Reports, and advancing required
Drift. The changed Atlas, personal Logbook, visible Traces, resources, and sanitized recent activity
remain available across local reloads.

The first screen contains the working title, tagline, a concise claims-not-truth explanation, six
baseline Reports, the known-map centerpiece, text-equivalent topology, three described instruments,
two default selections, and the departure action. No login or account is required.

## Local-authority boundary

`apps/web/src/authority.ts` owns `CanonicalState` inside an in-process local authority. React receives
only `PlayerSafeProjection`, sanitized event summaries, dispatch functions for legal commands, and
local lifecycle controls. Components derive controls only from safe affordances and never inspect or
mutate canonical state. Raw `DomainEvent` payloads are not passed into React because Phase 1 events
currently include broad canonical snapshots.

This boundary preserves the shape of a future authoritative host but does not create security. A
player controls their own browser process and storage, so browser-local Ground truth is not suitable
for a competitive, shared, persistent, or production world.

## Command-log persistence

The current localStorage key is `the-long-map.local-prototype.v3`. Its value stores only:

- local record version `3`, protocol version `3`, and scenario version `1.2.0`;
- deterministic initial seed;
- accepted, schema-valid `PlayerCommand` values in order.

Load validates record shape and version, validates every command with `PlayerCommandSchema`, creates
the initial state, and replays each command through `applyCommand`. A rejected replay produces a safe
recovery screen without silently discarding history. Accepted commands receive monotonically
increasing IDs derived from the validated history length and are persisted only after core
acceptance. On load, the authority requires the browser-local `local-command-N` format and derives
the next sequence from the greatest persisted `N`, so valid non-contiguous histories cannot reuse an
accepted ID. Histories containing other StableId forms fail closed as incompatible rather than being
rewritten. Schema-invalid, core-rejected, and unpersisted actions do not consume accepted sequence
numbers.

Dispatch is transactional at the browser boundary: it validates and applies against a candidate
state, writes the complete next command record, and only then commits canonical state, activity, the
accepted command list, and the sequence number in memory. A localStorage write failure leaves the
authority aligned with persisted history and presents a safe retry message. Domain events, canonical
snapshots, and arbitrary React state are not persisted.

If v3 is absent but a known v1 or v2 key exists, loading fails closed with a rules-version recovery
screen and leaves both legacy records untouched. No speculative outcome migration is attempted.
Confirmed reset removes only the known v1, v2, and v3 Long Map keys and creates a fresh deterministic
world. The App increments an explicit authority generation and remounts the view-owning game shell,
so a valid active session immediately displays the new fresh projection instead of retaining the
previous shell's initialized view. Unrelated localStorage values are untouched.

## Default seed

The provisional development seed is `20260804`. The route between Lantern Harbor and Whisper Shoal
has zero initial hazard, so the default world always permits a simple first outward crossing and
return without unavoidable damage. Other routes retain the scenario's meaningful hazard and supply
risk. Bounded deterministic checking also confirms that after three simple resolved round trips the
seed's first Drift can mark at least one existing baseline Report potentially stale.

The seed is absent from the primary play surface and appears only under Developer details.

## Interface and visual system

### Revision 0.2 resource projection

The browser now uses a deliberate single-screen desktop shell at widths of 1100 CSS pixels and
above. A compact status bar distinguishes the restored Waystation baseline from active Expedition
Provisions, Vessel Integrity, selected-instrument Charges, banked/unbanked Findings, Return Reserve,
world revision, and Drift state. The map receives the
largest workspace column, the mission/action panel remains beside it in normal grid layout, and the
Atlas, Logbook, and Activity occupy one tabbed secondary-information panel. About, developer details,
and the unchanged targeted reset are in a compact utility bar.

The presentation hierarchy is:

- `App` owns authority loading, reset lifecycle, and local UI selections;
- `GameShell` owns the current safe view and dispatch bridge;
- `StatusBar` renders compact safe status;
- `MapWorkspace` renders only known safe nodes and routes;
- `MissionActionPanel` renders setup, Expedition, publication, Drift, and failure controls; and
- `SecondaryInformationTabs` renders Atlas, Logbook, and sanitized Activity content.

React continues to receive only `PlayerSafeProjection`, sanitized activity summaries, legal command
dispatch, and local lifecycle controls. No deterministic decision moved into React.

Desktop document scrolling is suppressed only at the supported desktop breakpoint. The application
grid and each shrinkable child use bounded sizing and `min-height: 0`; long mission and secondary
content scrolls inside its own panel. The mission panel is neither sticky nor fixed and cannot overlay
the map or secondary information. Atlas, Logbook, and Activity use accessible `tablist`, `tab`, and
`tabpanel` semantics with Atlas initially selected, roving focus, mouse/touch activation, and Left
Arrow/Right Arrow selection.

During an active Expedition the mission panel keeps Travel, Observe, Salvage, and Return in stable
order. Unavailable categories remain present with a core-derived safe explanation. Return Reserve is
identified as a known-route estimate rather than a safety guarantee, and salvage actions expose only
their broad family until the sanitized result summary states the resolved value. Legal Travel buttons are
generated only from `actions.traversableRouteIds` and known safe route descriptors inside the mission
panel. The full known-topology text alternative remains in the Atlas tab as secondary reference. The
SVG description points to the equivalent mission-panel controls.

Sanitized salvage activity reports the actual bounded effect rather than the nominal scenario value:
Provision caches state cost, restored amount, and net change; repair material distinguishes applied
repair from an already-full vessel; Findings caches state actual Findings and Provision cost. Raw
events and canonical snapshots remain outside React.

Below the desktop breakpoint, normal document scrolling returns and the DOM/reading order is compact
status, map, mission/actions, secondary tabs, then utilities. No CSS-only reordering contradicts that
order. The action panel is not sticky, tabs remain internally bounded, and the page prevents
horizontal overflow.

Actual in-app browser checks on `127.0.0.1` at 100% zoom produced these measurements:

| Phase / viewport | Document client / scroll size | Main panel bounds | Internal scrolling and overlap |
| --- | --- | --- | --- |
| Setup/result, 1366 × 768 | 1366 × 768 / 1366 × 768 | map 633 × 553; actions 314 × 553; tabs 371 × 553 | action scroller 519 / 2468–2640 px; no overlap |
| Active/publication, 1366 × 768 | 1366 × 768 / 1366 × 768 | map 633 × 535; actions 314 × 535; tabs 371 × 535 | action scroller 501 / 675–1257 px; all four action categories reachable; no overlap |
| Setup/result, 1440 × 900 | 1440 × 900 / 1440 × 900 | map 668 × 685; actions 332 × 685; tabs 392 × 685 | action scroller 651 / 2496 px; no overlap |
| Active/publication, 1440 × 900 | 1440 × 900 / 1440 × 900 | map 668 × 685; actions 332 × 685; tabs 392 × 685 | action scroller 651 / 654–1240 px; all four action categories reachable; no overlap |
| Setup, active, publication, result, 390 × 844 | 375 px measured layout and scroll width | intentional vertical stack; phase-dependent document height 2068–3595 px | no horizontal overflow or overlap; status → map → actions → tabs order |

The in-app browser's 390 CSS-pixel override reported a 375-pixel layout viewport, so both its client
and scroll widths are recorded rather than claiming an unavailable 390-pixel layout width. Setup and
active, publication, and next-setup flows, Commission progress, result retention, visible preparation
cost/remaining Findings, upgraded 9/9 Provisions, action visibility, and panel scrolling were
inspected. The browser console contained no warnings or errors.

- Atlas chart: fixed SVG presentation coordinates for the 12 provisional scenario nodes, filtered
  strictly by safe known node and route IDs; ordinary DOM route controls provide equivalent use.
- Expedition panel: phase-specific, affordance-driven instrument, travel, Observation, salvage,
  return, failure, publication, and Drift controls.
- Atlas Reports: reading, age, evidence quality, source class, independent corroboration, observed
  revision, and non-color staleness wording with category filtering.
- Personal Logbook: observations, publication state, Expedition provenance, and visible Traces.
- Activity: short summaries created from event kind and explicitly safe outcome fields; raw payloads
  and canonical snapshots never cross the rendering boundary.
- About/reset: prototype limitation, command count, seed detail, and confirmed targeted reset.

The original CSS/SVG presentation uses a dark shifting sea, luminous routes, current-line patterns,
cartographic labels, restrained glyphs, layered panels, responsive composition, and no external art.

## Accessibility

The page uses semantic headings and landmarks, a skip link, ordinary buttons/checkboxes/selects,
visible focus treatment, an `aria-live` outcome region, 44-pixel minimum controls, structured map
alternatives, and text or symbol indicators for selection, evidence, staleness, damage, location, and
visited state. No essential action requires hover or SVG interaction. Layout remains functional at
mobile widths. Motion is subtle and disabled under `prefers-reduced-motion` without removing state
information.

## Running locally

With Node.js 24 and pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm dev:web
```

Vite binds to `127.0.0.1`. Use `pnpm build:web`, `pnpm test:web`, and `pnpm preview:web` for the
focused browser workflows. Root typecheck, tests, build, and validation include the web package.

## Test coverage

Vitest, jsdom, and Testing Library cover initial Atlas/topology, absence of unrevealed topology,
legitimate baseline route revelation, exact loadout size, safe affordances, starting, Observation and
salvage visibility, deterministic round trip, zero-supply return precedence, publication and its
three-Report limit, publishing nothing, Drift gating/staleness, reload replay, corruption recovery,
targeted reset, accessible names, keyboard activation, reduced-motion information, and absence of
raw canonical/event snapshot content. Reliability coverage also exercises normal and canceled reset
from an active session, non-contiguous and rejection-safe command sequencing, reload uniqueness, and
transactional behavior when localStorage writes fail.

The publication-limit regression constructs four distinct legal Observations from two Sounding Line
and two Weather Glass Charges, verifies the fourth selection disables at three, verifies deselection
re-enables it, and confirms only the three selected Reports reach the Atlas.

Existing protocol, core, property, replay, simulation, and smoke tests remain unchanged.

## Known limitations and deferred work

The prototype has one local player, one fixed scenario, provisional tuning, a compact activity
history, and no secure separation between browser owner and hidden state. It does not implement an
API, database, networking, accounts, multiplayer synchronization, hosted persistence, telemetry,
payments, production security, infrastructure, final branding, unrestricted social text, Trace
recovery commands not yet present in the core, or the deferred Waystation contribution rule. Those
remain later-phase work subject to the project evidence gates.

The 1366 × 768 setup and active mission content can require scrolling inside the bounded action
panel, and the intentionally stacked mobile layout requires ordinary document scrolling. The current
foundation implements deterministic Commissions, preparation spending, Atlas Contribution, and a
concise previous-Commission result. It does not implement the final route-evidence redesign or
comprehensive Expedition completion summary. It does not add new map content or
production authority, persistence, or infrastructure.
