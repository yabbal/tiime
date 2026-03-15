---
title: 'Audit Comptable & Auto-Correction Multi-Entreprises'
slug: 'audit-comptable-auto-correction'
created: '2026-03-08'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript 5.9', 'citty 0.2', 'ofetch 1.5', 'tsup 8.5', 'Biome 2.4', 'Vitest 4.0']
files_to_modify:
  - 'src/sdk/types.ts'
  - 'src/sdk/resources/bank-transactions.ts'
  - 'src/cli/audit.ts'
  - 'src/cli/commands/audit.ts'
  - 'src/cli/i18n.ts'
  - 'src/cli/index.ts'
  - 'skill/tiime.md'
code_patterns:
  - 'defineCommand() avec subCommands pour citty'
  - 'Multi-company: --all-companies / --company avec resolveCompanyIds()'
  - 'TiimeClient instancie par entreprise (companyId par iteration)'
  - 'output() / outputError() / outputSummary() pour sortie uniforme'
  - 'AutoImputeProposal pattern pour resultats structures'
  - 'Lazy resource getters sur TiimeClient'
  - 'Pagination Range header pour listes volumineuses'
test_patterns:
  - 'Vitest avec globals (describe, it, expect sans import)'
  - 'Co-location: fichier.test.ts a cote du source'
  - 'Mock ofetch pour SDK, mock TiimeClient pour CLI'
---

# Tech-Spec: Audit Comptable & Auto-Correction Multi-Entreprises

**Created:** 2026-03-08

## Overview

### Problem Statement

Aujourd'hui, pour savoir ce qui manque sur la comptabilite de ses 3 entreprises (Abbal Consulting, Allial Group, Allial Immobiliers), Youness doit naviguer manuellement dans Tiime pour chaque entreprise, verifier les transactions non imputees, les documents manquants, les factures de depenses absentes. C'est repetitif, chronophage, et facile d'oublier des elements.

### Solution

Ajouter une commande CLI `tiime audit` qui scanne automatiquement une ou plusieurs entreprises et produit un rapport structure de tout ce qui necessite une action comptable. La commande identifie les transactions non imputees, les transactions sans document justificatif, et peut auto-corriger ce qui est possible (imputation automatique via suggestions). Un skill Claude Code orchestre ensuite le rapport pour aider a planifier et executer les actions manuelles restantes (recuperer des factures fournisseurs, categoriser des documents, etc.).

### Scope

**In Scope:**
- Nouvelle commande CLI `tiime audit` avec support multi-entreprises (`--all-companies`, `--company`)
- Rapport structure par entreprise : transactions non imputees, transactions sans document, suggestions d'imputation disponibles
- Option `--apply` pour auto-corriger (imputation automatique quand suggestion dispo)
- Typage des imputations dans `src/sdk/types.ts` (interface `Imputation` fortement typee)
- Ajout d'une methode SDK `listWithDocuments()` pour fetcher les transactions AVEC documents
- Logique metier d'audit dans `src/cli/audit.ts` (separe de la commande, comme `auto-impute.ts`)
- Mise a jour du skill Claude Code pour orchestrer l'audit et guider les actions manuelles
- Enregistrement de la commande dans la CLI et i18n

**Out of Scope:**
- Creation de factures de vente
- Gestion des devis
- Notes de frais
- Rapprochement bancaire avance
- Upload automatique de documents (necessite les fichiers physiques)

## Context for Development

### Codebase Patterns

