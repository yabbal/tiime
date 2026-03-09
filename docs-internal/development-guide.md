# Guide de développement — Tiime CLI & SDK

> Généré le 2026-03-07 | Scan level: deep

## Prérequis

| Outil | Version minimale | Installation |
|-------|-----------------|-------------|
| Node.js | >=20 | [nodejs.org](https://nodejs.org) |
| pnpm | 10.30.2 | `corepack enable && corepack prepare pnpm@10.30.2` |

## Installation depuis les sources

```bash
git clone <repo-url>
cd tiime
pnpm install
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `pnpm build` | Build tous les packages (SDK + CLI + docs) via Turborepo |
| `pnpm dev` | Watch mode — rebuild à chaque modification |
| `pnpm lint` | Vérifie le code avec Biome (`src/`) |
| `pnpm format` | Formate le code avec Biome (`--write src/`) |
| `pnpm test` | Lance les tests une fois (Vitest) |
| `pnpm test:watch` | Lance les tests en mode watch |
| `pnpm release` | Publie via changesets |

## Configuration de l'environnement

### Authentification

```bash
# Login interactif
pnpm build && ./dist/cli.js auth login

# Login scriptable
./dist/cli.js auth login --email user@example.com --password secret
```

Les credentials sont stockés dans le **Keychain macOS** (service `tiime-credentials`). En cas d'indisponibilité, fallback vers `~/.config/tiime/credentials.json` (permissions 0o600).

### Fichiers de configuration

| Fichier | Contenu |
|---------|---------|
| `~/.config/tiime/auth.json` | Token d'accès + timestamp d'expiration |
| `~/.config/tiime/config.json` | `{ companyId: number }` |
| `~/.config/tiime/credentials.json` | Email + password (fallback keychain) |

### Variables d'environnement

| Variable | Valeurs | Défaut | Rôle |
|----------|---------|--------|------|
| `TIIME_LANG` | `fr`, `en` | `fr` (détection locale) | Langue de l'interface CLI |
| `TIIME_ACCESS_TOKEN` | JWT | — | Token d'accès Auth0 (SDK standalone) |
| `TIIME_EMAIL` | email | — | Email du compte Tiime (SDK standalone) |
| `TIIME_PASSWORD` | string | — | Mot de passe (SDK standalone) |
| `TIIME_COMPANY_ID` | number | — | ID de l'entreprise (SDK standalone) |

## Build

### 2 packages npm

Le monorepo publie 2 packages npm :

| Package | Entrée | Sortie | Usage |
|---------|--------|--------|-------|
| `tiime-sdk` | `packages/tiime-sdk/src/index.ts` | `dist/index.js` + `dist/index.d.ts` | Import npm (`import { TiimeClient } from 'tiime-sdk'`) |
| `tiime-cli` | `packages/tiime-cli/src/cli/index.ts` | `dist/cli.js` | Exécutable (`tiime` ou `./dist/cli.js`) |

Turborepo ordonne le build : tiime-sdk d'abord (dépendance), puis tiime-cli.
La version CLI est injectée dynamiquement depuis `package.json` via `tsup define` (`__VERSION__`).

## Tests

### Framework

- **Vitest** avec `globals: true` (pas besoin d'importer `describe`, `it`, `expect`)
- Config dans `vitest.config.ts`

### Structure des tests

```
packages/tiime-sdk/tests/   # Tests SDK (auth, client, resources)
packages/tiime-cli/tests/   # Tests CLI (output, config, auto-impute, i18n)
```

### Lancer les tests

```bash
pnpm test              # Une fois
pnpm test:watch        # Mode watch
```

## Linting & Formatting

- **Biome v2.4.6** — Linter + formatter unifié
- Config dans `biome.json`
- Indentation : **tabs**
- Rules : recommended

```bash
pnpm lint              # Check (read-only)
pnpm format            # Auto-fix + write
```

## Release & versioning

### Changesets

- Workflow basé sur `@changesets/cli`
- Créer un changeset : `pnpm changeset`
- Publie automatiquement sur push main via GitHub Actions

### CI/CD (GitHub Actions)

**ci.yml :**
1. Install (pnpm)
2. Lint (biome)
3. Build (tsup)
4. Test (vitest)
5. Test CLI binary (`./dist/cli.js version`)
6. Release (changesets, uniquement sur main)

**Matrice :** Node 22 et 24

**homebrew.yml :**
- Déclenché sur release published
- Met à jour la formule Homebrew dans le tap `yabbal/homebrew-tap`

## Conventions de code

- **Langage du code** : Anglais (variables, fonctions, commentaires)
- **Langage CLI** : Français par défaut (descriptions, messages)
- **Fonctions fléchées** préférées
- **`const`** par défaut, jamais `var`
- **Typage strict** — pas de `any`
- **Modules ESM** — `import`/`export`
- **Conventional commits** — `feat:`, `fix:`, `chore:`, etc.

## Distribution

| Canal | Commande d'installation |
|-------|------------------------|
| npm (global) | `npm install -g tiime-cli` |
| Homebrew | `brew install yabbal/tap/tiime` |
| Source | `git clone && pnpm install && pnpm build` |
