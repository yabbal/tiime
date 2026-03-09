# Changelog

## 2.0.4

### Patch Changes

- Updated dependencies [[`5bb5333`](https://github.com/yabbal/tiime/commit/5bb5333a5845e75d6e395097a176c828779c8741)]:
  - tiime-sdk@2.2.0

## 2.0.3

### Patch Changes

- [#12](https://github.com/yabbal/tiime/pull/12) [`eed519c`](https://github.com/yabbal/tiime/commit/eed519c8c0f6198c1f2870e9ab3d1a0144e50d98) Thanks [@yabbal](https://github.com/yabbal)! - Fix CLI version display, prevent parameter mutation in create(), improve type safety, and fix French accents in docs

- Updated dependencies [[`eed519c`](https://github.com/yabbal/tiime/commit/eed519c8c0f6198c1f2870e9ab3d1a0144e50d98)]:
  - tiime-sdk@2.1.2

## 2.0.2

### Patch Changes

- [`50f4359`](https://github.com/yabbal/tiime/commit/50f435907037f66abcdd6bc4a7e1676ff6af82bd) Thanks [@yabbal](https://github.com/yabbal)! - Update repository URLs after repo rename from tiime-cli to tiime

- Updated dependencies [[`50f4359`](https://github.com/yabbal/tiime/commit/50f435907037f66abcdd6bc4a7e1676ff6af82bd)]:
  - tiime-sdk@2.1.1

## 2.0.1

### Patch Changes

- Updated dependencies [[`e2e48b2`](https://github.com/yabbal/tiime-cli/commit/e2e48b24a6f90261a972efcbd2166c7793f35740)]:
  - tiime-sdk@2.1.0

## 2.0.0

### Major Changes

- [`7bdbdad`](https://github.com/yabbal/tiime-cli/commit/7bdbdad4a90a45aa74b156f0f250f1bbef6f8d54) Thanks [@yabbal](https://github.com/yabbal)! - Split SDK into separate `tiime-sdk` package. CLI now depends on `tiime-sdk` workspace package.

  Breaking change: SDK is no longer exported from `tiime-cli`. Import from `tiime-sdk` instead.

### Patch Changes

- Updated dependencies [[`7bdbdad`](https://github.com/yabbal/tiime-cli/commit/7bdbdad4a90a45aa74b156f0f250f1bbef6f8d54)]:
  - tiime-sdk@2.0.0

## 1.2.2

### Patch Changes

- [`7c2c558`](https://github.com/yabbal/tiime-cli/commit/7c2c558ecce64ced19408fd395e0bb6d443beb40) Thanks [@yabbal](https://github.com/yabbal)! - fix(audit): remove `without_documents` Accept header that caused incorrect `count_documents` values

  feat(sdk): add document matching API support

  - `bankTransactions.matchDocuments()` — link documents to transactions via `PUT /document_matchings`
  - `bankTransactions.getMatchings()` — get existing matchings for a transaction
  - `documents.searchMatchable()` — search matchable documents for linking

  fix(docs): use dynamic version from tiime-cli package.json instead of hardcoded value

## 1.2.1

### Patch Changes

- [`e6f061a`](https://github.com/yabbal/tiime-cli/commit/e6f061ab9be360d95347198a0fdcbf9f5fef173c) Thanks [@yabbal](https://github.com/yabbal)! - fix(audit): use transaction-level document counts instead of imputation-level

  The audit was checking `count_documents` and `count_invoices` on imputations, where the API always returns 0. The correct counts are on the transaction root object, which properly reflects linked invoices and documents. This eliminates false positives in the missing documents report.

## 1.2.0

### Minor Changes

- Add `tiime audit` command for multi-company accounting audit with auto-imputation support

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
