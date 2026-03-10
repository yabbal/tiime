export const dashboardHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tiime — Dashboard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        surface: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
      },
    }
  }
}
</script>
<style>
  * { box-sizing: border-box; }
  body { background: #f8fafc; color: #0f172a; font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04); transition: box-shadow 0.2s, border-color 0.2s; }
  .card:hover { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06); }
  .kpi-card { position: relative; overflow: hidden; }
  .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 1rem 1rem 0 0; }
  .kpi-treasury::before { background: linear-gradient(90deg, #3b82f6, #06b6d4); }
  .kpi-unpaid::before { background: linear-gradient(90deg, #f97316, #ef4444); }
  .kpi-unimputed::before { background: linear-gradient(90deg, #eab308, #f59e0b); }
  .kpi-quotations::before { background: linear-gradient(90deg, #8b5cf6, #a855f7); }
  .badge { display: inline-flex; align-items: center; gap: 0.25rem; border-radius: 9999px; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.01em; }
  .badge-green { background: #f0fdf4; color: #15803d; }
  .badge-red { background: #fef2f2; color: #dc2626; }
  .badge-yellow { background: #fefce8; color: #a16207; }
  .badge-blue { background: #eff6ff; color: #2563eb; }
  .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 0.5rem; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .fade-in { animation: fadeIn 0.4s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .stagger-1 { animation-delay: 0.05s; }
  .stagger-2 { animation-delay: 0.1s; }
  .stagger-3 { animation-delay: 0.15s; }
  .stagger-4 { animation-delay: 0.2s; }
  select { background: #fff; border: 1px solid #e2e8f0; color: #0f172a; border-radius: 0.5rem; padding: 0.5rem 2rem 0.5rem 0.75rem; font-size: 0.875rem; font-weight: 500; outline: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.25rem; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; }
  select:hover { border-color: #cbd5e1; }
  select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1); }
  .table-row { transition: background 0.1s; }
  .table-row:hover { background: #f8fafc; }
  .positive { color: #059669; }
  .negative { color: #dc2626; }
  .icon-box { display: flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; flex-shrink: 0; }
  .icon-treasury { background: #eff6ff; color: #3b82f6; }
  .icon-unpaid { background: #fef2f2; color: #ef4444; }
  .icon-unimputed { background: #fefce8; color: #eab308; }
  .icon-quotations { background: #f5f3ff; color: #8b5cf6; }
  .refresh-spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
</head>
<body class="min-h-screen">

<!-- Top bar -->
<div class="border-b border-surface-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
  <div class="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
      </div>
      <h1 class="text-lg font-bold tracking-tight text-surface-900">Tiime</h1>
      <span class="text-surface-300 font-light">|</span>
      <span class="text-sm font-medium text-surface-500" id="subtitle">Chargement...</span>
    </div>
    <div class="flex items-center gap-3">
      <select id="company-select" onchange="switchCompany(this.value)" class="min-w-[220px]">
        <option value="">Chargement...</option>
      </select>
      <button onclick="refreshData()" id="refresh-btn" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-200 hover:bg-surface-50 transition-all text-sm font-medium text-surface-700 hover:text-surface-900">
        <svg id="refresh-icon" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        <span id="refresh-text">Actualiser</span>
      </button>
    </div>
  </div>
</div>

<div id="app" class="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">

  <!-- Loading state -->
  <div id="loading" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="card p-6"><div class="skeleton h-4 w-20 mb-4"></div><div class="skeleton h-9 w-36 mb-2"></div><div class="skeleton h-3 w-24"></div></div>
      <div class="card p-6"><div class="skeleton h-4 w-20 mb-4"></div><div class="skeleton h-9 w-36 mb-2"></div><div class="skeleton h-3 w-24"></div></div>
      <div class="card p-6"><div class="skeleton h-4 w-20 mb-4"></div><div class="skeleton h-9 w-36 mb-2"></div><div class="skeleton h-3 w-24"></div></div>
      <div class="card p-6"><div class="skeleton h-4 w-20 mb-4"></div><div class="skeleton h-9 w-36 mb-2"></div><div class="skeleton h-3 w-24"></div></div>
    </div>
  </div>

  <!-- Dashboard content -->
  <div id="content" class="hidden space-y-6">

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="card kpi-card kpi-treasury p-6 fade-in stagger-1" style="animation-fill-mode:both">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-medium text-surface-500">Tr\u00e9sorerie</p>
          <div class="icon-box icon-treasury">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg>
          </div>
        </div>
        <p class="text-3xl font-bold tracking-tight" id="kpi-treasury">-</p>
        <p class="text-sm text-surface-400 mt-1.5" id="kpi-treasury-detail">-</p>
      </div>

      <div class="card kpi-card kpi-unpaid p-6 fade-in stagger-2" style="animation-fill-mode:both">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-medium text-surface-500">Factures impay\u00e9es</p>
          <div class="icon-box icon-unpaid">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          </div>
        </div>
        <p class="text-3xl font-bold tracking-tight" id="kpi-unpaid">-</p>
        <p class="text-sm text-surface-400 mt-1.5" id="kpi-unpaid-detail">-</p>
      </div>

      <div class="card kpi-card kpi-unimputed p-6 fade-in stagger-3" style="animation-fill-mode:both">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-medium text-surface-500">Non imput\u00e9</p>
          <div class="icon-box icon-unimputed">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
          </div>
        </div>
        <p class="text-3xl font-bold tracking-tight" id="kpi-unimputed">-</p>
        <p class="text-sm text-surface-400 mt-1.5" id="kpi-unimputed-detail">-</p>
      </div>

      <div class="card kpi-card kpi-quotations p-6 fade-in stagger-4" style="animation-fill-mode:both">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-medium text-surface-500">Devis en cours</p>
          <div class="icon-box icon-quotations">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
          </div>
        </div>
        <p class="text-3xl font-bold tracking-tight" id="kpi-quotations">-</p>
        <p class="text-sm text-surface-400 mt-1.5" id="kpi-quotations-detail">-</p>
      </div>
    </div>

    <!-- Global Metrics -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div class="card p-5">
        <p class="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">CA total TTC</p>
        <p class="text-xl font-bold text-surface-900" id="kpi-revenue-ttc">-</p>
      </div>
      <div class="card p-5">
        <p class="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">CA total HT</p>
        <p class="text-xl font-bold text-surface-900" id="kpi-revenue-ht">-</p>
      </div>
      <div class="card p-5">
        <p class="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Factures \u00e9mises</p>
        <p class="text-xl font-bold text-surface-900" id="kpi-total-invoices">-</p>
      </div>
      <div class="card p-5">
        <p class="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Encaissements</p>
        <p class="text-xl font-bold positive" id="kpi-inflows">-</p>
      </div>
      <div class="card p-5">
        <p class="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">D\u00e9caissements</p>
        <p class="text-xl font-bold negative" id="kpi-outflows">-</p>
      </div>
      <div class="card p-5">
        <p class="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Flux net</p>
        <p class="text-xl font-bold" id="kpi-net-cashflow">-</p>
      </div>
    </div>

    <!-- Cashflow Chart -->
    <div class="card p-6">
      <h3 class="text-sm font-semibold text-surface-800 mb-1">Flux de tr\u00e9sorerie</h3>
      <p class="text-xs text-surface-400 mb-5">Encaissements et d\u00e9caissements mensuels (12 derniers mois)</p>
      <div class="h-[280px]">
        <canvas id="chart-cashflow"></canvas>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div class="card p-6 lg:col-span-2">
        <h3 class="text-sm font-semibold text-surface-800 mb-1">R\u00e9partition par compte</h3>
        <p class="text-xs text-surface-400 mb-5">Soldes des comptes bancaires actifs</p>
        <div class="h-[260px] flex items-center justify-center">
          <canvas id="chart-accounts"></canvas>
        </div>
      </div>
      <div class="card p-6 lg:col-span-3">
        <h3 class="text-sm font-semibold text-surface-800 mb-1">Factures impay\u00e9es par client</h3>
        <p class="text-xs text-surface-400 mb-5">Montants en attente de r\u00e8glement</p>
        <div class="h-[260px] flex items-center justify-center" id="chart-unpaid-container">
          <canvas id="chart-unpaid"></canvas>
        </div>
      </div>
    </div>

    <!-- Bank Accounts Table -->
    <div class="card overflow-hidden">
      <div class="px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-surface-800">Comptes bancaires</h3>
          <p class="text-xs text-surface-400 mt-0.5">D\u00e9tail des soldes par compte</p>
        </div>
        <span class="badge badge-blue" id="accounts-count">-</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-y border-surface-100 bg-surface-50/50">
              <th class="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Compte</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Banque</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">IBAN</th>
              <th class="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Solde</th>
              <th class="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Mise \u00e0 jour</th>
            </tr>
          </thead>
          <tbody id="accounts-table" class="divide-y divide-surface-100"></tbody>
        </table>
      </div>
    </div>

    <!-- Unpaid Invoices Table -->
    <div class="card overflow-hidden" id="unpaid-section">
      <div class="px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-surface-800">Factures impay\u00e9es</h3>
          <p class="text-xs text-surface-400 mt-0.5">Factures en attente de paiement</p>
        </div>
        <span class="badge badge-red" id="unpaid-count">-</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-y border-surface-100 bg-surface-50/50">
              <th class="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Num\u00e9ro</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Client</th>
              <th class="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Montant TTC</th>
              <th class="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">\u00c9mission</th>
              <th class="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">\u00c9ch\u00e9ance</th>
              <th class="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody id="unpaid-table" class="divide-y divide-surface-100"></tbody>
        </table>
      </div>
    </div>

    <!-- Multi-company overview -->
    <div id="multi-company-section" class="hidden">
      <div class="card overflow-hidden">
        <div class="px-6 pt-6 pb-4">
          <h3 class="text-sm font-semibold text-surface-800">Vue multi-soci\u00e9t\u00e9s</h3>
          <p class="text-xs text-surface-400 mt-0.5">Comparatif de toutes vos soci\u00e9t\u00e9s</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-y border-surface-100 bg-surface-50/50">
                <th class="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Soci\u00e9t\u00e9</th>
                <th class="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Tr\u00e9sorerie</th>
                <th class="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Impay\u00e9</th>
                <th class="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Non imput\u00e9</th>
                <th class="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Clients</th>
              </tr>
            </thead>
            <tbody id="multi-company-table" class="divide-y divide-surface-100"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Error state -->
  <div id="error" class="hidden">
    <div class="card p-12 text-center max-w-md mx-auto mt-12">
      <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/></svg>
      </div>
      <p class="text-surface-900 font-semibold mb-1">Erreur de chargement</p>
      <p class="text-sm text-surface-500 mb-6" id="error-message"></p>
      <button onclick="refreshData()" class="px-5 py-2.5 rounded-lg bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition-colors">
        R\u00e9essayer
      </button>
    </div>
  </div>
</div>

<script>
const fmt = (amount, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);

const fmtCompact = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(amount);

const fmtDate = (dateStr) => {
  if (!dateStr) return '\\u2014';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

let companies = [];
let currentCompanyId = null;
let chartAccounts = null;
let chartUnpaid = null;
let chartCashflow = null;

Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

const chartColors = [
  '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#f97316', '#14b8a6',
];

async function init() {
  try {
    const res = await fetch('/api/companies');
    companies = await res.json();

    const select = document.getElementById('company-select');
    select.innerHTML = companies.length > 1
      ? '<option value="all">Toutes les soci\\u00e9t\\u00e9s (' + companies.length + ')</option>' + companies.map(c =>
          '<option value="' + c.id + '">' + c.name + '</option>'
        ).join('')
      : companies.map(c =>
          '<option value="' + c.id + '">' + c.name + '</option>'
        ).join('');

    currentCompanyId = companies.length > 1 ? 'all' : companies[0]?.id;
    select.value = currentCompanyId;

    await refreshData();
  } catch (e) {
    showError(e.message);
  }
}

async function switchCompany(value) {
  currentCompanyId = value === 'all' ? 'all' : Number(value);
  await refreshData();
}

async function refreshData() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('content').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');

  const icon = document.getElementById('refresh-icon');
  const text = document.getElementById('refresh-text');
  icon.classList.add('refresh-spin');
  text.textContent = 'Chargement...';

  try {
    if (currentCompanyId === 'all') {
      await loadAllCompanies();
    } else {
      await loadCompany(currentCompanyId);
      document.getElementById('multi-company-section').classList.add('hidden');
    }

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');
  } catch (e) {
    showError(e.message);
  } finally {
    icon.classList.remove('refresh-spin');
    text.textContent = 'Actualiser';
  }
}

async function loadCompany(companyId) {
  const res = await fetch('/api/company/' + companyId + '/overview');
  if (!res.ok) throw new Error('Erreur lors du chargement des donn\\u00e9es');
  const data = await res.json();
  renderDashboard(data);
}

async function loadAllCompanies() {
  const results = await Promise.all(
    companies.map(async (c) => {
      const res = await fetch('/api/company/' + c.id + '/overview');
      const data = await res.json();
      return { company: c, data };
    })
  );

  const aggregated = {
    treasury: {
      total_balance: results.reduce((s, r) => s + r.data.treasury.total_balance, 0),
      accounts: results.flatMap(r =>
        r.data.treasury.accounts.map(a => ({ ...a, company: r.company.name }))
      ),
    },
    invoices: {
      drafts: results.reduce((s, r) => s + r.data.invoices.drafts, 0),
      unpaid_count: results.reduce((s, r) => s + r.data.invoices.unpaid_count, 0),
      unpaid_total: results.reduce((s, r) => s + r.data.invoices.unpaid_total, 0),
      unpaid: results.flatMap(r =>
        r.data.invoices.unpaid.map(i => ({ ...i, company: r.company.name }))
      ),
    },
    quotations: {
      pending_count: results.reduce((s, r) => s + r.data.quotations.pending_count, 0),
      pending_total: results.reduce((s, r) => s + r.data.quotations.pending_total, 0),
    },
    bank: {
      unimputed_count: results.reduce((s, r) => s + r.data.bank.unimputed_count, 0),
    },
    clients: {
      total: results.reduce((s, r) => s + r.data.clients.total, 0),
    },
    global: {
      total_invoices: results.reduce((s, r) => s + (r.data.global?.total_invoices || 0), 0),
      total_revenue_ttc: results.reduce((s, r) => s + (r.data.global?.total_revenue_ttc || 0), 0),
      total_revenue_ht: results.reduce((s, r) => s + (r.data.global?.total_revenue_ht || 0), 0),
      total_transactions: results.reduce((s, r) => s + (r.data.global?.total_transactions || 0), 0),
      total_inflows: results.reduce((s, r) => s + (r.data.global?.total_inflows || 0), 0),
      total_outflows: results.reduce((s, r) => s + (r.data.global?.total_outflows || 0), 0),
      net_cashflow: results.reduce((s, r) => s + (r.data.global?.net_cashflow || 0), 0),
      monthly: (() => {
        const merged = {};
        for (const r of results) {
          for (const m of (r.data.global?.monthly || [])) {
            if (!merged[m.month]) merged[m.month] = { month: m.month, inflows: 0, outflows: 0 };
            merged[m.month].inflows += m.inflows;
            merged[m.month].outflows += m.outflows;
          }
        }
        return Object.values(merged).sort((a, b) => a.month.localeCompare(b.month));
      })(),
    },
  };

  renderDashboard(aggregated);

  // Multi-company table
  const section = document.getElementById('multi-company-section');
  const tbody = document.getElementById('multi-company-table');
  tbody.innerHTML = results.map(r => {
    const d = r.data;
    const balClass = d.treasury.total_balance >= 0 ? 'positive' : 'negative';
    return '<tr class="table-row">'
      + '<td class="px-6 py-4"><span class="font-semibold text-surface-900">' + r.company.name + '</span></td>'
      + '<td class="px-6 py-4 text-right font-semibold ' + balClass + '">' + fmt(d.treasury.total_balance) + '</td>'
      + '<td class="px-6 py-4 text-right">' + (d.invoices.unpaid_count > 0
          ? '<span class="badge badge-red">' + d.invoices.unpaid_count + ' &middot; ' + fmt(d.invoices.unpaid_total) + '</span>'
          : '<span class="badge badge-green">Aucune</span>') + '</td>'
      + '<td class="px-6 py-4 text-right">' + (d.bank.unimputed_count > 0
          ? '<span class="badge badge-yellow">' + d.bank.unimputed_count + ' transaction(s)</span>'
          : '<span class="badge badge-green">0</span>') + '</td>'
      + '<td class="px-6 py-4 text-right text-surface-600">' + d.clients.total + '</td>'
      + '</tr>';
  }).join('');

  // Total row
  const agg = aggregated;
  tbody.innerHTML += '<tr class="bg-surface-50 font-semibold">'
    + '<td class="px-6 py-4 text-surface-900">Total</td>'
    + '<td class="px-6 py-4 text-right ' + (agg.treasury.total_balance >= 0 ? 'positive' : 'negative') + '">' + fmt(agg.treasury.total_balance) + '</td>'
    + '<td class="px-6 py-4 text-right text-surface-700">' + fmt(agg.invoices.unpaid_total) + '</td>'
    + '<td class="px-6 py-4 text-right text-surface-700">' + agg.bank.unimputed_count + '</td>'
    + '<td class="px-6 py-4 text-right text-surface-700">' + agg.clients.total + '</td>'
    + '</tr>';

  section.classList.remove('hidden');
}

function renderDashboard(data) {
  const companyName = currentCompanyId === 'all'
    ? 'Toutes les soci\\u00e9t\\u00e9s'
    : companies.find(c => c.id === currentCompanyId)?.name;
  document.getElementById('subtitle').textContent = companyName;

  // KPI Cards
  const balClass = data.treasury.total_balance >= 0 ? 'positive' : 'negative';
  document.getElementById('kpi-treasury').innerHTML =
    '<span class="' + balClass + '">' + fmt(data.treasury.total_balance) + '</span>';
  document.getElementById('kpi-treasury-detail').textContent =
    data.treasury.accounts.length + ' compte(s) actif(s)';

  document.getElementById('kpi-unpaid').innerHTML =
    data.invoices.unpaid_total > 0
      ? '<span class="text-red-600">' + fmt(data.invoices.unpaid_total) + '</span>'
      : '<span class="text-emerald-600">' + fmt(0) + '</span>';
  document.getElementById('kpi-unpaid-detail').textContent =
    data.invoices.unpaid_count + ' facture(s) en attente';

  const unimputedEl = document.getElementById('kpi-unimputed');
  unimputedEl.innerHTML = data.bank.unimputed_count > 0
    ? '<span class="text-amber-600">' + data.bank.unimputed_count + '</span>'
    : '<span class="text-emerald-600">0</span>';
  document.getElementById('kpi-unimputed-detail').textContent = 'transaction(s) \\u00e0 cat\\u00e9goriser';

  document.getElementById('kpi-quotations').innerHTML =
    '<span class="text-violet-600">' + data.quotations.pending_count + '</span>';
  document.getElementById('kpi-quotations-detail').textContent = fmt(data.quotations.pending_total) + ' en cours';

  // Counts badges
  document.getElementById('accounts-count').textContent = data.treasury.accounts.length + ' comptes';
  document.getElementById('unpaid-count').textContent = data.invoices.unpaid_count + ' facture(s)';

  // Accounts table
  const accountsTbody = document.getElementById('accounts-table');
  accountsTbody.innerHTML = data.treasury.accounts.map(a => {
    const balColor = a.balance >= 0 ? 'positive' : 'negative';
    const displayName = a.company ? a.name : a.name;
    const companyTag = a.company ? '<span class="text-xs text-surface-400 block mt-0.5">' + a.company + '</span>' : '';
    return '<tr class="table-row">'
      + '<td class="px-6 py-4"><span class="font-medium text-surface-900">' + displayName + '</span>' + companyTag + '</td>'
      + '<td class="px-6 py-4 text-surface-500">' + a.bank + '</td>'
      + '<td class="px-6 py-4 text-surface-400 font-mono text-xs tracking-tight">' + (a.iban || '\\u2014') + '</td>'
      + '<td class="px-6 py-4 text-right font-semibold ' + balColor + '">' + fmt(a.balance, a.currency || 'EUR') + '</td>'
      + '<td class="px-6 py-4 text-right text-surface-400 text-xs">' + fmtDate(a.balance_date) + '</td>'
      + '</tr>';
  }).join('');

  // Unpaid invoices table
  const unpaidTbody = document.getElementById('unpaid-table');
  if (data.invoices.unpaid.length === 0) {
    unpaidTbody.innerHTML = '<tr><td colspan="6" class="px-6 py-12 text-center text-surface-400">'
      + '<div class="flex flex-col items-center gap-2">'
      + '<svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
      + '<span>Aucune facture impay\\u00e9e</span></div></td></tr>';
  } else {
    unpaidTbody.innerHTML = data.invoices.unpaid
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .map(i => {
        const overdue = isOverdue(i.due_date);
        const days = daysUntil(i.due_date);
        const statusBadge = overdue
          ? '<span class="badge badge-red"><span class="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>En retard' + (days !== null ? ' (' + Math.abs(days) + 'j)' : '') + '</span>'
          : '<span class="badge badge-yellow"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>En attente' + (days !== null ? ' (' + days + 'j)' : '') + '</span>';
        const displayClient = i.client || '\\u2014';
        const companyTag = i.company ? '<span class="text-xs text-surface-400 block mt-0.5">' + i.company + '</span>' : '';
        return '<tr class="table-row">'
          + '<td class="px-6 py-4 font-mono text-xs text-surface-600">' + (i.number || '\\u2014') + '</td>'
          + '<td class="px-6 py-4"><span class="font-medium text-surface-900">' + displayClient + '</span>' + companyTag + '</td>'
          + '<td class="px-6 py-4 text-right font-semibold text-surface-900">' + fmt(i.amount) + '</td>'
          + '<td class="px-6 py-4 text-right text-surface-400 text-xs">' + fmtDate(i.emission_date) + '</td>'
          + '<td class="px-6 py-4 text-right text-xs ' + (overdue ? 'text-red-600 font-semibold' : 'text-surface-500') + '">' + fmtDate(i.due_date) + '</td>'
          + '<td class="px-6 py-4 text-right">' + statusBadge + '</td>'
          + '</tr>';
      }).join('');
  }

  // Global metrics
  if (data.global) {
    document.getElementById('kpi-revenue-ttc').textContent = fmt(data.global.total_revenue_ttc);
    document.getElementById('kpi-revenue-ht').textContent = fmt(data.global.total_revenue_ht);
    document.getElementById('kpi-total-invoices').textContent = data.global.total_invoices.toString();
    document.getElementById('kpi-inflows').textContent = fmt(data.global.total_inflows);
    document.getElementById('kpi-outflows').textContent = fmt(Math.abs(data.global.total_outflows));
    const netEl = document.getElementById('kpi-net-cashflow');
    netEl.className = 'text-xl font-bold ' + (data.global.net_cashflow >= 0 ? 'positive' : 'negative');
    netEl.textContent = fmt(data.global.net_cashflow);
    renderCashflowChart(data.global.monthly);
  }

  // Charts
  renderAccountsChart(data.treasury.accounts);
  renderUnpaidChart(data.invoices.unpaid);
}

function renderCashflowChart(monthly) {
  if (chartCashflow) chartCashflow.destroy();
  if (!monthly || monthly.length === 0) return;
  const ctx = document.getElementById('chart-cashflow').getContext('2d');

  const labels = monthly.map(m => {
    const [y, mo] = m.month.split('-');
    return new Date(y, mo - 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  });

  chartCashflow = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Encaissements',
          data: monthly.map(m => m.inflows),
          backgroundColor: '#10b98130',
          borderColor: '#10b981',
          borderWidth: 1.5,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'D\\u00e9caissements',
          data: monthly.map(m => -m.outflows),
          backgroundColor: '#ef444430',
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { color: '#64748b', font: { size: 11, weight: 500 }, usePointStyle: true, pointStyleWidth: 8, padding: 16 },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { weight: 600 },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ' ' + ctx.dataset.label + ': ' + fmt(Math.abs(ctx.raw)),
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { size: 11 } },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v) => fmtCompact(v) },
          grid: { color: '#f1f5f9', drawBorder: false },
          border: { display: false },
        },
      },
    },
  });
}

function renderAccountsChart(accounts) {
  if (chartAccounts) chartAccounts.destroy();
  const ctx = document.getElementById('chart-accounts').getContext('2d');

  // Filter accounts with balance > 0 for the chart
  const filtered = accounts.filter(a => Math.abs(a.balance) > 0);
  const labels = filtered.map(a => a.company ? a.name : a.name);
  const values = filtered.map(a => a.balance);

  chartAccounts = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values.map(v => Math.abs(v)),
        backgroundColor: chartColors.slice(0, filtered.length),
        borderColor: '#fff',
        borderWidth: 3,
        hoverBorderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#64748b',
            padding: 12,
            font: { size: 11, weight: 500 },
            usePointStyle: true,
            pointStyleWidth: 8,
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { weight: 600 },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const original = values[ctx.dataIndex];
              return ' ' + fmt(original);
            }
          }
        }
      },
      cutout: '70%',
    },
  });
}

function renderUnpaidChart(invoices) {
  if (chartUnpaid) chartUnpaid.destroy();
  chartUnpaid = null;

  const container = document.getElementById('chart-unpaid-container');

  if (invoices.length === 0) {
    container.innerHTML =
      '<div class="flex flex-col items-center gap-2 text-surface-400">'
      + '<svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
      + '<span class="text-sm">Aucune facture impay\\u00e9e</span></div>';
    return;
  }

  // Restore canvas if it was replaced
  if (!document.getElementById('chart-unpaid')) {
    container.innerHTML = '<canvas id="chart-unpaid"></canvas>';
  }

  const ctx = document.getElementById('chart-unpaid').getContext('2d');

  const byClient = {};
  for (const inv of invoices) {
    const key = inv.client || 'Sans client';
    byClient[key] = (byClient[key] || 0) + inv.amount;
  }

  const sorted = Object.entries(byClient).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);

  chartUnpaid = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: values.map((_, i) => chartColors[i % chartColors.length] + '20'),
        borderColor: values.map((_, i) => chartColors[i % chartColors.length]),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          padding: 12,
          cornerRadius: 8,
          bodyFont: { size: 13 },
          callbacks: { label: (ctx) => ' ' + fmt(ctx.raw) }
        }
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v) => fmtCompact(v) },
          grid: { color: '#f1f5f9', drawBorder: false },
          border: { display: false },
        },
        y: {
          ticks: { color: '#475569', font: { size: 12, weight: 500 } },
          grid: { display: false },
          border: { display: false },
        }
      }
    },
  });
}

function showError(message) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.add('hidden');
  document.getElementById('error').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

init();
</script>
</body>
</html>`;
