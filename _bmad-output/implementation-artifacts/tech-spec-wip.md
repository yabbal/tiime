---
title: 'Audit Comptable & Auto-Correction Multi-Entreprises'
slug: 'audit-comptable-auto-correction'
created: '2026-03-08'
status: 'review'
stepsCompleted: [1, 2, 3]
tech_stack: ['TypeScript 5.9', 'citty 0.2', 'ofetch 1.5', 'tsup 8.5', 'Biome 2.4', 'Vitest 4.0']
files_to_modify:
  - 'src/sdk/types.ts'
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
- Option `--fix` pour auto-corriger (imputation automatique quand suggestion dispo)
- Types dans `src/sdk/types.ts` pour les resultats d'audit
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
| `src/sdk/resources/bank-transactions.ts` | `unimputed()`, `labelSuggestions()`, `impute()` |
| `src/sdk/resources/documents.ts` | `list()`, `categories()` |
| `src/sdk/client.ts` | `TiimeClient`, `listCompanies()`, lazy resource getters |
| `src/sdk/types.ts` | Interfaces existantes (BankTransaction, Document, Company, etc.) |
| `src/cli/output.ts` | `output()`, `outputError()`, `outputSummary()` |
| `src/cli/config.ts` | `getCompanyId()`, `loadConfig()`, `saveConfig()` |
| `src/cli/i18n.ts` | `descriptionTranslations` record FR→EN |
| `src/cli/index.ts` | Enregistrement des commandes dans le main |
| `skill/tiime.md` | Skill Claude Code existant |

### Technical Decisions

- **Separation logique/commande** : Logique d'audit dans `src/cli/audit.ts` (comme `auto-impute.ts`), commande CLI dans `src/cli/commands/audit.ts`.
- **Reutilisation du pattern multi-company** : Memes flags `--all-companies`/`--company` que `bank auto-impute`, reutilisation de `resolveCompanyIds()` depuis `auto-impute.ts`.
- **`--fix` pour auto-correction** : En interne, delegue a `autoImputeForCompany()` existant pour l'imputation. Le mode par defaut est rapport seul (dry-run).
- **Rapport structure type `AuditReport`** : Un objet par entreprise avec sections : `unimputed_transactions` (avec suggestions), `missing_documents` (transactions imputees sans document), `summary` (compteurs et montants).
- **Detection documents manquants** : Via le champ `imputations` des transactions. Une transaction imputee dont `imputations[].documents` est vide = document manquant. Necessite de lister les transactions imputees aussi (via `list()` ou `listAll()`).
- **Le skill Claude Code** invoque `tiime audit --all-companies --format json`, parse le JSON, et produit un plan d'action priorise.

## Implementation Plan

### Tasks

- [ ] Task 1: Ajouter les types d'audit dans `src/sdk/types.ts`
  - File: `src/sdk/types.ts`
  - Action: Ajouter les interfaces `AuditFinding`, `CompanyAuditReport`, `AuditReport` a la fin du fichier
  - Notes:
    ```typescript
    interface AuditFinding {
      transaction_id: number;
      wording: string;
      amount: number;
      currency: string;
      transaction_date: string;
      issue: "unimputed" | "missing_document";
      suggested_label_id: number | null;
      suggested_label_name: string | null;
    }

    interface CompanyAuditReport {
      company_id: number;
      company_name: string;
      unimputed_transactions: AuditFinding[];
      missing_documents: AuditFinding[];
      summary: {
        total_unimputed: number;
        total_unimputed_amount: number;
        with_suggestions: number;
        without_suggestions: number;
        total_missing_documents: number;
        total_missing_documents_amount: number;
      };
    }

    interface AuditReport {
      date: string;
      companies: CompanyAuditReport[];
      fix_applied: boolean;
      fix_results: AutoImputeProposal[];
    }
    ```
  - Notes: `AutoImputeProposal` est deja dans `auto-impute.ts`, l'importer ou le re-exporter depuis types.ts si necessaire pour le rapport.

