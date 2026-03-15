---
title: 'Money Wrapped — Bilan financier storytelling'
slug: 'money-wrapped'
created: '2026-03-10'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript', 'Node.js HTTP server (node:http)', 'Tailwind CSS v3 (CDN)', 'Chart.js v4 (CDN)', 'Vanilla JS', 'Google Fonts Inter']
files_to_modify: ['packages/tiime-cli/src/cli/dashboard/server.ts', 'packages/tiime-cli/src/cli/dashboard/wrapped.ts', 'packages/tiime-cli/src/cli/dashboard/html.ts']
code_patterns: ['string-based URL routing in handleApi()', 'exported HTML string constant per page', 'Promise.all for parallel SDK calls', 'server-side aggregation → JSON → client-side rendering', 'fmt/fmtCompact/fmtDate formatting helpers', 'Tailwind surface color palette + .card/.badge classes', 'Chart.js destroy-before-recreate pattern']
test_patterns: ['no existing dashboard tests', 'manual testing via browser + curl']
---

# Tech-Spec: Money Wrapped — Bilan financier storytelling

**Created:** 2026-03-10

## Overview

### Problem Statement

Le dashboard actuel donne une vue temps réel de la situation financière (trésorerie, factures impayées, cashflow mensuel), mais il n'existe aucun récapitulatif annuel ni historique. L'utilisateur n'a pas de vision "chemin parcouru" depuis le début de son activité, ni de stats fun et engageantes sur son argent.

### Solution

Ajouter une nouvelle page `/wrapped` dans le serveur dashboard existant, avec une expérience storytelling slide-by-slide (style Spotify Wrapped) présentant les stats financières clés par année civile + un récap "all-time" depuis le début de l'activité.

### Scope

**In Scope:**
- Nouvelle route HTML `/wrapped` dans le serveur dashboard existant
- Nouvel endpoint API `GET /api/company/{id}/wrapped` agrégeant les données
- Interface storytelling slide-by-slide avec transitions CSS
- Stats par année civile + total "all-time" (depuis la première transaction)
- Navigation entre les slides (flèches, clavier, swipe)
- Sélecteur d'année
- Stats incluses :
  - CA total généré (all-time + par année)
  - Top 5 clients par CA
  - Top catégories de dépenses (labels/wordings les plus fréquents)
  - Mois le plus rentable vs le moins rentable
  - Plus grosse facture émise (montant + client)
  - Nombre de factures émises + montant moyen
  - Ratio encaissements / décaissements
  - Évolution du CA année par année (courbe)
  - Nombre total de transactions traitées

**Out of Scope:**
- Export/partage (PDF, image, lien public)
- Comparaison multi-sociétés sur la même page
- Données de notes de frais (expenses)
- Nouvelles méthodes SDK (on réutilise `listAll` avec filtres de date existants)
- Tests unitaires (pas de tests existants sur le dashboard)

## Context for Development

### Codebase Patterns

**Routing serveur (`server.ts`) :**
- Serveur HTTP Node.js minimal (`node:http`), bind sur `127.0.0.1:3141`
- `handleRequest()` : URLs `/api/*` → `handleApi()` (JSON), sinon → HTML statique
- `handleApi()` : split URL en `parts`, routing par `if/else` sur `parts[0]`, `parts[2]`, etc.
- Pattern de réponse : `json(res, data)` pour JSON, `html(res, content)` pour HTML
- `createClient(companyId)` pour instancier le SDK par entreprise

**Point d'insertion HTML (ligne ~206 de server.ts) :**
```typescript
// Avant le fallback dashboardHtml, ajouter :
if (url === "/wrapped" || url.startsWith("/wrapped?")) {
  return html(res, wrappedHtml);
}
```

**Point d'insertion API (après le bloc "invoices" ~ligne 185 de server.ts) :**
```typescript
if (resource === "wrapped") {
  // ... agrégation wrapped
  return json(res, wrappedData);
}
```

**Frontend HTML (`html.ts` — pattern à reproduire) :**
- Template literal exporté : `export const dashboardHtml = \`...\``
- CDNs : Google Fonts Inter, Tailwind CDN + config inline, Chart.js v4
- Custom CSS : palette `surface` (50-950), classes `.card`, `.badge`, `.fade-in`, `.skeleton`
- JS inline : `fetch('/api/...')` → parse JSON → render via `document.getElementById().innerHTML`
- Helpers réutilisables : `fmt(amount)`, `fmtCompact(amount)`, `fmtDate(date)`, `isOverdue(date)`
- État : variables globales (`companies`, `currentCompanyId`), dropdown company selector
- Charts : `new Chart(ctx, config)`, toujours `destroy()` avant re-create

