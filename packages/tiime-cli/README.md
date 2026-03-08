# Tiime CLI

CLI et SDK TypeScript pour la comptabilite [Tiime](https://www.tiime.fr) — pilotez votre compta depuis le terminal.

Sortie JSON par defaut, ideal pour les agents IA et l'automatisation.

## Fonctionnalites

- **Factures** — lister, creer, dupliquer, modifier, envoyer, telecharger le PDF, supprimer
- **Devis** — lister, creer, envoyer, telecharger le PDF
- **Clients** — consulter, creer, rechercher
- **Banque** — soldes, comptes, transactions (filtres date/recherche), operations non imputees
- **Notes de frais** — lister, creer, consulter
- **Documents** — parcourir, uploader, telecharger, categories
- **Labels & Tags** — labels personnalises, labels standards, tags
- **Multi-format** — sortie JSON (defaut), table ou CSV via `--format`
- **Bilingue** — aide en francais ou anglais (detection automatique de la langue systeme)
- **SDK programmatique** — utilisable comme librairie TypeScript
- **Retry automatique** — retry avec backoff sur erreurs 429/5xx

## Installation

### Via npm

```bash
npm install -g tiime-cli
```

### Via Homebrew

```bash
brew tap yabbal/tap
brew install tiime
```

### Depuis les sources

```bash
git clone https://github.com/yabbal/tiime-cli.git
cd tiime-cli
pnpm install
pnpm build
pnpm link --global
```

Verifiez que l'installation fonctionne :

```bash
tiime --help
```

### Autocompletion shell

```bash
# zsh (ajoutez a ~/.zshrc)
eval "$(tiime completion --shell zsh)"

# bash (ajoutez a ~/.bashrc)
eval "$(tiime completion --shell bash)"

# fish
tiime completion --shell fish | source
```

## Configuration

### 1. Authentification

Mode interactif :

```bash
tiime auth login
```

Mode script / CI :

```bash
tiime auth login --email vous@example.com --password votre-mot-de-passe
```

Verifier le statut :

```bash
tiime auth status
```

### 2. Selection de l'entreprise

Listez vos entreprises puis selectionnez-en une :

```bash
tiime company list
tiime company use --id 12345
```

Verifiez l'entreprise active :

```bash
tiime company get
```

### 3. Langue

L'aide s'affiche automatiquement dans la langue de votre systeme (francais ou anglais).

Pour forcer une langue :

```bash
# Forcer le francais
TIIME_LANG=fr tiime --help

# Forcer l'anglais
TIIME_LANG=en tiime --help

# Ou exporter la variable
export TIIME_LANG=en
tiime invoices --help
```

## Utilisation

### Resume rapide

```bash
tiime status                   # Resume avec soldes, factures, devis, transactions
```

### Authentification

```bash
tiime auth login               # Connexion interactive
tiime auth logout              # Deconnexion
tiime auth status              # Statut du token
```

### Entreprise

```bash
tiime company list             # Lister les entreprises
tiime company get              # Details de l'entreprise active
tiime company use --id ID      # Definir l'entreprise active
tiime company me               # Info utilisateur courant
```

### Factures

```bash
# Lister
tiime invoices list
tiime invoices list --status paid
tiime invoices list --sort invoice_number:asc
tiime invoices list --all                        # Toutes les pages
tiime invoices list --format table               # Affichage tableau

# Details
tiime invoices get --id 42

# Creer une facture simple
tiime invoices create \
  --client-id 100 \
  --description "Prestation de conseil" \
  --unit-price 800 \
  --quantity 5 \
  --unit day \
  --vat normal

# Creer une facture multi-lignes
tiime invoices create \
  --client-id 100 \
  --lines '[{"description":"Dev","quantity":20,"unit_price":540,"unit":"day"},{"description":"Design","quantity":5,"unit_price":450,"unit":"day"}]'

# Previsualiser sans creer
tiime invoices create --client-id 100 --description "Test" --unit-price 500 --dry-run

# Modifier
tiime invoices update --id 42 --title "Nouveau titre"

# Dupliquer
tiime invoices duplicate --id 42
tiime invoices duplicate --id 42 --date 2026-03-01 --quantity 18

# Envoyer par email
tiime invoices send --id 42 --email client@example.com

# Telecharger le PDF
tiime invoices pdf --id 42
tiime invoices pdf --id 42 --output ma-facture.pdf

# Supprimer un brouillon
tiime invoices delete --id 42
```

### Devis

```bash
tiime quotations list              # Lister les devis
tiime quotations get --id 10       # Details d'un devis
tiime quotations create \          # Creer un devis
  --client-id 100 \
  --description "Mission conseil" \
  --unit-price 600 \
  --quantity 10
tiime quotations pdf --id 10       # Telecharger le PDF
tiime quotations send --id 10 --email client@example.com  # Envoyer
```

### Clients

```bash
tiime clients list                 # Lister les clients actifs
tiime clients list --archived      # Inclure les archives
tiime clients get --id 100         # Details d'un client
tiime clients create --name "ACME" --email contact@acme.com
tiime clients search --query "acme"
```

### Banque

```bash
tiime bank accounts                # Lister les comptes bancaires
tiime bank balance                 # Soldes de tous les comptes
tiime bank transactions            # Dernieres transactions
tiime bank transactions --from 2026-01-01 --to 2026-01-31
tiime bank transactions --search "loyer" --all
tiime bank unimputed               # Transactions non imputees
```

### Notes de frais

```bash
tiime expenses list                # Lister les notes de frais
tiime expenses get --id 5          # Details d'une note
tiime expenses create --name "Deplacement client"  # Creer
```

### Documents

```bash
tiime documents list               # Lister les documents
tiime documents list --type receipt # Filtrer par type
tiime documents categories         # Categories disponibles
tiime documents upload --file facture.pdf
tiime documents download --id 123 --output doc.pdf
```

### Labels & Tags

```bash
tiime labels list                  # Labels personnalises
tiime labels standard              # Labels standards (plan comptable)
tiime labels tags                  # Tags
```

### Outils

```bash
tiime open                         # Ouvrir Tiime dans le navigateur
tiime open invoices                # Ouvrir la section factures
tiime version                      # Afficher la version
```

### Formats de sortie

Toutes les commandes de listing supportent `--format` :

```bash
tiime invoices list --format json    # JSON (defaut)
tiime invoices list --format table   # Tableau ASCII
tiime invoices list --format csv     # CSV
tiime bank balance --format table
tiime clients list --format csv > clients.csv
```

### Pipe avec jq

La sortie JSON se combine naturellement avec `jq` :

```bash
# Noms des clients
tiime clients list | jq '.[].name'

# Total des factures payees
tiime invoices list --status paid --all | jq '[.[].total_including_taxes] | add'

# Transactions > 1000 EUR
tiime bank transactions --all | jq '[.[] | select(.amount > 1000)]'

# Solde du premier compte
tiime bank balance | jq '.[0].balance_amount'
```

## Workflows

### Creer et dupliquer une facture mensuelle

```bash
# Premier mois : creer la facture de reference
tiime invoices create \
  --client-id 100 \
  --description "Prestation mensuelle - Janvier 2026" \
  --unit-price 540 \
  --quantity 20 \
  --unit day

# Mois suivants : dupliquer en ajustant la date et la quantite
tiime invoices duplicate --id 42 --date 2026-02-01 --quantity 18
```

### Voir un resume financier

```bash
# Resume complet (soldes, factures, devis, clients)
tiime status

# Ou manuellement avec jq
tiime bank balance | jq '.[] | {name, balance_amount}'
tiime invoices list --status sent --all | jq 'length'
tiime bank unimputed | jq 'length'
```

### Explorer les transactions du mois

```bash
# Transactions de janvier
tiime bank transactions --from 2026-01-01 --to 2026-01-31 --all \
  | jq 'group_by(.amount > 0) | {depenses: .[0] | length, revenus: .[1] | length}'

# Chercher une transaction specifique
tiime bank transactions --search "adobe" --all
```

### Exporter des donnees en CSV

```bash
# Via --format csv
tiime invoices list --all --format csv > factures.csv

# Ou avec jq pour un CSV personnalise
tiime clients list \
  | jq -r '["id","nom","ville"], (.[] | [.id, .name, .city]) | @csv' \
  > clients.csv
```

## SDK

Tiime CLI exporte un SDK TypeScript utilisable comme librairie :

```typescript
import { TiimeClient } from "tiime-cli";

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

## Variables d'environnement

| Variable | Description | Defaut |
|----------|-------------|--------|
| `TIIME_LANG` | Langue de l'aide (`fr` ou `en`) | Detection automatique |

## Claude Code Skill

Ce CLI est concu pour etre utilise comme skill Claude Code. L'agent peut piloter votre comptabilite Tiime directement depuis une conversation :

- Sortie JSON structuree, facilement parseable par l'IA
- Toutes les commandes sont non-interactives (sauf `auth login` sans arguments)
- Combinable avec `jq` pour des analyses complexes

Pour l'activer, ajoutez le skill dans votre configuration Claude Code (`.claude/skills/`).

## Stack technique

| Outil | Role |
|-------|------|
| [TypeScript](https://www.typescriptlang.org/) | Langage |
| [citty](https://github.com/unjs/citty) | Framework CLI |
| [ofetch](https://github.com/unjs/ofetch) | Client HTTP |
| [@clack/prompts](https://github.com/bombshell-dev/clack) | Prompts interactifs |
| [cli-table3](https://github.com/cli-table/cli-table3) | Rendu tableau |
| [tsup](https://github.com/egoist/tsup) | Build |
| [Biome](https://biomejs.dev/) | Linter & formatter |
| [Vitest](https://vitest.dev/) | Tests |

## Licence

MIT — Youness Abbal