- [ ] Task 2: Creer la logique metier d'audit dans `src/cli/audit.ts`
  - File: `src/cli/audit.ts` (nouveau fichier)
  - Action: Creer `auditForCompany()` qui collecte les findings pour une entreprise
  - Notes:
    - Signature : `async function auditForCompany(client: TiimeClient, companyId: number, companyName: string): Promise<CompanyAuditReport>`
    - Etape 1 : `client.bankTransactions.unimputed()` → pour chaque transaction, `labelSuggestions()` → build `AuditFinding[]` avec issue "unimputed"
    - Etape 2 : `client.bankTransactions.listAll()` → filtrer les transactions imputees (celles avec `imputations.length > 0`) → verifier si `imputations[].documents` est vide → build `AuditFinding[]` avec issue "missing_document"
    - Etape 3 : Calculer le summary (compteurs, montants)
    - Exporter `auditForCompany` et le type `CompanyAuditReport`

- [ ] Task 3: Creer la commande CLI `tiime audit` dans `src/cli/commands/audit.ts`
  - File: `src/cli/commands/audit.ts` (nouveau fichier)
  - Action: Creer la commande `audit` avec args et logique multi-company
  - Notes:
    - Args : `--format` (json/table/csv), `--all-companies` (boolean), `--company` (string, comma-separated IDs ou noms), `--fix` (boolean, default false)
    - Sans `--all-companies` ni `--company` : utilise `getCompanyId()` (entreprise active)
    - Avec `--all-companies` : `TiimeClient({ companyId: 0 }).listCompanies()` puis boucle
    - Avec `--company "A,B"` : `resolveCompanyIds()` puis boucle
    - Pour chaque entreprise : appel `auditForCompany(client, id, name)`
    - Si `--fix` : appel `autoImputeForCompany(client, id, name, { apply: true })` en plus, ajouter les resultats dans `fix_results`
    - Assembler le `AuditReport` final et `output(report, { format })`
    - Pattern identique a `bank auto-impute` dans `bank.ts`

- [ ] Task 4: Ajouter les traductions i18n
  - File: `src/cli/i18n.ts`
  - Action: Ajouter les paires FR→EN dans `descriptionTranslations`
  - Notes:
    ```typescript
    "Audit comptable multi-entreprises": "Multi-company accounting audit",
    "Traiter toutes les entreprises": "Process all companies",
    "Entreprise(s) cible(s) (ID ou nom, séparés par des virgules)": "Target company(ies) (ID or name, comma-separated)",
    "Corriger automatiquement les problèmes résolubles (imputation auto)": "Auto-fix resolvable issues (auto-imputation)",
    ```

- [ ] Task 5: Enregistrer la commande dans la CLI
  - File: `src/cli/index.ts`
  - Action: Importer `auditCommand` et l'ajouter dans `subCommands`
  - Notes:
    - Ajouter `import { auditCommand } from "./commands/audit";`
    - Ajouter `audit: auditCommand` dans `subCommands` (avant `auth` par ordre alphabetique ou apres, selon preference)

