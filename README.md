# Tiime CLI

> **Projet personnel et expérimental** — Ce projet n'est pas affilié à, ni approuvé par [Tiime](https://www.tiime.fr). Il s'agit d'un outil non officiel développé à titre personnel pour un usage expérimental.

CLI et SDK TypeScript pour la comptabilité [Tiime](https://www.tiime.fr) — pilotez votre compta depuis le terminal.

[![CI](https://github.com/yabbal/tiime-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/yabbal/tiime-cli/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/tiime-cli)](https://www.npmjs.com/package/tiime-cli)
[![Documentation](https://img.shields.io/badge/docs-tiime--cli-blue)](https://yabbal.github.io/tiime-cli/)

## Fonctionnalités

- **Factures** — lister, créer, dupliquer, modifier, envoyer, télécharger le PDF, supprimer
- **Devis** — lister, créer, envoyer, télécharger le PDF
- **Clients** — consulter, créer, rechercher
- **Banque** — soldes, comptes, transactions, imputation et auto-imputation
- **Notes de frais** — lister, créer, consulter
- **Documents** — upload, téléchargement, catégories
- **Labels & Tags** — labels personnalisés, standards (plan comptable), tags
- **Audit comptable** — audit multi-entreprises avec auto-correction
- **Multi-format** — sortie JSON (défaut), table ou CSV via `--format`
- **Bilingue** — aide en français ou anglais (détection automatique)
- **SDK TypeScript** — utilisable comme librairie dans vos projets Node.js
- **Skill IA** — compatible Claude Code et agents IA via [skills.sh](https://skills.sh)
- **Retry automatique** — backoff exponentiel sur erreurs 429/5xx

## Installation

```bash
npm install -g tiime-cli
```

Ou via Homebrew :

```bash
brew tap yabbal/tap
brew install tiime
```

## Démarrage rapide

```bash
tiime auth login          # Se connecter
tiime company list        # Lister vos entreprises
tiime company use --id ID # Sélectionner une entreprise
tiime status              # Résumé : soldes, factures, transactions
```

## Exemples

```bash
# Factures
tiime invoices list --status paid --all
tiime invoices create --client-id 100 --description "Prestation" --unit-price 800 --quantity 5 --unit day
tiime invoices send --id 42 --email client@example.com

# Banque
tiime bank balance
tiime bank transactions --from 2026-01-01 --to 2026-01-31 --search "loyer" --all
tiime bank unimputed

# Clients
tiime clients list --format table
tiime clients create --name "ACME" --email contact@acme.com

# Combiner avec jq
tiime invoices list --status paid --all | jq '[.[].total_including_taxes] | add'
tiime bank transactions --all | jq '[.[] | select(.amount > 1000)]'
```

## SDK TypeScript

```typescript
import { TiimeClient } from "tiime-cli";

const client = new TiimeClient({ companyId: 12345 });

const invoices = await client.invoices.list({ status: "paid" });
const balances = await client.bankAccounts.balance();
const me = await client.users.me();
```

## Skill pour agents IA

Tiime CLI est conçu pour fonctionner avec des agents IA. Toutes les commandes retournent du JSON structuré, directement exploitable par un LLM.

```bash
npx skills add yabbal/tiime
```

## Documentation

Documentation complète : **[yabbal.github.io/tiime-cli](https://yabbal.github.io/tiime-cli/)**

- [Premiers pas](https://yabbal.github.io/tiime-cli/docs)
- [Installation](https://yabbal.github.io/tiime-cli/docs/installation)
- [Référence CLI](https://yabbal.github.io/tiime-cli/docs/cli)
- [Référence SDK](https://yabbal.github.io/tiime-cli/docs/sdk)
- [Agents IA & Skill](https://yabbal.github.io/tiime-cli/docs/agents)

## Structure du monorepo

```
tiime/
├── packages/tiime-cli/   # CLI & SDK (publié sur npm)
├── apps/docs/            # Documentation Fumadocs (GitHub Pages)
├── turbo.json            # Turborepo
└── SKILL.md              # Skill pour agents IA (skills.sh)
```

## Développement

```bash
pnpm install              # Installer les dépendances
pnpm build                # Build CLI + docs
pnpm test                 # Tests unitaires
pnpm dev                  # Dev mode (CLI + docs)
```

## Stack technique

| Outil | Rôle |
|-------|------|
| [TypeScript](https://www.typescriptlang.org/) | Langage |
| [citty](https://github.com/unjs/citty) | Framework CLI |
| [ofetch](https://github.com/unjs/ofetch) | Client HTTP |
| [tsup](https://github.com/egoist/tsup) | Build |
| [Turborepo](https://turbo.build/) | Monorepo |
| [Fumadocs](https://fumadocs.dev/) | Documentation |
| [Biome](https://biomejs.dev/) | Linter & formatter |
| [Vitest](https://vitest.dev/) | Tests |

## Licence

MIT