- **Commandes CLI** : `defineCommand()` citty avec `meta`, `args`, `run`. Sous-commandes via `subCommands` object.
- **Multi-entreprises** : Pattern etabli dans `src/cli/auto-impute.ts` — `listCompanies()` via TiimeClient(companyId=0), `resolveCompanyIds()` pour resoudre noms→IDs, boucle iterative avec un TiimeClient par entreprise.
- **Output** : Toujours via `output(data, { format })` pour json/table/csv. Erreurs via `outputError()`. Messages humains via `outputSummary()` (stderr).
- **SDK Resources** : Classes avec `private fetch: $Fetch` + `private companyId: number` injectes par constructeur. Lazy getters sur TiimeClient.
- **Auto-impute** : `AutoImputeProposal` interface avec status "proposed"|"applied"|"skipped"|"error". Dry-run par defaut, `--apply` pour executer.
- **Separation logique/commande** : La logique metier est dans `src/cli/auto-impute.ts`, la commande CLI dans `src/cli/commands/bank.ts`. Suivre ce meme pattern pour l'audit.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/cli/commands/bank.ts` | Pattern multi-company, subcommands, args structure, appel auto-impute |
| `src/cli/auto-impute.ts` | Logique metier separee, `AutoImputeProposal`, `resolveCompanyIds()`, `autoImputeForCompany()` |
| `src/sdk/resources/bank-transactions.ts` | `unimputed()`, `labelSuggestions()`, `impute()`, `list()`, `listAll()` |
| `src/sdk/resources/documents.ts` | `list()`, `categories()` |
| `src/sdk/client.ts` | `TiimeClient`, `listCompanies()`, lazy resource getters |
| `src/sdk/types.ts` | Interfaces existantes (BankTransaction, Document, Company, etc.) |
| `src/cli/output.ts` | `output()`, `outputError()`, `outputSummary()` |
| `src/cli/config.ts` | `getCompanyId()`, `loadConfig()`, `saveConfig()` |
| `src/cli/i18n.ts` | `descriptionTranslations` record FR→EN |
| `src/cli/index.ts` | Enregistrement des commandes dans le main |
| `skill/tiime.md` | Skill Claude Code existant |

### Technical Decisions

- **Separation logique/commande** : Logique d'audit dans `src/cli/audit.ts` (comme `auto-impute.ts`), commande CLI dans `src/cli/commands/audit.ts`. Tous les types audit dans `src/cli/audit.ts` (pas dans `types.ts` du SDK) pour eviter l'inversion de dependance SDK→CLI.
- **Reutilisation du pattern multi-company** : Memes flags `--all-companies`/`--company` que `bank auto-impute`, reutilisation de `resolveCompanyIds()` depuis `auto-impute.ts`.
- **`--apply` pour auto-correction (pas `--fix`)** : Coherence UX avec `bank auto-impute` qui utilise deja `--apply`. Mode par defaut = rapport seul (dry-run).
- **Pas de double parcours avec `--apply`** : `auditForCompany()` collecte les findings ET les suggestions. Quand `--apply` est actif, la logique d'imputation est integree dans `auditForCompany()` directement (reutilise `client.bankTransactions.impute()` inline), sans rappeler `autoImputeForCompany()`.
- **Header `without_documents` — CRITIQUE** : `list()` et `listAll()` dans `bank-transactions.ts` envoient le header Accept `application/vnd.tiime.bank_transactions.without_documents+json`. Pour detecter les documents manquants, il FAUT une methode `listWithDocuments()` qui n'envoie PAS ce header. Task 1b couvre cette modification.
- **Typage des imputations — PREREQUIS** : `BankTransaction.imputations` est actuellement `unknown[]`. Task 0 prevoit d'investiguer la reponse API reelle (un appel `GET /bank_transactions/{id}` sur une transaction imputee) pour typer `Imputation` correctement avant d'implementer la detection de documents manquants.
- **Filtre par exercice comptable** : `listWithDocuments()` accepte un parametre `from`/`to` pour limiter aux transactions de l'exercice en cours. Evite de fetcher tout l'historique.
- **Concurrence sur `labelSuggestions()`** : Utiliser `Promise.all()` avec batches de 5 pour paralleliser les appels, au lieu d'un `for...of` sequentiel. Implementer un helper `batchAsync(items, batchSize, fn)` inline dans `audit.ts`. Si une requete du batch echoue, capturer l'erreur et marquer le finding avec `suggested_label_id: null`.
- **Isolation des erreurs par entreprise** : `try/catch` autour de chaque `auditForCompany()`. En cas d'erreur, l'entreprise est incluse dans le rapport avec un champ `error` et les autres entreprises continuent. **ATTENTION** : ne PAS utiliser `outputError()` dans le catch par entreprise car `outputError()` appelle `process.exit(1)`. Utiliser `consola.error()` (stderr) pour logger, et setter `error: e.message` dans le rapport.
- **Resolution du `companyName`** : C'est la commande (Task 3) qui resout le nom, comme dans `bank.ts` : appeler `client.company.get()` pour obtenir le nom, avec fallback `String(companyId)` si echec. Le nom resolu est passe a `auditForCompany()`.
- **Determination de l'exercice comptable** : Task 2 calcule `from`/`to` via `client.company.accountingPeriod()`. Fallback si echec : `from` = 1er janvier de l'annee en cours, `to` = date du jour. Cela garantit que l'audit fonctionne meme sans exercice comptable configure.
- **Task 0 gate** : Les templates de code dans Task 1a sont des HYPOTHESES a confirmer par Task 0. Le developpeur DOIT executer Task 0 en premier et adapter les interfaces si la structure API differe. Si Task 0 revele que les documents ne sont PAS dans les imputations (meme sans le header `without_documents`), la strategie alternative est : cross-reference `documents.list()` avec les transactions imputees par date/montant, ou utiliser `GET /bank_transactions/{id}` unitairement.

