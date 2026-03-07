---
"tiime-cli": minor
---

Initial public release of tiime-cli

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
