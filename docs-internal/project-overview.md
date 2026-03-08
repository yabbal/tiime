# Vue d'ensemble du projet — Tiime CLI & SDK

> Généré le 2026-03-07 | Scan level: deep

## Description

**Tiime CLI** (`tiime-cli`) est un outil en ligne de commande TypeScript pour interagir avec la plateforme de comptabilité Tiime. Il permet de gérer factures, devis, clients, comptes bancaires, notes de frais et documents comptables directement depuis le terminal.

Le projet expose également un **SDK TypeScript** réutilisable, permettant d'intégrer l'API Tiime dans d'autres applications Node.js.

## Informations clés

| Aspect | Détail |
|--------|--------|
| **Nom package** | `tiime-cli` |
| **Version** | 1.1.1 |
| **Licence** | MIT |
| **Type de projet** | CLI + Library (monolith) |
| **Langage** | TypeScript (ES2022, strict) |
| **Runtime** | Node.js >=20 |
| **Package manager** | pnpm 10.30.2 |
| **CLI Framework** | citty 0.2.1 |
| **HTTP Client** | ofetch 1.5.1 |
| **Build** | tsup 8.5.1 (2 bundles ESM) |
| **Tests** | Vitest 4.0.18 |
| **Linter** | Biome 2.4.6 |
| **Distribution** | npm + Homebrew |

## Fonctionnalités

### CLI (13 commandes)

- **auth** — Authentification (login interactif/scriptable, logout, status)
- **company** — Sélection et info entreprise
- **invoices** — Gestion complète des factures (CRUD, envoi email, PDF, duplication)
- **quotations** — Gestion des devis (CRUD, envoi, PDF)
- **clients** — Gestion des clients (CRUD, recherche)
- **bank** — Comptes bancaires, transactions, soldes, transactions non imputées
- **expenses** — Notes de frais
- **documents** — Documents comptables (list, upload, download)
- **labels** — Étiquettes et tags
- **status** — Résumé rapide de l'état comptable
- **open** — Ouvre Tiime dans le navigateur
- **version** — Version CLI et Node
- **completion** — Complétion shell (zsh, bash, fish)

### SDK (4 exports)

- `TiimeClient` — Client HTTP avec 10 ressources API
- `TokenManager` — Authentification Auth0
- `TiimeError` — Gestion d'erreurs structurée
- Types TypeScript — 40+ interfaces

## Architecture

Architecture en 3 couches :
1. **CLI** (`src/cli/`) — Interface utilisateur, commandes citty, i18n, formatage
2. **SDK** (`src/sdk/`) — Client HTTP, auth, 10 ressources API typées
3. **API Tiime** (externe) — REST API Tiime avec auth Auth0

→ Voir [Architecture](./architecture.md) pour le détail complet.

## Structure du dépôt

```
src/
├── index.ts           # Exports SDK
├── sdk/               # Client HTTP, auth, ressources API
│   ├── auth.ts, client.ts, errors.ts, types.ts
│   └── resources/     # 10 wrappers API
└── cli/               # CLI citty
    ├── index.ts, config.ts, i18n.ts, output.ts
    └── commands/      # 13 commandes
tests/                 # Vitest (6 fichiers)
docs/                  # Documentation
.github/workflows/     # CI/CD
```

→ Voir [Arbre source](./source-tree-analysis.md) pour l'arbre annoté complet.

## Liens

- [Architecture](./architecture.md)
- [Arbre source](./source-tree-analysis.md)
- [Guide de développement](./development-guide.md)
- [API Discovery](./api-discovery.md) — Documentation des 40+ endpoints API Tiime
- [Homebrew Setup](./homebrew-setup.md)
