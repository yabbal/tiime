---
"tiime-cli": patch
---

fix(audit): use transaction-level document counts instead of imputation-level

The audit was checking `count_documents` and `count_invoices` on imputations, where the API always returns 0. The correct counts are on the transaction root object, which properly reflects linked invoices and documents. This eliminates false positives in the missing documents report.