- [ ] Task 6: Mettre a jour le skill Claude Code
  - File: `skill/tiime.md`
  - Action: Ajouter la documentation de la commande `audit` et un workflow d'audit dans le skill
  - Notes:
    - Ajouter `tiime audit` dans la section des commandes avec tous les args
    - Ajouter un workflow "Audit comptable" qui decrit le flux :
      1. Lancer `tiime audit --all-companies --format json`
      2. Analyser le rapport JSON
      3. Pour les transactions avec suggestions : proposer `--fix` ou lister
      4. Pour les documents manquants : lister par fournisseur/merchant avec montant et date, indiquer ou recuperer la facture
      5. Prioriser par montant (plus gros montants d'abord)
    - Le skill doit pouvoir etre invoque avec `/tiime audit` ou quand l'utilisateur dit "fais un audit", "qu'est-ce que je dois faire sur ma compta", etc.

- [ ] Task 7: Linter et build
  - Action: `pnpm lint` puis `pnpm build` pour verifier que tout compile
  - Notes: Biome check sur `src/`, tsup build des 2 bundles

### Acceptance Criteria

- [ ] AC 1: Given une entreprise avec des transactions non imputees, when `tiime audit` est execute, then le rapport liste toutes les transactions non imputees avec leur montant, date et suggestions disponibles.
- [ ] AC 2: Given une entreprise avec des transactions imputees sans document, when `tiime audit` est execute, then le rapport liste ces transactions dans la section `missing_documents`.
- [ ] AC 3: Given `--all-companies`, when `tiime audit --all-companies` est execute, then le rapport contient une section par entreprise accessible a l'utilisateur.
- [ ] AC 4: Given `--company "Abbal Consulting,Allial Group"`, when `tiime audit --company "Abbal Consulting,Allial Group"` est execute, then seules ces 2 entreprises sont auditees.
- [ ] AC 5: Given des transactions non imputees avec suggestions, when `tiime audit --fix` est execute, then les imputations sont appliquees et le rapport contient les resultats dans `fix_results`.
- [ ] AC 6: Given `--format json`, when `tiime audit --format json` est execute, then la sortie est un JSON valide parseable par un agent IA.
- [ ] AC 7: Given `--format table`, when `tiime audit --format table` est execute, then la sortie est un tableau ASCII lisible.
- [ ] AC 8: Given aucun flag d'entreprise, when `tiime audit` est execute, then l'entreprise active (via `getCompanyId()`) est auditee.
- [ ] AC 9: Given `tiime audit --help`, when execute, then l'aide s'affiche en francais (defaut) ou anglais (TIIME_LANG=en) sans erreur.
- [ ] AC 10: Given le skill Claude Code, when l'utilisateur demande un audit, then le skill invoque `tiime audit --all-companies --format json` et produit un plan d'action structure avec les elements a recuperer manuellement.

## Additional Context

### Dependencies

- Aucune nouvelle dependance npm — tout est deja present (citty, ofetch, cli-table3).
- Depend des endpoints API existants : `/bank_transactions/unimputed`, `/bank_transactions/{id}/label_suggestions`, `/bank_transactions` (list avec imputations).
- Reutilise `autoImputeForCompany()` et `resolveCompanyIds()` de `src/cli/auto-impute.ts`.
- Reutilise `listCompanies()` de `TiimeClient`.

### Testing Strategy

- Tests unitaires dans `src/cli/audit.test.ts` — mock TiimeClient, verifier structure du `CompanyAuditReport`.
- Test des compteurs summary : mock transactions avec/sans imputations, avec/sans documents, verifier les totaux.
- Test multi-company dans `src/cli/commands/audit.test.ts` — mock `listCompanies()` et `auditForCompany()`, verifier l'assemblage du `AuditReport`.
- Test du mode `--fix` : verifier que `autoImputeForCompany()` est appele avec `{ apply: true }`.
- Smoke test CLI : `tiime audit --help` doit afficher l'aide sans erreur.
- Test manuel sur les 3 entreprises reelles apres implementation.

### Notes

- `BankTransaction.imputations` est `unknown[]` — lors de l'implementation, il faudra inspecter la reponse API reelle pour typer correctement et verifier la presence du champ `documents` dans chaque imputation.
- L'API pourrait exposer des infos supplementaires sur les documents par transaction qu'on ne connait pas encore — a explorer lors de l'implementation. Si `listAll()` ne retourne pas les imputations avec documents, il faudra peut-etre faire un `get()` par transaction (plus lent mais plus complet).
- Le `listAll()` pagine automatiquement — attention aux performances sur des entreprises avec beaucoup de transactions. Considerer un filtre par date (ex: exercice en cours) si c'est trop lent.
- Les 3 entreprises cibles : Abbal Consulting, Allial Group, Allial Immobiliers.
- Le skill doit etre autonome : diagnostic + actions correctives + liste des actions manuelles avec priorite par montant.
