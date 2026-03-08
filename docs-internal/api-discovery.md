# Tiime API Discovery

## Base URL
`https://chronos-api.tiime-apps.com/v1/`

## Authentication
- **Provider:** Auth0
- **Domain:** `auth0.tiime.fr`
- **Client ID:** `iEbsbe3o66gcTBfGRa012kj1Rb6vjAND`
- **Audience:** `https://chronos/`
- **Token format:** RS256 JWT
- **Token lifetime:** ~2 hours
- **Header:** `Authorization: Bearer {jwt}`

## Required Headers
```
tiime-app: tiime
tiime-app-version: 4.30.3
tiime-app-platform: web
```

## Pagination
- **Request:** `Range: items=0-25`
- **Response:** `Content-Range: items 0-25/*` (unknown total) or `items 0-25/100`
- **Status 206** = partial content (more pages available)
- **Status 200** = all items returned

## Content Negotiation (Accept headers)
Some endpoints use custom media types:
- `application/vnd.tiime.timeline.v2+json` (clients)
- `application/vnd.tiime.documents.v2+json` (documents/receipts)
- `application/vnd.tiime.documents.v3+json` (document_categories)
- `application/vnd.tiime.labels.v2+json` (labels)
- `application/vnd.tiime.bank_transactions.v2+json` (bank_transactions)
- `application/vnd.tiime.docs.query+json` (documents)
- `application/vnd.tiime.docs.imputation+json` (documents)
- `application/json, text/plain, */*` (default)

## Sorting
`sorts=field_name:asc` or `sorts=field_name:desc`

## Response Headers (custom)
- `x-total-amount`, `x-total-amount-encaissements`, `x-total-amount-decaissements`
- `x-solde-result`, `x-previous-solde-result`
- `x-amount-evolution-result`, `x-percent-evolution-result`
- `x-count-result`, `x-total-balance`, `x-total-billed`, `x-total-encasement`
- `tiime-opening-mode`, `tiime-file-family`, `tiime-preview-available`

---

## Endpoints

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/users/me` | Current user profile |
| GET | `/v1/users/me/legal_informations` | Legal information |
| PATCH | `/v1/users/me/companies/{companyId}/active` | Set active company |
| GET | `/v1/users/me/companies/{companyId}/settings` | User settings for company |

### Companies
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/companies/{companyId}` | Company details |
| GET | `/v1/companies/{companyId}/users` | Company users |
| GET | `/v1/companies/{companyId}/users?with_vehicles=true` | Users with vehicles |
| GET | `/v1/companies/{companyId}/users/{userId}/feature_access` | User feature flags |
| GET | `/v1/companies/{companyId}/business_units` | Business units |
| GET | `/v1/companies/{companyId}/business_unit/logo/preview` | BU logo |
| GET | `/v1/companies/{companyId}/app_config` | App configuration |
| GET | `/v1/companies/{companyId}/remediation` | Remediation status |
| GET | `/v1/companies/{companyId}/pdp_status` | PDP status |
| GET | `/v1/companies/{companyId}/quick_actions` | Quick actions |
| GET | `/v1/companies/{companyId}/logos/{logoId}/preview` | Logo preview |
| GET | `/v1/companies/{companyId}/accounting_period/current?range_year=1` | Current accounting period |

### Invoices (Factures de vente)
| Method | Path | Query params | Description |
|--------|------|-------------|-------------|
| GET | `/v1/companies/{companyId}/invoices` | `sorts=invoice_number:desc` | List invoices |

### Quotations (Devis)
| Method | Path | Query params | Description |
|--------|------|-------------|-------------|
| GET | `/v1/companies/{companyId}/quotations` | `expand=invoices` | List quotes |

### Clients
| Method | Path | Query params | Description |
|--------|------|-------------|-------------|
| GET | `/v1/companies/{companyId}/clients` | `archived=false` | List clients |

### Bank Accounts
| Method | Path | Query params | Description |
|--------|------|-------------|-------------|
| GET | `/v1/companies/{companyId}/bank_accounts` | `enabled=true` | List bank accounts |

### Bank Transactions
| Method | Path | Query params | Description |
|--------|------|-------------|-------------|
| GET | `/v1/companies/{companyId}/bank_transactions` | `hide_refused=false` | List transactions |
| GET | `/v1/companies/{companyId}/bank_transactions` | `bank_account={id}&amount_type=negative&operation_type=transfer&hide_refused=true` | Transfers |
| GET | `/v1/companies/{companyId}/bank_transactions/unimputed` | | Unmatched transactions |

### Documents
| Method | Path | Query params | Description |
|--------|------|-------------|-------------|
| GET | `/v1/companies/{companyId}/documents` | `sorts=created_at:desc&source=accountant&expand=file_family,preview_available` | List docs |
| GET | `/v1/companies/{companyId}/documents` | `types=receipt&accountable=true&with_total_amount=true&with_total_amount_excluding_taxes=true&sorts=metadata.date:desc` | Receipts |
| GET | `/v1/companies/{companyId}/documents/{documentId}/preview` | | Document preview |
| GET | `/v1/companies/{companyId}/document_categories` | | Document categories |
| GET | `/v1/companies/{companyId}/document_categories/documents` | `nb_documents_by_category=6` | Docs by category |

