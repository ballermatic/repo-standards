# Formatting Standard

Formatting is repository infrastructure. The repository contract wins over personal editor defaults, global formatter installs, and agent assumptions.

This standard is intentionally conservative:

- Prettier remains the default formatter for frontend and documentation-heavy repos.
- Oxlint may be adopted earlier as linting infrastructure.
- Oxfmt is treated as an explicit repo-level opt-in until compatibility is proven for the repo's actual file types.
- Broad formatting normalization is isolated from feature, bugfix, and refactor work.

## Contents

- [`policy.md`](policy.md) — canonical formatting policy.
- [`agent-instructions.md`](agent-instructions.md) — drop-in section for `AGENTS.md`.
- [`adoption.md`](adoption.md) — staged rollout model for existing repos.
- [`baseline/prettier-first/`](baseline/prettier-first/) — default portable baseline.
- [`baseline/oxc-ready/`](baseline/oxc-ready/) — Prettier-first baseline with Oxlint enabled and Oxfmt disabled.
- [`templates/package-scripts/`](templates/package-scripts/) — stable script-name snippets.
- [`scripts/`](scripts/) — small Node scripts for auditing and applying the baseline.

## Baseline recommendation

Use `baseline/oxc-ready` for modern Vite, Astro, React, and TypeScript repos where Oxlint is likely to be useful but Oxfmt should not become the formatter by accident.

Use `baseline/prettier-first` for simpler repos or documentation repos.

## Stable command contract

Repos should expose these script names when applicable:

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "oxlint .",
    "lint:fix": "oxlint . --fix",
    "check": "pnpm format:check && pnpm lint"
  }
}
```

The script names are the contract. The implementation may vary by repo and language.
