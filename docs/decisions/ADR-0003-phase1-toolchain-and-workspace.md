# ADR-0003: Phase 1 Toolchain and Workspace

- **Status:** Accepted for the Phase 1 foundation
- **Date:** 2026-08-23

## Context

ADR-0002 requires a pure, deterministic TypeScript core shared by simulations and later browser/API
hosts. The repository needs reproducible dependency resolution and one local/CI validation surface.

## Decision

Use Node.js 24, pnpm 11.19.0 workspaces, TypeScript 6 in strict project-reference builds, Zod 4 for
runtime protocol schemas, Vitest 4 plus fast-check 4 for tests, ESLint 10 with typescript-eslint 8,
Prettier 3, and tsx 4 for the JSON smoke-study entry point. Commit the pnpm lockfile and pin direct
dependency versions. Allow only esbuild's required platform setup script; explicitly deny the unused
`unrs-resolver` build script.

The repository contains `protocol`, `game-core`, and `sim` packages. Root scripts provide formatting,
lint, typecheck, test, build, simulation, and aggregate validation. GitHub Actions runs frozen installs
and validation on Node 24.

## Rationale

Project references preserve package direction and allow later web/API packages to consume compiled
contracts without merging boundaries. Zod keeps runtime validation and inferred TypeScript types
adjacent. Vitest and fast-check support deterministic unit, replay, and invariant tests without a DOM.
pnpm's strict linking and lockfile reduce accidental dependency drift.

## Alternatives considered

- npm workspaces: capable, but conflicts with the approved pnpm direction and has weaker workspace
  filtering for the planned layout.
- Yarn: capable but adds no project-specific advantage.
- Jest: mature, but Vitest aligns with the documented TypeScript/Vite direction and later browser work.
- Handwritten validation: avoids a dependency but increases trust-boundary maintenance and type drift.
- A bundled simulation executable: unnecessary while the TypeScript runner remains local and bounded.

## Consequences

The project gains one reproducible command surface and a clean path to later browser and API hosts.
Costs include build configuration, dependency maintenance, explicit pnpm script approval, schema
versioning, and Node 24 as the supported baseline. Generated `dist`, coverage, caches, and build-info
files remain uncommitted.

Revisit this decision if a maintained tool becomes incompatible with supported Node, deterministic
replay differs across supported runtimes, workspace build performance becomes material, a browser/API
host demonstrates a boundary problem, or security/maintenance evidence makes a dependency unsuitable.
