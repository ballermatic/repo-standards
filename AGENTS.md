# Agent Instructions

This repo defines portable repository standards. Keep the standards boring, explicit, and reusable.

## Scope

Do not turn a standard into a tool preference argument. Prefer small policies, copyable config files, stable script names, and clear adoption guidance.

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

## Content style

Use direct, operational language. Avoid generic best-practice filler.

When adding standards, include:

- policy;
- baseline files;
- agent guidance;
- adoption path;
- audit or verification path where practical.
