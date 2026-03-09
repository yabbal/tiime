# tiime-sdk

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
