---
title: 'Tests unitaires SDK + CLI'
slug: 'unit-tests-sdk-cli'
created: '2026-03-08'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['vitest ^4.0.18', 'typescript ^5.9.3', 'ofetch ^1.5.1', 'citty ^0.2.1']
files_to_modify:
  - 'tests/sdk/errors.test.ts (CREATE)'
  - 'tests/sdk/client.test.ts (CREATE)'
  - 'tests/sdk/company.test.ts (CREATE)'
  - 'tests/sdk/labels.test.ts (CREATE)'
  - 'tests/sdk/quotations.test.ts (CREATE)'
  - 'tests/sdk/expense-reports.test.ts (CREATE)'
  - 'tests/sdk/users.test.ts (CREATE)'
  - 'tests/cli/config.test.ts (CREATE)'
  - 'tests/cli/i18n.test.ts (CREATE)'
code_patterns:
  - 'mock-fetch: vi.fn() as $Fetch, mockResolvedValueOnce(), verify calls with expect.objectContaining()'
  - 'mock-node-modules: vi.mock("node:fs"), vi.mock("node:os")'
  - 'factory-helpers: makeFakeX(overrides?) for test data'
  - 'beforeEach: mockFetch.mockReset() + new ResourceInstance(mockFetch, COMPANY_ID)'
  - 'assertions: toHaveBeenCalledWith(url, expect.objectContaining({headers, query}))'
test_patterns: ['tests/sdk/*.test.ts', 'tests/cli/*.test.ts']
---

# Tech-Spec: Tests unitaires SDK + CLI

**Created:** 2026-03-08

## Overview

### Problem Statement

Le projet Tiime CLI a une couverture de tests partielle : seuls 5 fichiers SDK et 2 fichiers CLI sont testés sur un total de ~30 modules. Les modules critiques comme `client.ts`, `errors.ts`, 6 ressources SDK (`company`, `labels`, `quotations`, `expense-reports`, `users`), et les utilitaires CLI (`config.ts`, `i18n.ts`) n'ont aucun test, exposant le projet à des régressions silencieuses.

### Solution

Compléter la couverture de tests unitaires en suivant les patterns déjà établis dans le projet (mock `$Fetch` pour les ressources SDK, spy `process.stdout` pour le CLI, `vi.mock` pour les modules Node.js). Conserver la convention de dossier `tests/` existante.

### Scope

**In Scope:**
- SDK : `client.ts`, `errors.ts`, et les ressources non couvertes (`company`, `labels`, `quotations`, `expense-reports`, `users`)
- CLI : `config.ts`, `i18n.ts`
- Note : `bank-accounts` est déjà couvert dans `tests/sdk/bank.test.ts`

**Out of Scope:**
- Commandes CLI (`src/cli/commands/*`) — couplage trop fort avec TiimeClient, ROI faible
- Migration des tests vers la colocation (rester dans `tests/`)
- Tests e2e / intégration
- `types.ts` — interfaces pures, pas de logique à tester

## Context for Development

### Codebase Patterns

**Pattern SDK Resources (référence : `tests/sdk/invoices.test.ts`) :**
```typescript
const COMPANY_ID = 123;
const mockFetch = vi.fn();

describe("XxxResource", () => {
  let resource: XxxResource;
  beforeEach(() => {
    mockFetch.mockReset();
    resource = new XxxResource(mockFetch as never, COMPANY_ID);
  });

  describe("methodName", () => {
    it("should call correct endpoint with correct params", async () => {
      mockFetch.mockResolvedValueOnce(fakeData);
      await resource.methodName(args);
      expect(mockFetch).toHaveBeenCalledWith(
        `/companies/${COMPANY_ID}/endpoint`,
        expect.objectContaining({ headers: {...}, query: {...} })
      );
    });
  });
});
```

**Pattern CLI config (référence : `tests/sdk/auth.test.ts`) :**
```typescript
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));
vi.mock("node:os", () => ({
  homedir: vi.fn(() => "/tmp/test-home"),
}));
```