### Expense Reports (Notes de frais)
| Method | Path | Query params | Description |
|--------|------|-------------|-------------|
| GET | `/v1/companies/{companyId}/expense_reports` | `expand=total_amount&sorts=metadata.date:desc` | List expense reports |

### Travels (Trajets/IK)
| Method | Path | Query params | Description |
|--------|------|-------------|-------------|
| GET | `/v1/companies/{companyId}/travels` | `with_total_distance=true&has_existing_travels=true&linked_to_expense_report=false&sorts=date:desc` | List travels |

### Labels & Tags
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/companies/{companyId}/labels` | Custom labels |
| GET | `/v1/companies/{companyId}/standard_labels` | Standard labels |
| GET | `/v1/companies/{companyId}/tags?expand=tag_detail` | Tags |

### Dashboard
| Method | Path | Query params | Description |
|--------|------|-------------|-------------|
| GET | `/v1/companies/{companyId}/dashboard_blocks` | `sorts=rank:asc&display_group=monitoring` | Dashboard blocks |
| GET | `/v1/companies/{companyId}/dashboard_blocks/{blockId}` | | Block detail |
| GET | `/v1/companies/{companyId}/tiles` | `keys=vat_details,display_estimated_vat,...` | Dashboard tiles |

### Wallet (Compte Pro Tiime)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/wallet/companies/{companyId}/config` | Wallet config (various `f=` filters) |
| GET | `/v1/wallet/companies/{companyId}/users/{userId}/cards` | User cards |
| GET | `/v1/wallet/companies/{companyId}/users/{userId}/card/physical` | Physical card |
| GET | `/v1/wallet/companies/{companyId}/adviser` | Adviser info |

### Subscription Manager
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/companies/{companyId}/subscription_manager/contracts` | Contracts |
| GET | `/v1/companies/{companyId}/subscription_manager/subscriptions` | Subscriptions |
| GET | `/v1/companies/{companyId}/subscription_manager/subscriptions/{uuid}/discounts` | Discounts |
| GET | `/v1/companies/{companyId}/subscription_manager/features` | Features |
| GET | `/v1/companies/{companyId}/subscription_manager/commercial_offers` | Commercial offers |

### Misc
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/intercom_messenger/token` | Intercom token |

---

## Data Models

### User (`/v1/users/me`)
```json
{
  "id": 12345,
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "phone": "+33600000000",
  "civility": "monsieur",
  "status": "Président",
  "roles": ["ROLE_USER"],
  "active_company": 99999,
  "director": true,
  "has_wallet_access": true,
  "has_business_account": true,
  "address": { "street": "...", "postal_code": "75001", "city": "PARIS", "country": { "name": "France", "code": "FR" } }
}
```

### Company (`/v1/companies/{id}`)
```json
{
  "id": 99999,
  "name": "example consulting",
  "legal_form": "SASU",
  "siret": "00000000000000",
  "vat_number": "FR00000000000",
  "intracom_vat_number": "FR00000000000",
  "ape_code": { "code": "6202A", "label": "Conseil en systèmes et logiciels informatiques" },
  "street": "1 Rue Example",
  "postal_code": "75001",
  "city": "Paris",
  "country": "FR",
  "share_capital": 1000,
  "registration_date": "2022-01-01",
  "vat_system": { "code": "RNM", "label": "Réel mensuel" },
  "tax_regime": "ISRS",
  "receipt_email": "justif+example@tiime.fr",
  "has_invoices": true,
  "logo": { "id": 123456 }
}
```

### Client
```json
{
  "id": 100000,
  "name": "ACME CORP",
  "address": "1 Rue Example",
  "postal_code": "75001",
  "city": "Paris",
  "country": { "id": 75, "name": "France", "code": "FR" },
  "email": null,
  "phone": null,
  "siren_or_siret": "000000000",
  "intracom_vat_number": null,
  "archived": false,
  "professional": true,
  "color": "#FFC681",
  "acronym": "AC"
}
```

### Bank Account
```json
{
  "id": 10000,
  "name": "Compte Pro Tiime",
  "bank": { "id": 112, "name": "Compte Pro Tiime", "sigle": "TII" },
  "iban": "FR76XXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "bic": "TRZOFR21XXX",
  "enabled": true,
  "balance_amount": 1000.00,
  "balance_currency": "EUR",
  "balance_date": "2026-01-01 00:00:00",
  "is_wallet": true,
  "closed": false
}
```

---

## Notes
- Auth via Auth0 SPA flow (PKCE) — the web app uses `auth0.tiime.fr` with client `iEbsbe3o66gcTBfGRa012kj1Rb6vjAND`
- The API is Angular-based SPA — all navigation is client-side after initial load
- Sentry traces included in requests for monitoring
