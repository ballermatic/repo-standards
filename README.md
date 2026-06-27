# Repo Standards

Portable repository standards for humans, editors, CI, and coding agents.

The first standard is formatting: keep formatting boring, repo-local, and enforceable without relying on personal editor defaults.

## Standards

- [`formatting/`](formatting/) — shared formatting posture, baseline files, agent instructions, and migration scripts.

## Operating model

Each standard should include:

1. A human-readable policy.
2. Copyable baseline files.
3. Agent-facing instructions.
4. Script names that stay stable across repos.
5. Adoption guidance that separates baseline configuration from broad normalization.

Repos should be self-contained after adoption. Agents should not need private dotfiles or external memory to know how to behave.

## Formatting quick start

For modern Vite, Astro, React, and TypeScript repos, start with the Oxc-ready baseline:

```sh
node formatting/scripts/apply-formatting-standard.mjs --variant oxc-ready --target /path/to/repo
```

For simpler or documentation-heavy repos, use the Prettier-first baseline:

```sh
node formatting/scripts/apply-formatting-standard.mjs --variant prettier-first --target /path/to/repo
```

Audit a repo:

```sh
node formatting/scripts/audit-formatting.mjs /path/to/repo
```

## Current default posture

- Prettier remains the default formatter.
- Oxlint is allowed as linting infrastructure.
- Oxfmt is opt-in only after repo-specific compatibility review.
- Broad formatting runs belong in dedicated baseline commits.
- Feature work should format touched files only.
