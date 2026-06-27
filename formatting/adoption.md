# Formatting Adoption

Use staged adoption. Do not turn formatting into a repo-wide churn event unless the repo is ready for a dedicated baseline commit.

## Stage 1: Standardized

Add the policy files and baseline configuration, but do not reformat the whole repo.

Expected files:

- `.editorconfig`
- `.gitattributes`
- `.prettierrc.json` when Prettier owns formatting
- `.prettierignore`
- `.vscode/settings.json`
- `AGENTS.md` formatting section
- package or task scripts for `format`, `format:check`, and optionally `lint`, `lint:fix`, `check`

This stage is safe for existing repos because it establishes behavior going forward without rewriting history.

## Stage 2: Baseline normalized

Run a dedicated formatting pass after review.

Commit message:

```txt
chore: normalize formatting baseline
```

Rules:

- No behavior changes.
- No dependency upgrades unless required for the formatter itself.
- No opportunistic refactors.
- Review the diff mechanically.

## Stage 3: Enforced

Add CI or local checks after the repo has absorbed the baseline.

Typical command:

```sh
pnpm format:check
```

For repos with linting:

```sh
pnpm check
```

Do not enforce formatting before the baseline is normalized unless the repo is already clean.

## Choosing a baseline

Use `baseline/prettier-first` when:

- the repo is simple;
- the repo is documentation-heavy;
- Oxc tooling is not relevant;
- maximum compatibility matters.

Use `baseline/oxc-ready` when:

- the repo is Vite, Astro, React, or TypeScript-oriented;
- Oxlint is useful;
- Prettier should remain the formatter;
- Oxfmt should not accidentally claim files through VS Code.

Use an Oxfmt-first posture only after explicit compatibility review and a dedicated formatter migration commit.