**Pattern i18n :**
```typescript
const originalEnv = process.env;
beforeEach(() => { process.env = { ...originalEnv }; });
afterEach(() => { process.env = originalEnv; });
```

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `tests/sdk/invoices.test.ts` | Pattern de référence pour tester une ressource SDK |
| `tests/sdk/bank.test.ts` | Pattern pour pagination, Accept headers, transformations |
| `tests/sdk/auth.test.ts` | Pattern pour mock modules Node.js |
| `tests/cli/output.test.ts` | Pattern pour spy stdout/stderr |
| `tests/cli/auto-impute.test.ts` | Pattern pour mock TiimeClient complet |
| `src/sdk/client.ts` | Source — TiimeClient, intercepteurs, getters ressources |
| `src/sdk/errors.ts` | Source — TiimeError (22 L) |
| `src/sdk/resources/company.ts` | Source — 6 méthodes |
| `src/sdk/resources/labels.ts` | Source — 3 méthodes |
| `src/sdk/resources/quotations.ts` | Source — 5 méthodes, logique critique |
| `src/sdk/resources/expense-reports.ts` | Source — 3 méthodes |
| `src/sdk/resources/users.ts` | Source — 3 méthodes |
| `src/cli/config.ts` | Source — loadConfig, saveConfig, getCompanyId |
| `src/cli/i18n.ts` | Source — getLang, translateHelp |

### Technical Decisions

- **Convention `tests/`** : garder la structure existante
- **Pas de tests de commandes CLI** : ROI faible vs effort
- **bank-accounts déjà couvert** : dans `tests/sdk/bank.test.ts`
- **client.ts** : tester les getters et `listCompanies()`, mocker `TokenManager` et `ofetch`
- **quotations.create()** : cas critique — vérifier le calcul `line_amount = quantity * unit_amount` et les defaults

## Implementation Plan

### Tasks

Ordre logique : couches basses d'abord (errors → client → resources → CLI).

- [x] Task 1: Créer `tests/sdk/errors.test.ts`
  - File: `tests/sdk/errors.test.ts` (CREATE)
  - Action: Tester la classe `TiimeError` importée depuis `src/sdk/errors.ts`
  - Tests à écrire:
    - Instanciation avec tous les paramètres (message, status, endpoint, details)
    - Propriété `name` === `"TiimeError"`
    - `instanceof Error` retourne `true`
    - `toJSON()` retourne `{ error: "TiimeError", message, status, endpoint, details }`
    - Instanciation sans `details` (optionnel) — `details` est `undefined` dans toJSON
    - Le `message` est accessible via la propriété héritée d'Error

- [x] Task 2: Créer `tests/sdk/client.test.ts`
  - File: `tests/sdk/client.test.ts` (CREATE)
  - Action: Tester `TiimeClient` importé depuis `src/sdk/client.ts`. Mocker `TokenManager` via `vi.mock("../src/sdk/auth.ts")` et `ofetch` via `vi.mock("ofetch")`.
  - Tests à écrire:
    - **Getters** : chaque getter (`invoices`, `bankTransactions`, `labels`, etc.) retourne une instance de la bonne classe de ressource (vérifier `instanceof`)
    - **listCompanies()** : appelle `fetch` avec URL `/companies`, header `Accept: application/vnd.tiime.companies.v2+json`, header `Range: items=0-101`
    - **Getters retournent une nouvelle instance à chaque appel** (pas de cache)
  - Notes: Mocker le module `ofetch` pour capturer la factory `ofetch.create()`. Mocker `TokenManager` pour que `getValidToken()` retourne un token fixe.

