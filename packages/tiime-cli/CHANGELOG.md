# Changelog

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