## Implementation Plan

### Tasks

- [x] Task 0: Investigation API — typer les imputations
  - File: Aucun fichier a modifier (investigation)
  - Action: Executer `tiime bank transactions --page-size 1 --all` sur une entreprise avec des transactions imputees, puis `tiime bank transactions get --id <ID>` sur une transaction imputee pour inspecter la structure reelle du champ `imputations` et la presence de `documents`. Essayer aussi sans le header `without_documents` (via un appel ofetch direct ou curl).
  - Notes:
    - But : Confirmer la structure de `Imputation` : `{ label: {...}, amount: number, documents: { id: number }[], ... }`
    - But : Confirmer que SANS le header `without_documents`, les imputations incluent bien les documents rattaches
    - Si les documents ne sont pas dans les imputations : strategie alternative (cross-reference avec `documents.list()`)
    - Cette task BLOQUE les tasks 1a, 1b, 2

- [x] Task 1a: Typer les imputations et ajouter les types d'audit
  - File: `src/sdk/types.ts` et `src/cli/audit.ts`
  - Action:
    - Dans `src/sdk/types.ts` : Ajouter l'interface `Imputation` (structure confirmee par Task 0) et changer `BankTransaction.imputations` de `unknown[]` a `Imputation[]`
    - Dans `src/cli/audit.ts` : Definir les interfaces `AuditFinding`, `CompanyAuditReport`, `AuditReport` (types CLI, pas SDK)
  - Notes:
    ```typescript
    // src/sdk/types.ts
    export interface Imputation {
      label: ImputationLabel;
      amount: number;
      documents: { id: number }[];
      accountant_detail_requests: { id: number }[];
    }
    // Changer: imputations: unknown[] → imputations: Imputation[]

    // src/cli/audit.ts
    export interface UnimputedFinding {
      transaction_id: number;
      wording: string;
      amount: number;
      currency: string;
      transaction_date: string;
      suggested_label_id: number | null;
      suggested_label_name: string | null;
    }

    export interface MissingDocumentFinding {
      transaction_id: number;
      wording: string;
      amount: number;
      currency: string;
      transaction_date: string;
      operation_type: string;
      label_name: string;
    }

    export interface CompanyAuditReport {
      company_id: number;
      company_name: string;
      error: string | null;
      unimputed_transactions: UnimputedFinding[];
      missing_documents: MissingDocumentFinding[];
      applied_imputations: AppliedImputation[];
      summary: {
        total_unimputed: number;
        total_unimputed_amount: number;
        with_suggestions: number;
        without_suggestions: number;
        total_missing_documents: number;
        total_missing_documents_amount: number;
        applied_count: number;
      };
    }

    export interface AppliedImputation {
      transaction_id: number;
      wording: string;
      amount: number;
      label_name: string;
      status: "applied" | "error";
    }

    export interface AuditReport {
      date: string;
      companies: CompanyAuditReport[];
      apply_mode: boolean;
    }
    ```

- [x] Task 1b (SKIPPED — count_documents available via existing listAll()): Ajouter `listWithDocuments()` dans `BankTransactionsResource`
  - File: `src/sdk/resources/bank-transactions.ts`
  - Action: Ajouter une methode `listWithDocuments()` qui fonctionne comme `list()` mais SANS le header `without_documents` dans le Accept, et avec un filtre par date
  - Notes:
    - Copier la logique de `list()` mais modifier le header Accept pour retirer `application/vnd.tiime.bank_transactions.without_documents+json`
    - Garder `application/vnd.tiime.bank_transactions.v2+json` seul
    - Ajouter params optionnels `from?: string` et `to?: string` pour filtrer par date
    - Ajouter une methode `listAllWithDocuments(params?)` qui pagine automatiquement (comme `listAll()`)

