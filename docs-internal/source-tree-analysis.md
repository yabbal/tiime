# Analyse de l'arbre source — Tiime CLI

> Généré le 2026-03-07 | Scan level: deep

## Structure du projet

```
tiime/
├── src/                          # Code source principal
│   ├── index.ts                  # Point d'entrée SDK (exports publics)
│   ├── sdk/                      # Couche SDK — Client HTTP et ressources API
│   │   ├── auth.ts               # TokenManager (Auth0 password grant, keychain)
│   │   ├── client.ts             # TiimeClient (ofetch, intercepteurs, agrégation ressources)
│   │   ├── errors.ts             # TiimeError (status, endpoint, details)
│   │   ├── types.ts              # 40+ interfaces TypeScript (Company, Invoice, Client, etc.)
│   │   └── resources/            # 10 ressources API typées
│   │       ├── bank-accounts.ts  # list, get, balance
│   │       ├── bank-transactions.ts # list, listAll, unimputed (pagination Range)
│   │       ├── clients.ts        # list, get, create, search
│   │       ├── company.ts        # get, users, appConfig, accountingPeriod, tiles
│   │       ├── documents.ts      # list, categories, preview, upload, download
│   │       ├── expense-reports.ts # list, get, create
│   │       ├── invoices.ts       # list, listAll, get, create, update, send, duplicate, pdf, delete
│   │       ├── labels.ts         # list, standard, tags
│   │       ├── quotations.ts     # list, get, create, pdf, send
│   │       └── users.ts          # me, legalInformations, settings
│   └── cli/                      # Couche CLI — Interface ligne de commande
│       ├── index.ts              # Bootstrap citty, 13 sous-commandes
│       ├── config.ts             # Gestion config (~/.config/tiime/config.json)
│       ├── i18n.ts               # Traductions FR/EN (147 entrées, détection locale)
│       ├── output.ts             # Formatage sortie (JSON, table, CSV)
│       └── commands/             # 13 commandes CLI
│           ├── auth.ts           # login (interactif/scriptable), logout, status
│           ├── bank.ts           # balance, accounts, transactions, unimputed
│           ├── clients.ts        # list, get, create, search
│           ├── company.ts        # list, get, use, me
│           ├── completion.ts     # Complétion shell (zsh, bash, fish)
│           ├── documents.ts      # list, upload, download, categories
│           ├── expenses.ts       # list, get, create
│           ├── invoices.ts       # list, get, create, duplicate, update, send, pdf, delete
│           ├── labels.ts         # list, standard, tags
│           ├── open.ts           # Ouvre Tiime dans le navigateur
│           ├── quotations.ts     # list, get, create, pdf, send
│           ├── status.ts         # Résumé rapide (6 requêtes parallèles)
│           └── version.ts        # Affiche version CLI + Node
├── tests/                        # Tests unitaires (Vitest)
│   ├── cli/
│   │   └── output.test.ts        # Tests formatage JSON/table/CSV
│   └── sdk/
│       ├── auth.test.ts          # Tests TokenManager, JWT, expiration
│       ├── bank.test.ts          # Tests comptes et transactions
│       ├── clients.test.ts       # Tests ressource clients
│       ├── documents.test.ts     # Tests ressource documents
│       └── invoices.test.ts      # Tests factures (create, duplicate, template merge)
├── docs/                         # Documentation
│   ├── api-discovery.md          # Documentation complète 40+ endpoints API Tiime
│   └── homebrew-setup.md         # Guide setup Homebrew tap
├── api-responses/                # Échantillons de réponses API (14 fichiers JSON)
├── homebrew/
│   └── tiime.rb                  # Formule Homebrew
├── skill/
│   └── tiime.md                  # Définition Skill Claude Code
├── .github/workflows/
│   ├── ci.yml                    # CI: lint, build, test (Node 22/24)
│   └── homebrew.yml              # Release: mise à jour formule Homebrew
├── .changeset/
│   └── config.json               # Configuration changesets
├── package.json                  # Manifest npm (tiime-cli v1.1.1)
├── tsconfig.json                 # TypeScript (ES2022, strict)
├── tsup.config.ts                # Build: 2 bundles (SDK + CLI)
├── vitest.config.ts              # Config tests
├── biome.json                    # Linter/Formatter (Biome v2.4.6)
├── README.md                     # Documentation principale (français)
├── CHANGELOG.md                  # Historique des versions
└── LICENSE                       # MIT
```

## Répertoires critiques

| Répertoire | Rôle | Fichiers clés |
|------------|------|---------------|
| `src/sdk/` | Cœur métier — client HTTP, auth, ressources typées | `client.ts`, `auth.ts`, `types.ts` |
| `src/sdk/resources/` | 10 wrappers d'API REST Tiime | `invoices.ts` (le plus complet) |
| `src/cli/` | Interface utilisateur CLI | `index.ts` (bootstrap), `output.ts` |
| `src/cli/commands/` | 13 commandes utilisateur | `invoices.ts` (~400 lignes) |
| `tests/` | Couverture tests SDK + CLI | 6 fichiers de test |
| `.github/workflows/` | Automatisation CI/CD | `ci.yml`, `homebrew.yml` |

## Points d'entrée

| Type | Fichier | Rôle |
|------|---------|------|
| SDK | `src/index.ts` | Exports: TiimeClient, TokenManager, TiimeError, types |
| CLI | `src/cli/index.ts` | Bootstrap citty, enregistrement 13 commandes |
| Build SDK | `dist/index.js` | Bundle ESM avec déclarations TypeScript |
| Build CLI | `dist/cli.js` | Exécutable avec shebang `#!/usr/bin/env node` |
| Bin | `tiime` (package.json) | Pointe vers `dist/cli.js` |