- [x] Task 3: Créer `tests/sdk/company.test.ts`
  - File: `tests/sdk/company.test.ts` (CREATE)
  - Action: Tester `CompanyResource` importé depuis `src/sdk/resources/company.ts`. Suivre le pattern `mockFetch` + `beforeEach`.
  - Tests à écrire:
    - `get()` : appelle `/companies/{COMPANY_ID}`
    - `users()` : appelle `/companies/{COMPANY_ID}/users`
    - `appConfig()` : appelle `/companies/{COMPANY_ID}/app_config`
    - `accountingPeriod()` sans argument : query `range_year: 1` (défaut)
    - `accountingPeriod(3)` : query `range_year: 3` (override)
    - `tiles(["revenue", "expenses"])` : query `keys: "revenue,expenses"` (join avec `,`)
    - `tiles([])` : query `keys: ""` (tableau vide)
    - `dashboardBlocks()` sans argument : query `display_group: "monitoring"`, `sorts: "rank:asc"` (défauts)
    - `dashboardBlocks("custom")` : query `display_group: "custom"` (override)

- [x] Task 4: Créer `tests/sdk/labels.test.ts`
  - File: `tests/sdk/labels.test.ts` (CREATE)
  - Action: Tester `LabelsResource` importé depuis `src/sdk/resources/labels.ts`. Suivre le pattern `mockFetch` + `beforeEach`.
  - Tests à écrire:
    - `list()` : appelle `/companies/{COMPANY_ID}/labels` avec header `Accept: application/vnd.tiime.labels.v2+json`
    - `standard()` : appelle `/companies/{COMPANY_ID}/standard_labels`
    - `tags()` : appelle `/companies/{COMPANY_ID}/tags` avec query `expand: "tag_detail"`

- [x] Task 5: Créer `tests/sdk/quotations.test.ts`
  - File: `tests/sdk/quotations.test.ts` (CREATE)
  - Action: Tester `QuotationsResource` importé depuis `src/sdk/resources/quotations.ts`. C'est le fichier le plus critique car `create()` contient de la logique métier.
  - Tests à écrire:
    - `list()` sans argument : query `expand: "invoices"` (défaut), header `Range: items=0-25`
    - `list("clients")` : query `expand: "clients"` (override)
    - `get(42)` : appelle `/companies/{COMPANY_ID}/quotations/42`
    - `create(params)` — **happy path** : vérifie que le body envoyé contient `line_amount = quantity * unit_amount` pour chaque ligne
    - `create(params)` — **defaults appliqués** : si `sequence`, `invoicing_category_type`, `discount_description`, `discount_amount`, `discount_percentage` sont absents, ils prennent respectivement `1`, `"benefit"`, `""`, `null`, `null`
    - `create(params)` — **defaults non écrasés** : si les valeurs existent déjà, elles sont conservées (ex: `sequence: 5` reste `5`)
    - `create(params)` — **lines undefined** : si `params.lines` est `undefined`, pas d'erreur (boucle `for...of` sur `params.lines ?? []`)
    - `downloadPdf(42)` : appelle `/companies/{COMPANY_ID}/quotations/42/pdf` avec header `Accept: application/pdf`
    - `send(42, { emails: ["a@b.com"] })` : POST `/companies/{COMPANY_ID}/quotations/42/send` avec body

- [x] Task 6: Créer `tests/sdk/expense-reports.test.ts`
  - File: `tests/sdk/expense-reports.test.ts` (CREATE)
  - Action: Tester `ExpenseReportsResource` importé depuis `src/sdk/resources/expense-reports.ts`. Suivre le pattern `mockFetch` + `beforeEach`.
  - Tests à écrire:
    - `list()` sans argument : query `sorts: "metadata.date:desc"` (défaut), `expand: "total_amount"`, header `Range: items=0-25`
    - `list("created_at:asc")` : query `sorts: "created_at:asc"` (override), `expand: "total_amount"` (toujours hardcoded)
    - `get(42)` : appelle `/companies/{COMPANY_ID}/expense_reports/42`
    - `create(params)` : POST `/companies/{COMPANY_ID}/expense_reports` avec body = params

