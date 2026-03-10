# tiime-sdk

## 3.0.1

### Patch Changes

- [#30](https://github.com/yabbal/tiime/pull/30) [`a2d6b1a`](https://github.com/yabbal/tiime/commit/a2d6b1aafee3862e9c2aa65257e06c17b61c5847) Thanks [@yabbal](https://github.com/yabbal)! - Add dashboard command with local web server, fix API paths (remove leading slashes for ofetch compatibility), and respect XDG_CONFIG_HOME for config directory.

## 3.0.0

### Major Changes

- [#16](https://github.com/yabbal/tiime/pull/16) [`42d392d`](https://github.com/yabbal/tiime/commit/42d392d451addedff8c1602a6ba6e2253f5452d3) Thanks [@yabbal](https://github.com/yabbal)! - refactor(sdk): extract Node.js I/O for lighter bundle (-21.5%)

  **BREAKING CHANGES (tiime-sdk):**

  - `TokenManager` constructor now accepts `tokenStorage` and `credentialStorage` options instead of auto-loading from disk
  - `resolveCompanyId` is removed — `companyId` is now required in `TiimeClientOptions`
  - `DEFAULT_INVOICE_TEMPLATE` removed from `invoices.create()` — callers must pass full params

  **New exports:**

  - `TokenStorage` and `CredentialStorage` interfaces for pluggable persistence

  SDK bundle: 14.48 KB → 11.37 KB, zero Node.js built-in dependencies.

## 2.2.0

### Minor Changes

- [#14](https://github.com/yabbal/tiime/pull/14) [`5bb5333`](https://github.com/yabbal/tiime/commit/5bb5333a5845e75d6e395097a176c828779c8741) Thanks [@yabbal](https://github.com/yabbal)! - Replace ofetch with native fetch — zero production dependencies, smaller bundle (14.5 KB vs 22 KB), minification enabled

## 2.1.2

### Patch Changes

- [#12](https://github.com/yabbal/tiime/pull/12) [`eed519c`](https://github.com/yabbal/tiime/commit/eed519c8c0f6198c1f2870e9ab3d1a0144e50d98) Thanks [@yabbal](https://github.com/yabbal)! - Fix CLI version display, prevent parameter mutation in create(), improve type safety, and fix French accents in docs

## 2.1.1

### Patch Changes

- [`50f4359`](https://github.com/yabbal/tiime/commit/50f435907037f66abcdd6bc4a7e1676ff6af82bd) Thanks [@yabbal](https://github.com/yabbal)! - Update repository URLs after repo rename from tiime-cli to tiime

## 2.1.0

### Minor Changes

- [`e2e48b2`](https://github.com/yabbal/tiime-cli/commit/e2e48b24a6f90261a972efcbd2166c7793f35740) Thanks [@yabbal](https://github.com/yabbal)! - Make SDK fully standalone: support env vars (TIIME_EMAIL, TIIME_PASSWORD, TIIME_ACCESS_TOKEN, TIIME_COMPANY_ID) and direct options for auth/companyId without requiring the CLI.

## 2.0.0

### Major Changes

- [`7bdbdad`](https://github.com/yabbal/tiime-cli/commit/7bdbdad4a90a45aa74b156f0f250f1bbef6f8d54) Thanks [@yabbal](https://github.com/yabbal)! - Split SDK into separate `tiime-sdk` package. CLI now depends on `tiime-sdk` workspace package.

  Breaking change: SDK is no longer exported from `tiime-cli`. Import from `tiime-sdk` instead.
