---
"tiime-cli": patch
---

fix(audit): remove `without_documents` Accept header that caused incorrect `count_documents` values

feat(sdk): add document matching API support
- `bankTransactions.matchDocuments()` — link documents to transactions via `PUT /document_matchings`
- `bankTransactions.getMatchings()` — get existing matchings for a transaction
- `documents.searchMatchable()` — search matchable documents for linking

fix(docs): use dynamic version from tiime-cli package.json instead of hardcoded value
