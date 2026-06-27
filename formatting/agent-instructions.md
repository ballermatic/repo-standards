# Agent Formatting Instructions

Use this as a drop-in section for `AGENTS.md`.

```md
## Formatting

Formatting is controlled by checked-in project files. Do not use global formatter defaults.

Before changing formatting configuration, ask for explicit approval.

During feature, bugfix, refactor, or documentation work:

- Inspect available project scripts before running formatter commands.
- Prefer `format:check`, `lint`, or `check` scripts before finalizing.
- Format only files you touched.
- Do not run broad whole-repo formatting.
- Do not mix formatting-only churn with behavior changes.
- Do not migrate between formatter tools unless explicitly asked.

Dedicated formatting normalization must happen in a separate commit or PR with no behavior changes.
```

## Practical agent behavior

When working in a repo, use this order:

1. Read `package.json`, task runner config, and repo docs for available commands.
2. Run check-only commands first when available.
3. Use write-mode formatters only when needed.
4. Stage formatting changes only for files that belong to the task.
5. Report any formatter config gaps rather than inventing new policy.

## Forbidden default behavior

Do not do any of these unless explicitly asked:

- `prettier --write .` in a repo that does not expose it as a project script.
- `oxfmt .` in a Prettier-first repo.
- `eslint --fix` as a broad cleanup during unrelated work.
- Whole-repo formatting in the same commit as product changes.
