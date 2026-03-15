---
project_name: 'tiime'
user_name: 'Youness'
date: '2026-03-07'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 45
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Language:** TypeScript ^5.9.3 (strict mode, target ES2022, module ESNext, moduleResolution bundler)
- **Runtime:** Node.js >=20 (tested on 22 & 24)
- **Package Manager:** pnpm 10.30.2
- **Build:** tsup ^8.5.1 — dual entry: SDK (`dist/index.js` + types) and CLI (`dist/cli.js` with shebang)
- **Linter/Formatter:** Biome ^2.4.6 (tabs, organize imports, recommended rules)
- **Tests:** Vitest ^4.0.18 (globals enabled)
- **CLI Framework:** citty ^0.2.1
- **HTTP Client:** ofetch ^1.5.1
- **Release:** Changesets with npm provenance

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **ESM only** — `"type": "module"` in package.json. No CommonJS. Use `import`/`export` exclusively.
- **Strict mode enforced** — No `any`, no implicit returns, no unused variables.
- **Node.js built-ins** — Import with `node:` prefix (`node:fs`, `node:os`, `node:path`, `node:child_process`).
- **Type-only exports** — Use `export type *` for re-exporting types (see `src/index.ts`).
- **Class-based architecture for SDK** — Resources are classes with `private fetch: $Fetch` and `private companyId: number` injected via constructor.
- **Interfaces over types** — Project uses `interface` for all data shapes (API responses, params, configs).
- **Nullability** — API fields use `string | null` (not optional `?`). Match API contract exactly.
- **Error handling** — Custom `TiimeError` class with `status`, `endpoint`, `details`. CLI commands wrap in try/catch + `outputError()`.
- **No enums** — Use string literal unions or objects for constants (e.g., `"draft" | "saved"`).
- **Numeric coercion** — CLI args come as strings from citty. Always `Number()` when passing to SDK methods.

### Framework-Specific Rules (CLI + SDK + API)

**SDK Architecture:**
- `TiimeClient` is the entry point — instantiated with `{ companyId }`, creates `ofetch` instance with auth interceptor.
- Resources are lazy getters on `TiimeClient` (e.g., `get invoices()` returns `new InvoicesResource(this.fetch, this.companyId)`).
- All API calls go through the shared `$Fetch` instance — never call `ofetch` directly in resources.
- API base URL: `https://chronos-api.tiime-apps.com/v1` — hardcoded in `client.ts`, not configurable.

**API Tiime Specifics:**
- Auth: Auth0 password grant (`grant_type: "password"`, NOT `password-realm`).
- Custom headers required on every request: `tiime-app: tiime`, `tiime-app-version: 4.30.3`, `tiime-app-platform: cli`.
- Pagination via `Range: items={start}-{end}` header, NOT query params.
- Content negotiation: some endpoints need `Accept: application/vnd.tiime.*.v2+json`.
- Auto-retry: 2 retries, 500ms delay, on status 408/429/500/502/503/504.

**CLI Architecture (citty):**
- Commands defined with `defineCommand()` — always include `meta: { name, description }`.
- Subcommands pattern: top-level command has `subCommands` object, each sub uses `defineCommand()`.
- All output goes through `output()` utility — supports json/table/csv via `--format` arg.
- Errors always through `outputError()` — never `console.error` + `process.exit` directly.
- French descriptions by default, English translations in `i18n.ts`.
- `getCompanyId()` from config for every command that needs company context.

**Auth & Config Storage:**
- Tokens: `~/.config/tiime/auth.json`
- Company config: `~/.config/tiime/config.json`
- Credentials: macOS Keychain first, fallback to `~/.config/tiime/credentials.json` (mode 0o600).
- Token auto-refresh: `TokenManager.getValidToken()` re-authenticates from stored credentials if expired.

### Testing Rules

- **Framework:** Vitest with globals enabled (`describe`, `it`, `expect` available without import).
- **No existing tests yet** — when adding tests, follow these conventions:
  - Co-locate test files next to source: `src/sdk/resources/invoices.test.ts` alongside `invoices.ts`.
  - Test file naming: `{module}.test.ts` (not `.spec.ts`).
- **Run tests:** `pnpm test` (single run) or `pnpm test:watch` (watch mode).
- **SDK tests should mock `ofetch`** — never make real API calls in tests.
- **CLI tests should test command logic** — mock `TiimeClient` and verify output format.
- **CI runs:** `pnpm lint` → `pnpm build` → `pnpm test` → binary smoke test (`node dist/cli.js version`).

### Code Quality & Style Rules