**SDK data fetching (pattern `overview` à reproduire) :**
- `Promise.all([...])` pour paralléliser les appels SDK
- Agrégation côté serveur (reduce, filter, group by month)
- Retour JSON structuré par section

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `packages/tiime-cli/src/cli/dashboard/server.ts` | Serveur HTTP + routing — ajouter route `/wrapped` HTML + endpoint API `/api/company/{id}/wrapped` |
| `packages/tiime-cli/src/cli/dashboard/html.ts` | Template HTML dashboard — pattern à reproduire + ajouter lien vers `/wrapped` |
| `packages/tiime-cli/src/cli/dashboard/wrapped.ts` | **(NOUVEAU)** Template HTML de la page Wrapped storytelling |
| `packages/tiime-cli/src/cli/commands/dashboard.ts` | Commande CLI — pas de modification |
| `packages/tiime-sdk/src/resources/bank-transactions.ts` | `listAll({ from, to })` — filtrage par date, `amount` signé (+/-) |
| `packages/tiime-sdk/src/resources/invoices.ts` | `listAll()` — toutes les factures, filtrage par `emission_date` côté serveur |
| `packages/tiime-sdk/src/resources/company.ts` | `get()` — `registration_date` / `activity_start_date` pour "depuis le début" |
| `packages/tiime-sdk/src/types.ts` | Interfaces : `Invoice`, `BankTransaction`, `Company` |

### Technical Decisions

1. **Nouveau fichier `wrapped.ts`** — Le HTML wrapped est un fichier séparé (`export const wrappedHtml`), pas ajouté dans `html.ts` (déjà 800+ lignes). Même pattern architectural.

2. **Agrégation 100% serveur** — L'endpoint `/api/company/{id}/wrapped` fait TOUS les calculs et renvoie un JSON structuré. Le frontend ne fait que du rendu.

3. **Pas de nouvelle dépendance** — Réutiliser Tailwind CSS + Chart.js via CDN existants.

4. **Filtrage transactions par année** — Utiliser `bankTransactions.listAll({ from: '2025-01-01', to: '2025-12-31' })` pour chaque année. Pour "all-time", charger sans filtre.

5. **Catégorisation des dépenses** — Prioriser `imputations[0].label.name` si présent, sinon fallback sur `wording`. Nettoyer les wordings (trim, lowercase, regrouper les variations).

6. **Date de référence** — `transaction_date || realization_date` pour les transactions, `emission_date` pour les factures.

7. **Storytelling slide-by-slide** — Slides plein écran avec transitions CSS (`transform: translateX`), navigation clavier (←/→), boutons, indicateur de progression. Gradient backgrounds vibrantes par slide.

8. **Lien depuis le dashboard** — Bouton "Mon Wrapped" dans le header du dashboard existant.

## Implementation Plan

### Tasks

- [x] **Task 1 : Endpoint API `/api/company/{id}/wrapped`**
  - File: `packages/tiime-cli/src/cli/dashboard/server.ts`
  - Action: Ajouter un bloc `if (resource === "wrapped")` dans `handleApi()`, après le bloc `invoices` (~ligne 185)
  - Détail de l'agrégation :
    1. Fetch en parallèle (`Promise.all`) : `client.company.get()`, `client.invoices.listAll()`, `client.bankTransactions.listAll()`, `client.bankAccounts.list(true)`
    2. Extraire `registration_date` ou `activity_start_date` de company pour calculer l'ancienneté
    3. Déterminer les années disponibles : parcourir toutes les transactions et factures, extraire les années uniques (`transaction_date.slice(0,4)` / `emission_date.slice(0,4)`)
    4. Pour chaque année + "all-time", calculer :
       - `revenue_ttc` / `revenue_ht` : somme des factures (status !== "draft") par `emission_date`
       - `invoices_count` : nombre de factures émises
       - `avg_invoice` : montant moyen par facture
       - `biggest_invoice` : `{ amount, client_name, number, date }` — facture max par `total_including_taxes`
       - `top_clients` : top 5 clients par CA TTC (grouper factures par `client_name`, sommer `total_including_taxes`, trier desc, prendre 5)
       - `top_expenses` : top 5 catégories de dépenses (transactions `amount < 0`, grouper par `imputations[0]?.label?.name || wording`, sommer `Math.abs(amount)`, trier desc, prendre 5)
       - `best_month` / `worst_month` : mois avec le plus/moins de net cashflow (`inflows + outflows` par mois `YYYY-MM`)
       - `total_inflows` / `total_outflows` : somme des transactions positives / négatives
       - `inflow_outflow_ratio` : `total_inflows / Math.abs(total_outflows)`
       - `transactions_count` : nombre total de transactions
       - `monthly` : tableau `[{ month, inflows, outflows }]` pour le graphe
    5. Retourner la structure JSON :
    ```json
    {
      "company": { "name", "registration_date", "years_active" },
      "available_years": [2024, 2025, 2026],
      "all_time": { /* stats complètes */ },
      "years": {
        "2025": { /* stats de l'année */ },
        "2024": { /* stats de l'année */ }
      }
    }
    ```

