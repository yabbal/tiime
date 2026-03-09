# Tiime SDK

SDK TypeScript pour l'API de comptabilite [Tiime](https://www.tiime.fr) — integrez Tiime dans vos applications Node.js.

## Installation

```bash
npm install tiime-sdk
```

## Pre-requis

Authentifiez-vous via le CLI [`tiime-cli`](https://www.npmjs.com/package/tiime-cli) :

```bash
npm install -g tiime-cli
tiime auth login
tiime company use --id 12345
```

## Utilisation

```typescript
import { TiimeClient } from "tiime-sdk";

const client = new TiimeClient({ companyId: 12345 });

// Factures
const invoices = await client.invoices.list({ status: "paid" });
const invoice = await client.invoices.get(42);
const created = await client.invoices.create({
  emission_date: "2026-03-01",
  client: { id: 100 },
  lines: [
    {
      description: "Prestation de conseil",
      quantity: 5,
      unit_amount: 800,
      vat_type: { code: "normal" },
      invoicing_unit: { id: 3, code: "day" },
    },
  ],
  status: "draft",
});

// Envoyer une facture
await client.invoices.send(42, {
  recipients: [{ email: "client@example.com" }],
});

// Telecharger un PDF
const pdf = await client.invoices.downloadPdf(42);

// Banque
const balances = await client.bankAccounts.balance();
const transactions = await client.bankTransactions.listAll({
  from: "2026-01-01",
  to: "2026-01-31",
  search: "loyer",
});

// Clients
const clients = await client.clients.list({ archived: false });

// Devis
const quotations = await client.quotations.list();

// Utilisateur
const me = await client.users.me();
```

## Ressources disponibles

| Ressource | Acces | Description |
|-----------|-------|-------------|
| Factures | `client.invoices` | CRUD + envoi + PDF + duplication |
| Devis | `client.quotations` | CRUD + envoi + PDF |
| Clients | `client.clients` | CRUD + recherche |
| Comptes bancaires | `client.bankAccounts` | Liste + details + soldes |
| Transactions | `client.bankTransactions` | Liste + pagination auto + imputation |
| Notes de frais | `client.expenseReports` | CRUD |
| Documents | `client.documents` | Liste + categories + upload + download |
| Labels | `client.labels` | Personnalises + standards + tags |
| Utilisateurs | `client.users` | Profil + infos legales + settings |
| Entreprise | `client.company` | Details + config + dashboard |

## Gestion des erreurs

```typescript
import { TiimeClient, TiimeError } from "tiime-sdk";

try {
  const invoice = await client.invoices.get(99999);
} catch (error) {
  if (error instanceof TiimeError) {
    console.error(`Erreur ${error.status}: ${error.message}`);
  }
}
```

## Documentation

Voir la [documentation complete](https://yabbal.github.io/tiime-cli/docs/sdk).

## Licence

MIT — yabbal