- [x] Task 7: Créer `tests/sdk/users.test.ts`
  - File: `tests/sdk/users.test.ts` (CREATE)
  - Action: Tester `UsersResource` importé depuis `src/sdk/resources/users.ts`. Attention : les endpoints n'utilisent PAS `companyId` dans l'URL (sauf `settings`).
  - Tests à écrire:
    - `me()` : appelle `/users/me` (pas de `/companies/` prefix)
    - `legalInformations()` : appelle `/users/me/legal_informations`
    - `settings(50824)` : appelle `/users/me/companies/50824/settings` (companyId dans l'URL)

- [x] Task 8: Créer `tests/cli/config.test.ts`
  - File: `tests/cli/config.test.ts` (CREATE)
  - Action: Tester `loadConfig`, `saveConfig`, `getCompanyId` importés depuis `src/cli/config.ts`. Mocker `node:fs` et `node:os`.
  - Tests à écrire:
    - `loadConfig()` — fichier existe : retourne le contenu JSON parsé
    - `loadConfig()` — fichier n'existe pas : retourne `{}`
    - `loadConfig()` — fichier corrompu (JSON invalide) : retourne `{}` (catch silencieux)
    - `saveConfig(config)` — répertoire existe : écrit le JSON avec `writeFileSync`
    - `saveConfig(config)` — répertoire n'existe pas : crée le répertoire avec `mkdirSync` puis écrit
    - `getCompanyId()` — config a `companyId` : retourne le nombre
    - `getCompanyId()` — config sans `companyId` : lance une erreur
  - Notes: Mocker `homedir()` pour retourner `/tmp/test-home`, vérifier que les chemins construits sont `"/tmp/test-home/.config/tiime/config.json"`

- [x] Task 9: Créer `tests/cli/i18n.test.ts`
  - File: `tests/cli/i18n.test.ts` (CREATE)
  - Action: Tester `getLang` et `translateHelp` importés depuis `src/cli/i18n.ts`. Manipuler `process.env` dans `beforeEach`/`afterEach`.
  - Tests à écrire:
    - `getLang()` — `TIIME_LANG=en` : retourne `"en"` (priorité maximale)
    - `getLang()` — `TIIME_LANG` absent, `LC_ALL=fr_FR.UTF-8` : retourne `"fr"`
    - `getLang()` — `TIIME_LANG` absent, `LC_ALL` absent, `LANG=en_US.UTF-8` : retourne `"en"`
    - `getLang()` — aucune variable : retourne `"fr"` (défaut)
    - `translateHelp(text)` — langue `"fr"` : retourne le texte inchangé
    - `translateHelp(text)` — langue `"en"` : remplace les descriptions françaises par les traductions anglaises
    - `translateHelp(text)` — texte sans correspondance : retourne le texte inchangé
  - Notes: Sauvegarder et restaurer `process.env` pour chaque test. Tester un échantillon de traductions (3-5 paires FR→EN), pas les 140+.

### Acceptance Criteria

**SDK — errors.ts:**
- [x] AC 1: Given une `TiimeError` instanciée avec `("Not found", 404, "/invoices/1", { id: 1 })`, when on appelle `toJSON()`, then le résultat contient `{ error: "TiimeError", message: "Not found", status: 404, endpoint: "/invoices/1", details: { id: 1 } }`
- [x] AC 2: Given une `TiimeError`, when on vérifie `instanceof Error`, then le résultat est `true`

**SDK — client.ts:**
- [x] AC 3: Given un `TiimeClient` instancié, when on accède au getter `invoices`, then on obtient une instance de `InvoicesResource`
- [x] AC 4: Given un `TiimeClient` instancié, when on appelle `listCompanies()`, then le fetch est appelé avec les bons headers (Accept vnd.tiime, Range items=0-101)

**SDK — company.ts:**
- [x] AC 5: Given un `CompanyResource`, when on appelle `accountingPeriod()` sans argument, then la query contient `range_year: 1`
- [x] AC 6: Given un `CompanyResource`, when on appelle `tiles(["a", "b"])`, then la query contient `keys: "a,b"`

**SDK — labels.ts:**
- [x] AC 7: Given un `LabelsResource`, when on appelle `list()`, then le header Accept est `application/vnd.tiime.labels.v2+json`

**SDK — quotations.ts:**
- [x] AC 8: Given un `QuotationsResource` et des lignes avec `quantity: 3` et `unit_amount: 100`, when on appelle `create()`, then chaque ligne a `line_amount: 300`
- [x] AC 9: Given un `QuotationsResource` et des lignes sans `sequence`, when on appelle `create()`, then chaque ligne a `sequence: 1` par défaut
- [x] AC 10: Given un `QuotationsResource` et des lignes avec `sequence: 5`, when on appelle `create()`, then `sequence` reste `5`

**SDK — expense-reports.ts:**
- [x] AC 11: Given un `ExpenseReportsResource`, when on appelle `list()` sans argument, then la query contient `sorts: "metadata.date:desc"` et `expand: "total_amount"`

**SDK — users.ts:**
- [x] AC 12: Given un `UsersResource`, when on appelle `me()`, then le fetch est appelé avec `/users/me` (pas de companyId dans l'URL)

**CLI — config.ts:**
- [x] AC 13: Given un fichier config inexistant, when on appelle `loadConfig()`, then le résultat est `{}`
- [x] AC 14: Given une config sans `companyId`, when on appelle `getCompanyId()`, then une erreur est lancée

**CLI — i18n.ts:**
- [x] AC 15: Given `TIIME_LANG=en` dans l'environnement, when on appelle `getLang()`, then le résultat est `"en"`
- [x] AC 16: Given aucune variable d'environnement, when on appelle `getLang()`, then le résultat est `"fr"`

**Global:**
- [x] AC 17: Given tous les nouveaux tests créés, when on exécute `pnpm test`, then tous les tests passent sans erreur
- [x] AC 18: Given tous les fichiers de tests, when on exécute `pnpm lint`, then aucune erreur Biome

## Additional Context

### Dependencies

- Vitest ^4.0.18 (déjà installé)
- Aucune nouvelle dépendance requise

### Testing Strategy

- **9 fichiers de tests** à créer (7 SDK + 2 CLI)
- Chaque fichier suit le pattern établi dans les tests existants
- Mock `$Fetch` (`vi.fn()`) pour isoler chaque ressource SDK
- Mock `node:fs` et `node:os` pour isoler les I/O fichier (config.ts)
- Manipulation de `process.env` pour isoler la détection de langue (i18n.ts)
- Vérifications : endpoints corrects, headers corrects, transformations de paramètres, valeurs par défaut, edge cases
- Exécuter `pnpm test` pour valider que tous les tests passent
- Exécuter `pnpm lint` pour valider la conformité Biome

### Notes

- Les tests existants servent de référence — ne pas les modifier sauf si des bugs sont trouvés
- `client.test.ts` est le plus complexe car il nécessite de mocker `ofetch.create()` et `TokenManager` — s'inspirer du pattern de `auth.test.ts` pour les mocks de modules
- `quotations.test.ts` a la plus haute valeur métier car `create()` contient du calcul et des defaults
- Pour `i18n.test.ts`, tester un échantillon représentatif de traductions, pas l'exhaustivité des 140+ entrées

## Review Notes
- Adversarial review completed
- Findings: 9 total, 5 fixed, 4 skipped (1 noise, 3 low-risk acknowledged)
- Resolution approach: auto-fix
- Fixed: F1 (test title), F2 (multi-line help block test), F5 (mutation test), F8 (LC_MESSAGES test), F4 (clearer undefined lines test)
- Skipped: F3 (type constraint noise), F6 (interceptors out of scope), F7 (noise), F9 (source issue not test issue)
