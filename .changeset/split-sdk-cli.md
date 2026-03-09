---
"tiime-sdk": major
"tiime-cli": major
---

Split SDK into separate `tiime-sdk` package. CLI now depends on `tiime-sdk` workspace package.

Breaking change: SDK is no longer exported from `tiime-cli`. Import from `tiime-sdk` instead.