**Biome Configuration:**
- Indentation: **tabs** (not spaces).
- Import organization: automatic via Biome `organizeImports: "on"`.
- Linter rules: `recommended` preset — no custom overrides.
- Run before commit: `pnpm lint` (`biome check src/`).

**File & Folder Structure:**
- `src/sdk/` — SDK layer (auth, client, errors, types, resources/).
- `src/sdk/resources/` — One file per API resource (kebab-case: `bank-accounts.ts`, `expense-reports.ts`).
- `src/cli/` — CLI layer (index, config, output, i18n, commands/).
- `src/cli/commands/` — One file per top-level command (kebab-case).
- `src/index.ts` — Public SDK exports only (no CLI).
- `skill/` — Claude Code skill definition.
- `docs/` — API documentation and guides.

**Naming Conventions:**
- Files: `kebab-case.ts`
- Classes: `PascalCase` (e.g., `InvoicesResource`, `TiimeClient`, `TokenManager`)
- Interfaces: `PascalCase`, no `I` prefix (e.g., `Invoice`, `BankTransaction`)
- Methods/functions: `camelCase`
- CLI arg names: `kebab-case` (e.g., `--client-id`, `--page-size`, `--dry-run`)
- Constants: `UPPER_SNAKE_CASE` for module-level (e.g., `AUTH0_DOMAIN`, `BASE_URL`)

**Output Conventions:**
- Data output: always `process.stdout.write()` via `output()` helper.
- Human messages: `consola` or `console.error` (stderr) — keep stdout clean for piping.
- Error output: `process.stderr.write()` via `outputError()` + `process.exit(1)`.

### Development Workflow Rules

**Git & Commits:**
- Conventional commits in English: `feat:`, `fix:`, `chore:`, `refactor:`, etc.
- Never commit or push without explicit user request.

**Branching:**
- Main branch: `main`
- CI runs on push to `main` and on PRs targeting `main`.

**Release Process:**
- Changesets-based: add changeset → PR merged → changesets/action creates release PR or publishes.
- `pnpm run release` triggers `changeset publish`.
- npm provenance enabled for supply chain security.

**CI Pipeline (GitHub Actions):**
- Matrix: Node 22 + 24 on ubuntu-latest.
- Steps: `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm build` → `pnpm test` → `node dist/cli.js version`.
- Concurrency: cancel in-progress for non-main branches.

**Local Development:**
- `pnpm dev` — tsup watch mode.
- `pnpm lint` — Biome check before considering task done.
- `pnpm build` — verify both bundles produce valid output.

**Homebrew Distribution:**
- Separate workflow (`.github/workflows/homebrew.yml`) for tap updates.

### Critical Don't-Miss Rules

**Anti-Patterns:**
- NEVER use `npm` or `yarn` — always `pnpm`.
- NEVER add `console.log` for data output — use `output()` helper (stdout stays clean for piping/parsing).
- NEVER instantiate `ofetch` directly in resource classes — use the injected `$Fetch` from constructor.
- NEVER store secrets in plain config files without trying Keychain first.
- NEVER use `require()` — ESM only.

**API Gotchas:**
- Auth0 grant type is `password`, NOT `password-realm` — using the wrong one silently fails.
- Pagination uses `Range` HTTP header, not `?page=` query params — forgetting this returns only first page.
- Some list endpoints return HTTP 206 (Partial Content) — this is normal, not an error.
- The `tiime-app-version` header must match a known version or requests may be rejected.
- `__VERSION__` is a tsup `define` constant injected at build time from `package.json` — don't import it, use it directly.

**CLI Gotchas:**
- citty args are always strings — `Number()` conversion required for IDs, pages, amounts.
- `--format` arg defaults to `"json"` — always spread `formatArg` in commands that output data.
- When adding a new command: add French description, add English translation in `i18n.ts`, register in `cli/index.ts`.
- i18n: CLI descriptions are in French by default, `TIIME_LANG=en` switches to English. New descriptions MUST have both.

**SDK Extension Pattern:**
- New resource: create `src/sdk/resources/{name}.ts` with class taking `($Fetch, companyId)`.
- Add lazy getter in `TiimeClient`: `get {name}() { return new {Name}Resource(this.fetch, this.companyId); }`.
- Add types in `src/sdk/types.ts`.
- Export from `src/index.ts` if part of public SDK API.

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code.
- Follow ALL rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new patterns emerge.

**For Humans:**
- Keep this file lean and focused on agent needs.
- Update when technology stack changes.
- Review periodically for outdated rules.
- Remove rules that become obvious over time.

Last Updated: 2026-03-07