- [x] **Task 2 : Page HTML Wrapped (`wrapped.ts`)**
  - File: `packages/tiime-cli/src/cli/dashboard/wrapped.ts` **(NOUVEAU)**
  - Action: Créer le fichier avec `export const wrappedHtml = \`...\``
  - Structure HTML/CSS/JS :
    1. **Head** : mêmes CDNs que `html.ts` (Google Fonts Inter, Tailwind CDN + config, Chart.js v4)
    2. **CSS custom** :
       - Slides plein écran : `width: 100vw; height: 100vh; position: absolute; transition: transform 0.5s ease`
       - Gradient backgrounds par slide (couleurs vibrantes : violet→bleu, bleu→cyan, orange→rose, etc.)
       - Texte centré, grande typographie (`text-4xl` à `text-8xl` pour les chiffres)
       - Animations d'entrée : `@keyframes slideUp`, `@keyframes countUp`, `@keyframes fadeIn`
       - Indicateur de progression en bas (dots ou barre)
       - Classes `.slide`, `.slide-active`, `.slide-number`, `.slide-label`, `.slide-chart`
    3. **Slides (séquence storytelling)** :
       - **Slide 0 — Intro** : "Ton année {year} en chiffres" / "Ton parcours depuis {registration_date}" avec le nom de l'entreprise, animation de démarrage
       - **Slide 1 — CA total** : gros chiffre animé (countUp), comparaison avec l'année précédente si disponible
       - **Slide 2 — Factures** : nombre émises + montant moyen, mini-animation de factures qui défilent
       - **Slide 3 — Plus grosse facture** : montant + nom du client, effet "highlight"
       - **Slide 4 — Top clients** : bar chart horizontal des 5 meilleurs clients par CA
       - **Slide 5 — Cashflow** : ratio encaissements/décaissements, doughnut chart
       - **Slide 6 — Meilleur mois** : le mois le plus rentable, avec montant net
       - **Slide 7 — Top dépenses** : top 5 catégories, bar chart ou liste stylisée
       - **Slide 8 — Transactions** : nombre total traité, mini-stat fun ("X transactions par jour en moyenne")
       - **Slide 9 — Évolution** : courbe Chart.js du CA par année (all-time uniquement) ou par mois (vue année)
       - **Slide 10 — Outro** : résumé final ("X ans d'activité, Y€ de CA, Z clients"), lien retour dashboard
    4. **JS inline** :
       - Company selector (réutiliser le pattern de `html.ts` : fetch `/api/companies`, dropdown)
       - Year selector : dropdown des années disponibles + option "All-time"
       - `fetch('/api/company/{id}/wrapped')` → parse JSON → `renderSlides(data, selectedYear)`
       - Navigation : `currentSlide` index, fonctions `nextSlide()` / `prevSlide()` avec `transform: translateX(-${currentSlide * 100}vw)`
       - Event listeners : clavier (`ArrowLeft`/`ArrowRight`/`Space`), boutons (← →), touch (`touchstart`/`touchend` pour swipe)
       - Animations : `countUp(element, target, duration)` pour animer les chiffres de 0 à N
       - Chart.js : bar chart (top clients), doughnut (ratio in/out), line chart (évolution)
       - Helpers : réutiliser `fmt()`, `fmtCompact()` du pattern `html.ts`
    5. **Responsive** : slides lisibles sur mobile (texte adaptatif, charts redimensionnés)

- [x] **Task 3 : Route HTML `/wrapped` dans le serveur**
  - File: `packages/tiime-cli/src/cli/dashboard/server.ts`
  - Action:
    1. Ajouter `import { wrappedHtml } from "./wrapped";` en haut du fichier
    2. Dans `handleRequest()`, avant le fallback `html(res, dashboardHtml)` (~ligne 206), ajouter :
       ```typescript
       if (url === "/wrapped" || url.startsWith("/wrapped?")) {
         return html(res, wrappedHtml);
       }
       ```

