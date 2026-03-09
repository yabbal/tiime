# Contributing to Tiime CLI

Thanks for your interest in contributing! This project is a personal, experimental tool — contributions are welcome.

## Getting started

```bash
# Clone the repo
git clone https://github.com/yabbal/tiime.git
cd tiime

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project structure

```
tiime/
├── packages/tiime-sdk/   # TypeScript SDK (published on npm)
├── packages/tiime-cli/   # CLI tool (published on npm, depends on tiime-sdk)
├── apps/docs/            # Documentation site (Fumadocs)
└── turbo.json            # Turborepo config
```

## Development workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes** — follow existing code conventions:
   - TypeScript strict mode
   - Arrow functions preferred
   - Formatted with [Biome](https://biomejs.dev/)

3. **Commit your changes** using commitizen:
   ```bash
   pnpm commit    # Interactive conventional commit prompt
   ```

   Git hooks ([Lefthook](https://github.com/evilmartians/lefthook)) run automatically:
   - **pre-commit** — Biome lint on staged files
   - **commit-msg** — validates conventional commit format ([commitlint](https://commitlint.js.org/))
   - **pre-push** — build + tests

4. **Add a changeset** if your change affects a published package:
   ```bash
   pnpm changeset
   ```

5. **Open a pull request** against `main`.

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint:

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `chore:` — maintenance, deps, CI
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests

Use `pnpm commit` for an interactive prompt, or write the message manually.

## Reporting bugs

Use the [bug report template](https://github.com/yabbal/tiime/issues/new?template=bug_report.yml) to file issues.

## Suggesting features

Use the [feature request template](https://github.com/yabbal/tiime/issues/new?template=feature_request.yml) to suggest ideas.

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.
