---
name: tiime
description: CLI pour interagir avec l'application de comptabilite Tiime (facturation, banque, clients, documents, audit comptable)
---

# Tiime CLI Skill

CLI pour interagir avec l'application de comptabilite Tiime (apps.tiime.fr).
Toutes les commandes retournent du JSON sur stdout (defaut), avec support table et CSV via `--format`.

Use when the user asks about Tiime, accounting data, invoices (factures), clients, bank accounts, bank transactions, documents, labels, expense reports, quotations, or any task related to their Tiime accounting software. Triggers on: "tiime", "factures", "facture", "invoices", "comptabilite", "banque", "transactions bancaires", "clients tiime", "documents comptables", "notes de frais", "devis", "solde", "balance".

## Pre-requis

- Installer : `npm install -g tiime-cli` ou `brew tap yabbal/tap && brew install tiime`
- S'authentifier : `tiime auth login`
- Configurer l'entreprise : `tiime company list` puis `tiime company use --id <ID>`

## Commandes disponibles

### Authentification
```bash
tiime auth login                                   # Connexion interactive
tiime auth login --email EMAIL --password PASSWORD  # Connexion non-interactive (CI/script)
tiime auth logout                                   # Deconnexion
tiime auth status                                   # Statut de connexion
```

### Entreprise
```bash
tiime company list            # Lister toutes les entreprises
tiime company get             # Info de l'entreprise active
tiime company me              # Info utilisateur (inclut active_company)
tiime company use --id ID     # Definir l'entreprise active
```

### Statut rapide
```bash
tiime status                  # Resume : soldes, factures, devis, clients, transactions
```

### Factures
```bash
tiime invoices list                          # Lister les factures (25/page)
tiime invoices list --all                    # Toutes les factures
tiime invoices list --status draft           # Filtrer par statut
tiime invoices list --format table           # Affichage tableau
tiime invoices get --id ID                   # Detail d'une facture

# Creer une facture (brouillon)
tiime invoices create \
  --client-id CLIENT_ID \
  --description "Prestation" \
  --quantity 20 --unit-price 540 --unit day \
  --vat normal

# Multi-lignes
tiime invoices create --client-id ID --lines '[
  {"description":"Dev","quantity":20,"unit_price":540,"unit":"day"},
  {"description":"Support","quantity":5,"unit_price":540,"unit":"hour"}
]'

tiime invoices create --description "Test" --unit-price 100 --dry-run  # Preview
tiime invoices update --id ID --title "Nouveau titre" --status saved
tiime invoices duplicate --id ID --date 2026-04-01 --quantity 22
tiime invoices send --id ID --email client@example.com
tiime invoices pdf --id ID --output facture.pdf
tiime invoices delete --id ID
```

### Clients
```bash
tiime clients list                           # Lister les clients actifs
tiime clients list --archived                # Inclure les archives
tiime clients get --id ID                    # Detail d'un client
tiime clients search --query "nom"           # Rechercher
tiime clients create --name "ACME" --email contact@acme.com
```

### Banque
```bash
tiime bank accounts                          # Comptes bancaires
tiime bank balance                           # Soldes
tiime bank transactions                      # Transactions recentes
tiime bank transactions --from 2026-01-01 --to 2026-03-31
tiime bank transactions --search "loyer" --all
tiime bank unimputed                         # Non imputees
```

### Devis
```bash
tiime quotations list
tiime quotations get --id ID
tiime quotations create --client-id ID --description "Mission" --unit-price 600 --quantity 10
tiime quotations pdf --id ID
tiime quotations send --id ID --email client@example.com
```

### Notes de frais
```bash
tiime expenses list
tiime expenses get --id ID
tiime expenses create --name "Deplacement client"
```

### Documents
```bash
tiime documents list
tiime documents list --type receipt
tiime documents categories
tiime documents upload --file receipt.pdf
tiime documents download --id ID --output doc.pdf
```

### Labels & Tags
```bash
tiime labels list                            # Labels personnalises
tiime labels standard                        # Labels standards
tiime labels tags                            # Tags
```

### Audit comptable
```bash
tiime audit                                      # Audit entreprise active
tiime audit --all-companies                      # Audit toutes les entreprises
tiime audit --company "Abbal Consulting,Allial Group"  # Entreprises specifiques
tiime audit --apply                              # Appliquer les auto-imputations
tiime audit --all-companies --format json        # JSON pour agent IA
```

### Outils
```bash
tiime open                                   # Ouvrir Tiime dans le navigateur
tiime open invoices                          # Section factures
tiime version                                # Version
```

## Formats de sortie

```bash
tiime invoices list --format json    # JSON (defaut)
tiime invoices list --format table   # Tableau
tiime invoices list --format csv     # CSV
```

## Langue

L'aide s'adapte a la langue systeme (fr/en). Forcer : `TIIME_LANG=en tiime --help`

## Exemples jq

```bash
tiime invoices list --all | jq '.[] | {id, compiled_number, status, total_excluding_taxes}'
tiime bank balance | jq '.[0].balance_amount'
tiime bank transactions --all | jq '[.[] | select(.amount < 0)] | sort_by(.amount) | .[:5]'
tiime clients list | jq '.[].name'
```

## Workflows typiques

### Facture mensuelle
```bash
tiime clients search --query "CLIENT"
tiime invoices create --client-id ID --description "Prestation" --quantity 20 --unit-price 540 --unit day --dry-run
tiime invoices create --client-id ID --description "Prestation" --quantity 20 --unit-price 540 --unit day
tiime invoices send --id ID --email client@example.com
```

### Resume financier
```bash
tiime status
tiime bank balance
tiime invoices list --status sent --all | jq 'length'
```

### Audit comptable complet
Workflow pour diagnostiquer et corriger la comptabilite sur toutes les entreprises :

1. **Lancer l'audit** :
   ```bash
   tiime audit --all-companies --format json
   ```
2. **Analyser le rapport JSON** : le rapport contient par entreprise :
   - `unimputed_transactions` : transactions non imputees (avec suggestions si dispo)
   - `missing_documents` : transactions imputees sans document justificatif
   - `summary` : compteurs et montants totaux
3. **Auto-imputer les transactions avec suggestions** :
   ```bash
   tiime audit --all-companies --apply --format json
   ```
   Les imputations appliquees sont dans `applied_imputations` de chaque entreprise.
4. **Documents manquants** : lister par fournisseur/merchant, prioriser par montant (plus gros d'abord).
   Pour chaque document manquant, indiquer ou recuperer la facture (fournisseur, date, montant).
5. **Priorisation** : traiter les plus gros montants en premier.

Le skill peut etre invoque quand l'utilisateur dit "fais un audit", "qu'est-ce que je dois faire sur ma compta", "audit comptable", etc.
