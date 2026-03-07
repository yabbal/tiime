# Changelog

## 1.1.1

### Patch Changes

- [`75933c0`](https://github.com/yabbal/tiime-cli/commit/75933c0b28a909c9dc5329be4b532b91d71482cd) Thanks [@yabbal](https://github.com/yabbal)! - Fix CI workflow for npm publish with granular access token

## 1.1.0

### Minor Changes

- [`0a1571e`](https://github.com/yabbal/tiime-cli/commit/0a1571efbdba92a55dd33a66f06295edfb24c0d9) Thanks [@yabbal](https://github.com/yabbal)! - Initial public release of tiime-cli

  - Authentication with Auth0 + macOS Keychain storage
  - Invoices: list, create, duplicate, update, send, download PDF, delete
  - Quotations: list, create, send, download PDF
  - Clients: list, get, create, search
  - Bank: accounts, balance, transactions, unimputed
  - Expense reports: list, get, create
  - Documents: list, upload, download, categories
  - Labels & Tags management
  - Multi-format output: JSON (default), table, CSV
  - Bilingual help: French/English with system language auto-detection
  - Shell completion: zsh, bash, fish
  - Automatic retry with backoff on 429/5xx errors
  - SDK exportable as TypeScript library

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-07

### Added

- **CLI commands**: auth, company, invoices, clients, bank, quotations, expenses, documents, labels, status, open, version, completion
- **Invoice management**: list, get, create (single & multi-line), duplicate, update, send, pdf, delete
- **Quotation management**: list, get, create, pdf, send
- **Client management**: list, get, create, search
- **Bank features**: accounts, balance, transactions (with date/search filters), unimputed
- **Expense reports**: list, get, create
- **Document management**: list, categories, upload, download
- **Labels & Tags**: custom labels, standard labels, tags
- **Output formats**: JSON (default), table, CSV via `--format`
- **Bilingual help**: French (default) and English via `TIIME_LANG` env var or system language detection
- **Shell completion**: zsh, bash, fish with descriptions
- **Colored status summary**: bank balances, invoices, quotations, clients, unmatched transactions
- **SDK**: TypeScript SDK with all resources exported for programmatic use
- **Auth**: Auth0 login with macOS Keychain storage, auto-refresh
- **Retry**: Automatic retry with backoff on 429/5xx errors
- **Dry-run**: Preview invoice payload before creating
- **Interactive login**: Beautiful terminal UI with @clack/prompts
- **Tests**: 47 unit tests covering SDK resources and CLI output
- **CI**: GitHub Actions for lint, build, test on Node 20 & 22
