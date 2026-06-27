# Formatting Policy

Formatting is controlled by checked-in project files. It is not controlled by personal editor defaults, global formatter installs, or agent preference.

The goal is consistency without churn.

## Project contract

Each repo should be self-contained and should declare its formatting posture through checked-in files:

- `.editorconfig` defines baseline whitespace behavior for editors.
- `.gitattributes` normalizes text files to LF line endings at the Git boundary.
- `.prettierrc.json` defines Prettier formatting choices where Prettier owns formatting.
- `.prettierignore` excludes generated, dependency, cache, binary-heavy, and build-output paths.
- `.vscode/settings.json` makes VS Code follow the repo posture when relevant extensions are installed.
- Package or task scripts expose the commands humans, CI, and agents should run.

VS Code extensions are optional. The repository contract is not.

## Defaults

Unless a repo has a documented reason to differ, use:

- LF line endings.
- Final newline on saved text files.
- Two-space indentation.
- Spaces instead of tabs.
- Trim trailing whitespace, except where a file type commonly uses meaningful trailing whitespace.
- Prettier as the default formatter for JavaScript, TypeScript, JSON, Markdown, CSS, and common frontend files.
- Project-local formatter commands instead of global tooling.

## Formatting versus linting

Formatting and linting are separate concerns.

Formatters own whitespace, wrapping, punctuation style, and other mechanical layout decisions.

Linters own correctness, safety, accessibility, maintainability, and other code-quality rules.

Do not let linters become competing formatters unless the repo explicitly documents that choice.

## Oxc, Oxlint, and Oxfmt

Oxc-family tools are allowed when they improve speed, correctness, or ecosystem alignment.

Oxlint may be adopted as linting infrastructure. It should not introduce formatting churn unless the repo explicitly enables fixer behavior and documents that choice.

Oxfmt may be adopted as a formatter only as an explicit repo-level decision. Do not run Prettier and Oxfmt as competing formatters over the same file types.

Before adopting Oxfmt, verify support for the repo's actual file types and framework syntax, especially:

- `.astro`
- `.vue`
- `.svelte`
- MDX
- Tailwind class sorting
- embedded code blocks
- generated files
- framework-specific parser edge cases

Formatter migrations must happen in dedicated baseline commits with no behavior changes mixed in.

## Churn policy

Do not run broad whole-repo formatting during normal feature, bugfix, refactor, or documentation work.

When a file is touched for product, reliability, or documentation changes, it may be normalized by the project formatter. That normalization should be limited to touched files.

If a repo needs to normalize existing files, do it in a dedicated formatting commit or PR with no behavior changes.

## Agent policy

Agents must follow the checked-in repository configuration.

Agents must not:

- Use global formatter defaults.
- Invent formatter commands.
- Run broad whole-repo formatting as part of unrelated work.
- Change formatter configuration without explicit approval.
- Mix formatting-only churn with behavior changes.
- Migrate from Prettier to Oxfmt unless explicitly asked.

Agents should:

- Inspect available project scripts before running formatter commands.
- Prefer check-only commands before finalizing.
- Format touched files only during feature work.
- Keep formatting-only work isolated.

## Portability rule

Standardize posture, file names, script names, and agent behavior.

Do not force every repo to use identical tools. Rust, Go, Python, shell, and mixed-language repos may use their ecosystem-standard formatters as long as the repo exposes clear local scripts and avoids competing formatters per file type.