- [x] Task 2: Creer la logique metier d'audit dans `src/cli/audit.ts`
  - File: `src/cli/audit.ts` (nouveau fichier)
  - Action: Creer `auditForCompany()` qui collecte les findings pour une entreprise
  - Notes:
    - Signature : `async function auditForCompany(client: TiimeClient, companyId: number, companyName: string, options: { apply: boolean }): Promise<CompanyAuditReport>`
    - **Etape 1 — Transactions non imputees** :
      - `client.bankTransactions.unimputed()` → obtenir la liste
      - Pour chaque transaction, `labelSuggestions()` en batches de 5 via `Promise.all()` pour paralleliser
      - Build `UnimputedFinding[]`
      - Si `options.apply` et suggestion disponible : appeler `client.bankTransactions.impute()` directement → build `AppliedImputation[]`
    - **Etape 1.5 — Determiner l'exercice comptable** :
      - `try { period = await client.company.accountingPeriod() }` → extraire `from`/`to`
      - Fallback si echec : `from = YYYY-01-01` (1er janvier annee courante), `to = YYYY-MM-DD` (aujourd'hui)
    - **Etape 2 — Documents manquants** :
      - `client.bankTransactions.listAllWithDocuments({ from, to })` → filtrer les transactions imputees (`imputations.length > 0`) dont TOUTES les `imputations[].documents` sont vides
      - Build `MissingDocumentFinding[]` (inclure `operation_type` de la transaction pour la priorisation)
    - **Etape 3** : Calculer le summary (compteurs, montants)
    - Exporter `auditForCompany`

- [x] Task 3: Creer la commande CLI `tiime audit` dans `src/cli/commands/audit.ts`
  - File: `src/cli/commands/audit.ts` (nouveau fichier)
  - Action: Creer la commande `audit` avec args et logique multi-company
  - Notes:
    - Args : `--format` (json/table/csv), `--all-companies` (boolean), `--company` (string, comma-separated IDs ou noms), `--apply` (boolean, default false)
    - Sans `--all-companies` ni `--company` : utilise `getCompanyId()` (entreprise active)
    - Avec `--all-companies` : `TiimeClient({ companyId: 0 }).listCompanies()` puis boucle
    - Avec `--company "A,B"` : `resolveCompanyIds()` puis boucle
    - **Resolution du nom par entreprise** : Pour chaque `companyId`, creer `TiimeClient({ companyId })`, puis `const company = await client.company.get()` pour obtenir `company.name`. Fallback : `String(companyId)` si echec. Passer le nom resolu a `auditForCompany()`.
    - **Isolation erreurs par entreprise** : `try/catch` autour de chaque `auditForCompany()`. En cas d'erreur, utiliser `consola.error()` (PAS `outputError()` qui fait `process.exit(1)`), et inclure l'entreprise dans le rapport avec `error: e.message` et `summary` a zero. Les autres entreprises continuent.
    - Assembler le `AuditReport` final et `output(report, { format })`
    - Pattern identique a `bank auto-impute` dans `bank.ts`

- [x] Task 4: Ajouter les traductions i18n
  - File: `src/cli/i18n.ts`
  - Action: Ajouter les paires FR→EN dans `descriptionTranslations`
  - Notes:
    ```typescript
    "Audit comptable multi-entreprises": "Multi-company accounting audit",
    "Traiter toutes les entreprises": "Process all companies",
    "Entreprise(s) cible(s) (ID ou nom, séparés par des virgules)": "Target company(ies) (ID or name, comma-separated)",
    "Appliquer les corrections automatiques (imputation auto)": "Apply automatic fixes (auto-imputation)",
    ```

- [x] Task 5: Enregistrer la commande dans la CLI
  - File: `src/cli/index.ts`
  - Action: Importer `auditCommand` et l'ajouter dans `subCommands`
  - Notes:
    - Ajouter `import { auditCommand } from "./commands/audit";`
    - Ajouter `audit: auditCommand` dans `subCommands`

- [x] Task 6: Mettre a jour le skill Claude Code
  - File: `skill/tiime.md`
  - Action: Ajouter la documentation de la commande `audit` et un workflow d'audit dans le skill
  - Notes:
    - Ajouter `tiime audit` dans la section des commandes avec tous les args
    - Ajouter un workflow "Audit comptable" qui decrit le flux :
      1. Lancer `tiime audit --all-companies --format json`
      2. Analyser le rapport JSON
      3. Pour les transactions avec suggestions : proposer `--apply` ou lister
      4. Pour les documents manquants : lister par fournisseur/merchant avec montant et date, indiquer ou recuperer la facture
      5. Prioriser par montant (plus gros montants d'abord)
    - Le skill doit pouvoir etre invoque avec `/tiime audit` ou quand l'utilisateur dit "fais un audit", "qu'est-ce que je dois faire sur ma compta", etc.

- [x] Task 7: Linter et build
  - Action: `pnpm lint` puis `pnpm build` pour verifier que tout compile
  - Notes: Biome check sur `src/`, tsup build des 2 bundles

### Acceptance Criteria

- [ ] AC 1: Given une entreprise avec des transactions non imputees, when `tiime audit` est execute, then le rapport liste toutes les transactions non imputees avec leur montant, date et suggestions disponibles.
- [ ] AC 2: Given une entreprise avec des transactions imputees sans document, when `tiime audit` est execute, then le rapport liste ces transactions dans la section `missing_documents` avec le label utilise.
- [ ] AC 3: Given `--all-companies`, when `tiime audit --all-companies` est execute, then le rapport contient une section par entreprise accessible a l'utilisateur.
- [ ] AC 4: Given `--company "Abbal Consulting,Allial Group"`, when `tiime audit --company "Abbal Consulting,Allial Group"` est execute, then seules ces 2 entreprises sont auditees.
- [ ] AC 5: Given des transactions non imputees avec suggestions, when `tiime audit --apply` est execute, then les imputations sont appliquees et le rapport contient les resultats dans `applied_imputations` de chaque entreprise.
- [ ] AC 6: Given `--format json`, when `tiime audit --format json` est execute, then la sortie est un JSON valide parseable par un agent IA.
- [ ] AC 7: Given `--format table`, when `tiime audit --format table` est execute, then la sortie est un tableau ASCII lisible.
- [ ] AC 8: Given aucun flag d'entreprise, when `tiime audit` est execute, then l'entreprise active (via `getCompanyId()`) est auditee.
- [ ] AC 9: Given `tiime audit --help`, when execute, then l'aide s'affiche en francais (defaut) ou anglais (TIIME_LANG=en) sans erreur.
- [ ] AC 10: Given le skill Claude Code, when l'utilisateur demande un audit, then le skill invoque `tiime audit --all-companies --format json` et produit un plan d'action structure avec les elements a recuperer manuellement.
- [ ] AC 11: Given une erreur API sur une entreprise, when `tiime audit --all-companies` est execute, then les autres entreprises sont quand meme auditees et l'entreprise en erreur a un champ `error` dans le rapport.
- [ ] AC 12: Given `BankTransaction.imputations`, when le code accede aux imputations, then le type est `Imputation[]` (pas `unknown[]`) avec des champs fortement types.

## Additional Context

### Dependencies

- Aucune nouvelle dependance npm — tout est deja present (citty, ofetch, cli-table3).
- Depend des endpoints API existants : `/bank_transactions/unimputed`, `/bank_transactions/{id}/label_suggestions`, `/bank_transactions` (list SANS header without_documents), `/bank_transactions/{id}` (get pour investigation).
- Reutilise `resolveCompanyIds()` de `src/cli/auto-impute.ts`.
- Reutilise `client.bankTransactions.impute()` directement (pas `autoImputeForCompany()`) pour eviter le double parcours.
- Reutilise `listCompanies()` de `TiimeClient`.

### Testing Strategy

- Tests unitaires dans `src/cli/audit.test.ts` — mock TiimeClient, verifier structure du `CompanyAuditReport`.
- Test des compteurs summary : mock transactions avec/sans imputations, avec/sans documents, verifier les totaux.
- Test multi-company dans `src/cli/commands/audit.test.ts` — mock `listCompanies()` et `auditForCompany()`, verifier l'assemblage du `AuditReport`.
- Test du mode `--apply` : verifier que `impute()` est appele pour chaque transaction avec suggestion.
- Test isolation erreurs : mock une entreprise qui throw, verifier que les autres sont dans le rapport.
- Smoke test CLI : `tiime audit --help` doit afficher l'aide sans erreur.
- Test manuel sur les 3 entreprises reelles apres implementation.

### Notes

- **Task 0 est bloquante** : Sans l'investigation de la reponse API reelle, la structure d'`Imputation` et la validite du header Accept sont incertaines. Cette task doit etre faite en premier.
- Le `listAllWithDocuments()` pagine automatiquement — le filtre `from`/`to` par exercice comptable limite le volume. L'exercice en cours peut etre obtenu via `client.company.accountingPeriod()`.
- Les 3 entreprises cibles : Abbal Consulting, Allial Group, Allial Immobiliers.
- Le skill doit etre autonome : diagnostic + actions correctives + liste des actions manuelles avec priorite par montant.
- Batching des `labelSuggestions()` par 5 : compromis entre perf et charge API. Ajustable si necessaire.