- [x] **Task 4 : Lien vers Wrapped dans le dashboard**
  - File: `packages/tiime-cli/src/cli/dashboard/html.ts`
  - Action: Dans le header/nav du dashboard, ajouter un bouton/lien "Mon Wrapped" pointant vers `/wrapped`
  - Notes: Chercher le header existant (probablement un `<header>` ou `<nav>` avec le titre "Dashboard Tiime"), ajouter un `<a href="/wrapped" class="...">Mon Wrapped</a>` stylisé avec un badge ou icône distinctif

### Acceptance Criteria

- [x] **AC 1** : Given le serveur dashboard lancé, when je navigue vers `http://localhost:3141/wrapped`, then la page Wrapped s'affiche avec un écran de chargement puis les slides
- [x] **AC 2** : Given la page Wrapped chargée, when je clique sur les flèches ou j'utilise ←/→ au clavier, then les slides défilent avec une transition fluide
- [x] **AC 3** : Given la page Wrapped chargée avec des données, when je sélectionne une année dans le dropdown, then les slides se mettent à jour avec les stats de cette année
- [x] **AC 4** : Given la page Wrapped en mode "All-time", when je regarde le slide d'intro, then il affiche la date de création de l'entreprise et le nombre d'années d'activité
- [x] **AC 5** : Given la page Wrapped avec des factures, when je regarde le slide "Top clients", then un bar chart horizontal montre les 5 clients avec le plus de CA, triés par montant décroissant
- [x] **AC 6** : Given la page Wrapped avec des transactions, when je regarde le slide "Top dépenses", then les 5 catégories de dépenses les plus importantes sont affichées (par label d'imputation ou wording)
- [x] **AC 7** : Given le endpoint API `/api/company/{id}/wrapped`, when je le requête avec curl, then il retourne un JSON avec `company`, `available_years`, `all_time` et `years` contenant toutes les stats calculées
- [x] **AC 8** : Given la page dashboard existante, when je cherche un lien vers Wrapped, then un bouton "Mon Wrapped" est visible dans le header et mène vers `/wrapped`
- [x] **AC 9** : Given la page Wrapped sur mobile (viewport < 768px), when je swipe vers la gauche/droite, then les slides changent (navigation tactile)
- [x] **AC 10** : Given une entreprise sans aucune transaction ni facture, when je charge le Wrapped, then un message "Pas encore de données" s'affiche au lieu de slides vides

## Additional Context

### Dependencies

- Aucune nouvelle dépendance npm
- Réutilise les ressources SDK existantes : `bankTransactions.listAll()`, `invoices.listAll()`, `company.get()`, `bankAccounts.list()`
- CDN existants : Tailwind CSS, Chart.js v4, Google Fonts Inter
- Dépend du serveur dashboard existant (même port, même process)

### Testing Strategy

- **Test API** : `curl http://localhost:3141/api/company/50824/wrapped | jq` — vérifier la structure JSON, les montants cohérents
- **Test visuel** : `tiime dashboard` → naviguer vers `/wrapped` → parcourir tous les slides
- **Test navigation** : vérifier clavier (←/→/Space), boutons, swipe tactile (DevTools mobile)
- **Test année** : switcher entre années et vérifier que les chiffres changent
- **Test edge case** : tester avec une entreprise sans données (message "Pas de données")
- **Cross-check** : comparer le CA total du Wrapped avec le CA affiché sur le dashboard principal

### Notes

- `BankTransaction.amount` est signé : positif = encaissement, négatif = décaissement
- `BankTransaction.beneficiary` et `merchant` peuvent être `null` — toujours fallback sur `wording`
- `Company.registration_date` et `activity_start_date` permettent de calculer "X ans d'activité"
- `Invoice.client_name` est directement disponible (pas besoin de join avec clients)
- Chart.js instances doivent être `destroy()` avant re-create (pattern existant dans html.ts)
- Le serveur ne bind que sur `127.0.0.1` — pas de risque de sécurité réseau
- Pour le nettoyage des wordings (top dépenses) : `trim()`, `toLowerCase()`, et éventuellement regrouper les préfixes communs (ex: "CARTE" → supprimer)
- Les slides doivent être générés dynamiquement en JS (pas de HTML statique pour chaque slide) pour s'adapter aux données disponibles
- Si une stat est vide (ex: pas de factures), le slide correspondant est masqué plutôt qu'affiché vide
