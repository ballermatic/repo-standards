# Formatting Adoption

Use staged adoption. Do not turn formatting into a repo-wide churn event unless the repo is ready for a dedicated baseline commit.

## Configless repo + agent formatter failure mode

A repo with no checked-in formatting contract is especially risky when coding agents edit it. The agent may make a small behavior change, then an editor, diagnostics pass, or harness formatter may later choose a global default and rewrite indentation or wrapping. That churn can look like intentional work and can hide the real diff.

Prevent this by completing Stage 1 before substantial agent work. If Stage 1 is not present, agents should not run write-mode formatters; they should report the gap and keep the baseline change separate from product changes.

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

Minimal TypeScript/Node baseline:

`.editorconfig`:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
```

`.prettierrc.json`:

```json
{
  "printWidth": 100,
  "singleQuote": false,
  "semi": true,
  "trailingComma": "all"
}
```

`package.json` scripts:

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check": "pnpm format:check"
  }
}
```

Add the `AGENTS.md` formatting section from `formatting/agent-instructions.md` with the baseline.

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

## Audit path

Run:

```sh
node formatting/scripts/audit-formatting.mjs /path/to/repo
```

The audit flags:

- missing `.editorconfig` and other baseline files;
- JavaScript or TypeScript files without checked-in formatter config;
- mixed leading tabs and spaces in source files;
- changed files where tabs or mixed prefixes are introduced compared with `HEAD`, which often indicates formatter fallback churn after an agent run.

If the audit reports formatter churn, separate real task changes from whitespace-only changes before committing.

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
