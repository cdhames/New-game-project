# Project Operating Rules

## Repository Role

This repository is the authoritative source repository for the game project.

## Development Workflow

- Do not make substantive feature changes directly on main.
- Use descriptive feature, fix, documentation, or setup branches.
- Keep commits focused, incremental, and reviewable.
- Do not rewrite published Git history unless explicitly instructed.
- Do not force-push unless explicitly authorized.
- Do not delete substantial existing work without explicit authorization.

## Change Discipline

- Inspect existing code and documentation before modifying related systems.
- Preserve established architecture and game-design decisions unless explicitly instructed to change them.
- Do not silently redesign gameplay systems, schemas, architecture, naming conventions, or data models.
- Document important architectural or gameplay decisions when they are implemented.
- Keep README and project documentation synchronized with material implementation changes.

## Quality

- Run relevant tests, builds, linters, and validation before considering implementation complete.
- Fix regressions introduced by your changes before committing.
- When tests or validation cannot be run, clearly report why.
- Prefer simple, maintainable implementations over unnecessary complexity.

## Safety

- Never commit API keys, passwords, tokens, credentials, private keys, or other secrets.
- Do not add secrets to source files, documentation, test fixtures, or Git history.
- Use environment variables and example configuration files where appropriate.
- Do not install unnecessary system-wide software or make unrelated system changes.

## Scope Control

- Modify only files relevant to the requested task.
- Do not perform unrelated refactoring during feature work unless necessary.
- Report assumptions when requirements are ambiguous rather than silently inventing major product decisions.

## GitHub

- Treat GitHub as the persistent source of truth.
- Before pushing, confirm the current branch and intended remote.
- Do not merge into main unless explicitly instructed or the workflow specifically calls for it.
- Prefer pull-request-style development once the repository contains substantive project code.

## Game Project Principle

The implementation must follow the approved game design and project requirements. Codex may propose alternatives, but material gameplay, economy, architecture, data-model, or product-scope changes require explicit approval before implementation.
