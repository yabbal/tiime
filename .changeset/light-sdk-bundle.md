---
"tiime-sdk": major
"tiime-cli": patch
---

refactor(sdk): extract Node.js I/O for lighter bundle (-21.5%)

**BREAKING CHANGES (tiime-sdk):**
- `TokenManager` constructor now accepts `tokenStorage` and `credentialStorage` options instead of auto-loading from disk
- `resolveCompanyId` is removed — `companyId` is now required in `TiimeClientOptions`
- `DEFAULT_INVOICE_TEMPLATE` removed from `invoices.create()` — callers must pass full params

**New exports:**
- `TokenStorage` and `CredentialStorage` interfaces for pluggable persistence

SDK bundle: 14.48 KB → 11.37 KB, zero Node.js built-in dependencies.
