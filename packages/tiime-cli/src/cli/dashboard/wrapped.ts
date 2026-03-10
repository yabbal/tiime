export const wrappedHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tiime — Money Wrapped</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    }
  }
}
</script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #0f172a; color: #fff; overflow: hidden; -webkit-font-smoothing: antialiased; }

  .slides-container { display: flex; height: 100vh; overflow-x: scroll; scroll-snap-type: x mandatory; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .slides-container::-webkit-scrollbar { display: none; }
  .slide { min-width: 100vw; width: 100vw; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; position: relative; overflow: hidden; scroll-snap-align: start; scroll-snap-stop: always; flex-shrink: 0; }
  @media (max-width: 640px) {
    .slide { justify-content: flex-start; padding: 4.5rem 1.25rem 5rem; overflow-y: auto; }
    .slide-content { max-width: 100%; }
    .big-number { font-size: clamp(2rem, 8vw, 3.5rem); }
    .bar-list { max-width: 100%; }
    .chart-container { max-width: 100%; height: 200px; }
    .nav-bar { padding: 0.75rem 1rem; }
    .top-bar { padding: 0.75rem 1rem; }
    .top-bar select { font-size: 0.75rem; }
  }

  .slide-0  { background: linear-gradient(135deg, #1e1b4b, #312e81, #4338ca); }
  .slide-1  { background: linear-gradient(135deg, #064e3b, #065f46, #059669); }
  .slide-2  { background: linear-gradient(135deg, #1e3a5f, #1e40af, #3b82f6); }
  .slide-3  { background: linear-gradient(135deg, #7c2d12, #c2410c, #f97316); }
  .slide-4  { background: linear-gradient(135deg, #581c87, #7c3aed, #a78bfa); }
  .slide-5  { background: linear-gradient(135deg, #134e4a, #0d9488, #2dd4bf); }
  .slide-6  { background: linear-gradient(135deg, #78350f, #d97706, #fbbf24); }
  .slide-7  { background: linear-gradient(135deg, #831843, #db2777, #f472b6); }
  .slide-8  { background: linear-gradient(135deg, #1e293b, #334155, #64748b); }
  .slide-9  { background: linear-gradient(135deg, #0c4a6e, #0284c7, #38bdf8); }
  .slide-10 { background: linear-gradient(135deg, #1e1b4b, #4338ca, #818cf8); }

  /* Decorative floating particles */
  .slide::before, .slide::after {
    content: ''; position: absolute; border-radius: 50%; opacity: 0.08; pointer-events: none;
  }
  .slide::before { width: 400px; height: 400px; background: #fff; top: -100px; right: -100px; animation: floatBubble 8s ease-in-out infinite; }
  .slide::after { width: 250px; height: 250px; background: #fff; bottom: -50px; left: -50px; animation: floatBubble 10s ease-in-out infinite reverse; }
  @keyframes floatBubble { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-30px) scale(1.1); } }

  .slide-content { opacity: 0; transform: translateY(40px) scale(0.95); transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: 1; text-align: center; max-width: 800px; width: 100%; }
  .slide.active .slide-content { opacity: 1; transform: translateY(0) scale(1); }

  .big-number { font-size: clamp(3rem, 10vw, 7rem); font-weight: 900; line-height: 1; letter-spacing: -0.03em; text-shadow: 0 4px 30px rgba(0,0,0,0.2); }
  .slide-label { font-size: clamp(1rem, 3vw, 1.5rem); font-weight: 500; opacity: 0.85; margin-top: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .slide-sublabel { font-size: clamp(0.875rem, 2vw, 1.125rem); font-weight: 400; opacity: 0.6; margin-top: 0.5rem; }

  /* Emoji decoration */
  .slide-emoji { font-size: clamp(2rem, 5vw, 3.5rem); margin-bottom: 0.75rem; animation: bounceEmoji 2s ease-in-out infinite; display: inline-block; }
  @keyframes bounceEmoji { 0%,100% { transform: translateY(0) rotate(0deg); } 25% { transform: translateY(-8px) rotate(-5deg); } 75% { transform: translateY(-4px) rotate(5deg); } }

  .chart-container { width: 100%; max-width: 600px; height: 280px; margin: 1.5rem auto 0; }
  @media (max-width: 640px) { .chart-container { height: 220px; } }

  .bar-list { width: 100%; max-width: 500px; margin: 1.5rem auto 0; }
  .bar-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; opacity: 0; transform: translateX(-20px); transition: opacity 0.4s ease, transform 0.4s ease; }
  .slide.active .bar-item { opacity: 1; transform: translateX(0); }
  .slide.active .bar-item:nth-child(1) { transition-delay: 0.1s; }
  .slide.active .bar-item:nth-child(2) { transition-delay: 0.2s; }
  .slide.active .bar-item:nth-child(3) { transition-delay: 0.3s; }
  .slide.active .bar-item:nth-child(4) { transition-delay: 0.4s; }
  .slide.active .bar-item:nth-child(5) { transition-delay: 0.5s; }
  .bar-rank { font-size: 0.75rem; font-weight: 700; opacity: 0.5; width: 1.5rem; text-align: center; }
  .bar-info { flex: 1; min-width: 0; }
  .bar-name { font-size: 0.875rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar-amount { font-size: 0.75rem; opacity: 0.7; }
  .bar-track { height: 6px; background: rgba(255,255,255,0.15); border-radius: 3px; margin-top: 0.25rem; overflow: hidden; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.9)); border-radius: 3px; width: 0; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
  .slide.active .bar-fill { /* width set via inline style */ }

  /* Navigation */
  .nav-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: linear-gradient(to top, rgba(0,0,0,0.5), transparent); }
  .nav-btn { width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.15); border: none; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s, transform 0.15s; backdrop-filter: blur(8px); }
  .nav-btn:hover { background: rgba(255,255,255,0.25); transform: scale(1.05); }
  .nav-btn:active { transform: scale(0.92); }
  .nav-btn:disabled { opacity: 0.3; cursor: default; transform: none; }
  .nav-btn:disabled:hover { background: rgba(255,255,255,0.15); transform: none; }

  .progress-dots { display: flex; gap: 6px; align-items: center; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3); transition: all 0.3s ease; }
  .dot.active { background: #fff; width: 24px; border-radius: 4px; box-shadow: 0 0 10px rgba(255,255,255,0.5); }

  /* Top bar */
  .top-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent); }
  .top-bar select { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 0.5rem; padding: 0.4rem 2rem 0.4rem 0.75rem; font-size: 0.8rem; font-weight: 500; outline: none; appearance: none; backdrop-filter: blur(8px); cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.25rem; }
  .top-bar a { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 0.8rem; font-weight: 500; transition: color 0.2s; }
  .top-bar a:hover { color: #fff; }

  /* Loading */
  .loading-screen { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e1b4b, #312e81, #4338ca); z-index: 50; }
  .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Empty state */
  .empty-state { text-align: center; padding: 3rem; }
  .empty-state svg { width: 64px; height: 64px; margin: 0 auto 1rem; opacity: 0.5; }

  /* Confetti */
  .confetti-container { position: fixed; inset: 0; pointer-events: none; z-index: 10; overflow: hidden; }
  .confetti { position: absolute; width: 10px; height: 10px; opacity: 0; animation: confettiFall linear forwards; }
  @keyframes confettiFall {
    0% { opacity: 1; transform: translateY(-20px) rotate(0deg) scale(1); }
    100% { opacity: 0; transform: translateY(100vh) rotate(720deg) scale(0.5); }
  }

  /* CountUp glow */
  .glow { text-shadow: 0 0 40px rgba(255,255,255,0.4), 0 4px 30px rgba(0,0,0,0.2); }

  /* Outro stagger */
  .outro-line { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
  .slide.active .outro-line:nth-child(1) { opacity: 1; transform: translateY(0); transition-delay: 0.1s; }
  .slide.active .outro-line:nth-child(2) { opacity: 1; transform: translateY(0); transition-delay: 0.3s; }
  .slide.active .outro-line:nth-child(3) { opacity: 1; transform: translateY(0); transition-delay: 0.5s; }
  .slide.active .outro-line:nth-child(4) { opacity: 1; transform: translateY(0); transition-delay: 0.7s; }
</style>
</head>
<body>

<!-- Loading -->
<div id="loading-screen" class="loading-screen">
  <div class="spinner"></div>
  <p style="margin-top:1rem;opacity:0.7;font-size:0.875rem">Chargement de ton Wrapped...</p>
</div>

<!-- Empty state -->
<div id="empty-state" class="loading-screen" style="display:none">
  <div class="empty-state">
    <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/></svg>
    <p style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem">Pas encore de donn&eacute;es</p>
    <p style="opacity:0.6;font-size:0.875rem;margin-bottom:1.5rem">Aucune transaction ni facture trouv&eacute;e pour g&eacute;n&eacute;rer ton Wrapped.</p>
    <a href="/" style="color:#818cf8;font-weight:600;text-decoration:underline">Retour au dashboard</a>
  </div>
</div>

<!-- Top bar -->
<div class="top-bar" id="top-bar" style="display:none">
  <a href="/">&larr; Dashboard</a>
  <div style="display:flex;gap:0.5rem;align-items:center">
    <select id="company-select" onchange="switchCompany(this.value)"></select>
    <select id="year-select" onchange="switchYear(this.value)"></select>
  </div>
</div>

<!-- Confetti container -->
<div class="confetti-container" id="confetti-container"></div>

<!-- Slides -->
<div id="slides-wrapper" style="display:none">
  <div class="slides-container" id="slides-container"></div>
</div>

<!-- Navigation -->
<div class="nav-bar" id="nav-bar" style="display:none">
  <button class="nav-btn" id="btn-prev" onclick="prevSlide()">
    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
  </button>
  <div class="progress-dots" id="progress-dots"></div>
  <button class="nav-btn" id="btn-next" onclick="nextSlide()">
    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
  </button>
</div>

<script>
const fmt = (amount, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

const fmtCompact = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(amount);

const fmtMonth = (monthStr) => {
  const [y, m] = monthStr.split('-');
  return new Date(y, m - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

const esc = (str) => {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
};

Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.color = 'rgba(255,255,255,0.7)';

let companies = [];
let currentCompanyId = 'all';
let wrappedData = null;
let selectedYear = 'all';
let currentSlide = 0;
let totalSlides = 0;
let charts = [];

// Confetti
function launchConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  const colors = ['#fbbf24','#f472b6','#818cf8','#34d399','#f97316','#38bdf8','#a78bfa','#fb7185'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = (2 + Math.random() * 3) + 's';
    el.style.animationDelay = Math.random() * 1.5 + 's';
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.width = (6 + Math.random() * 8) + 'px';
    el.style.height = (6 + Math.random() * 8) + 'px';
    container.appendChild(el);
  }
  setTimeout(() => { container.innerHTML = ''; }, 5000);
}

// CountUp animation
function countUp(el, target, duration = 1500) {
  const start = 0;
  const startTime = performance.now();
  const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    el.textContent = formatter.format(current);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

async function init() {
  try {
    const res = await fetch('/api/companies');
    companies = await res.json();

    const select = document.getElementById('company-select');
    const allLabel = 'Toutes (' + companies.length + ')';
    select.innerHTML = '<option value="all">' + esc(allLabel) + '</option>' +
      companies.map(c =>
        '<option value="' + c.id + '">' + esc(c.name) + '</option>'
      ).join('');
    select.value = 'all';

    await loadWrapped();
  } catch (e) {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('empty-state').style.display = 'flex';
  }
}

async function switchCompany(value) {
  currentCompanyId = value === 'all' ? 'all' : Number(value);
  selectedYear = 'all';
  document.getElementById('year-select').value = 'all';
  await loadWrapped();
}

async function switchYear(value) {
  selectedYear = value;
  renderSlides();
}

async function loadWrapped() {
  document.getElementById('loading-screen').style.display = 'flex';
  document.getElementById('slides-wrapper').style.display = 'none';
  document.getElementById('top-bar').style.display = 'none';
  document.getElementById('nav-bar').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';

  try {
    const url = currentCompanyId === 'all'
      ? '/api/wrapped'
      : '/api/company/' + currentCompanyId + '/wrapped';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load');
    wrappedData = await res.json();

    if (wrappedData.all_time.transactions_count === 0 && wrappedData.all_time.invoices_count === 0) {
      document.getElementById('loading-screen').style.display = 'none';
      document.getElementById('empty-state').style.display = 'flex';
      return;
    }

    // Populate year selector
    const yearSelect = document.getElementById('year-select');
    yearSelect.innerHTML = '<option value="all">All-time</option>' +
      wrappedData.available_years.map(y =>
        '<option value="' + y + '">' + y + '</option>'
      ).join('');
    yearSelect.value = selectedYear;

    renderSlides();

    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('slides-wrapper').style.display = 'block';
    document.getElementById('top-bar').style.display = 'flex';
    document.getElementById('nav-bar').style.display = 'flex';

    // Celebrate!
    launchConfetti();
  } catch (e) {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('empty-state').style.display = 'flex';
  }
}

function renderSlides() {
  // Destroy old charts
  for (const c of charts) c.destroy();
  charts = [];
  currentSlide = 0;

  const data = selectedYear === 'all'
    ? wrappedData.all_time
    : wrappedData.years[selectedYear];

  if (!data) return;

  const company = wrappedData.company;
  const isAllTime = selectedYear === 'all';
  const slides = [];

  // Slide 0 - Intro
  const introTitle = isAllTime
    ? 'Ton parcours depuis ' + (company.registration_date ? company.registration_date.slice(0, 4) : '...')
    : 'Ton ann&eacute;e ' + selectedYear + ' en chiffres';
  const introSub = isAllTime
    ? company.years_active + ' an(s) d&#x2019;activit&eacute;'
    : esc(company.name);
  slides.push({
    cls: 'slide-0',
    html: '<div class="slide-emoji">&#x1F680;</div>'
        + '<p class="slide-sublabel" style="margin-bottom:0.5rem;opacity:0.6">' + esc(company.name) + '</p>'
        + '<p class="big-number glow" style="font-size:clamp(2rem,6vw,3.5rem)">' + introTitle + '</p>'
        + '<p class="slide-label">' + introSub + '</p>',
    onEnter: () => launchConfetti(),
  });

  // Slide 1 - CA total
  if (data.revenue_ttc > 0) {
    const prevYearData = !isAllTime && wrappedData.years[String(Number(selectedYear) - 1)];
    let comparison = '';
    if (prevYearData && prevYearData.revenue_ttc > 0) {
      const diff = ((data.revenue_ttc - prevYearData.revenue_ttc) / prevYearData.revenue_ttc) * 100;
      const sign = diff >= 0 ? '+' : '';
      const emoji = diff >= 0 ? '&#x1F4C8;' : '&#x1F4C9;';
      comparison = '<p class="slide-sublabel">' + emoji + ' ' + sign + Math.round(diff) + '% vs ' + (Number(selectedYear) - 1) + '</p>';
    }
    slides.push({
      cls: 'slide-1',
      html: '<div class="slide-emoji">&#x1F4B0;</div>'
          + '<p class="slide-label">Chiffre d&#x2019;affaires total</p>'
          + '<p class="big-number glow" id="countup-ca">' + fmt(data.revenue_ttc) + '</p>'
          + '<p class="slide-sublabel">HT : ' + fmt(data.revenue_ht) + '</p>'
          + comparison,
      onEnter: () => {
        const el = document.getElementById('countup-ca');
        if (el) countUp(el, data.revenue_ttc);
      },
    });
  }

  // Slide 2 - Factures
  if (data.invoices_count > 0) {
    slides.push({
      cls: 'slide-2',
      html: '<div class="slide-emoji">&#x1F4C4;</div>'
          + '<p class="slide-label">Factures &eacute;mises</p>'
          + '<p class="big-number glow">' + data.invoices_count + '</p>'
          + '<p class="slide-sublabel">Montant moyen : ' + fmt(data.avg_invoice) + '</p>',
    });
  }

  // Slide 3 - Plus grosse facture
  if (data.biggest_invoice) {
    slides.push({
      cls: 'slide-3',
      html: '<div class="slide-emoji">&#x1F3C6;</div>'
          + '<p class="slide-label">Ta plus grosse facture</p>'
          + '<p class="big-number glow">' + fmt(data.biggest_invoice.amount) + '</p>'
          + '<p class="slide-sublabel">' + esc(data.biggest_invoice.client_name || '') + '</p>'
          + '<p class="slide-sublabel" style="opacity:0.4">' + esc(data.biggest_invoice.number || '') + '</p>',
    });
  }

  // Slide 4 - Top clients
  if (data.top_clients.length > 0) {
    let barsHtml = '<div class="bar-list">';
    const maxAmount = data.top_clients[0].amount;
    const medals = ['&#x1F947;', '&#x1F948;', '&#x1F949;', '', ''];
    for (let i = 0; i < data.top_clients.length; i++) {
      const c = data.top_clients[i];
      const pct = maxAmount > 0 ? (c.amount / maxAmount) * 100 : 0;
      barsHtml += '<div class="bar-item">'
        + '<span class="bar-rank">' + (medals[i] || '#' + (i + 1)) + '</span>'
        + '<div class="bar-info">'
        + '<div class="bar-name">' + esc(c.name) + '</div>'
        + '<div class="bar-amount">' + fmt(c.amount) + '</div>'
        + '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>'
        + '</div></div>';
    }
    barsHtml += '</div>';
    slides.push({
      cls: 'slide-4',
      html: '<div class="slide-emoji">&#x1F91D;</div>'
          + '<p class="slide-label" style="margin-bottom:0.5rem">Tes meilleurs clients</p>' + barsHtml,
    });
  }

  // Slide 5 - Cashflow ratio
  if (data.total_inflows > 0 || data.total_outflows > 0) {
    const chartId = 'chart-ratio-' + Date.now();
    slides.push({
      cls: 'slide-5',
      html: '<div class="slide-emoji">&#x2696;&#xFE0F;</div>'
          + '<p class="slide-label">Encaissements vs D&eacute;caissements</p>'
          + '<div class="chart-container"><canvas id="' + chartId + '"></canvas></div>'
          + '<p class="slide-sublabel">Ratio : ' + (data.inflow_outflow_ratio < 0 ? '&#x221E;' : data.inflow_outflow_ratio.toFixed(2)) + '</p>',
      chart: (slideEl) => {
        const ctx = slideEl.querySelector('canvas').getContext('2d');
        return new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Encaissements', 'D\u00e9caissements'],
            datasets: [{
              data: [data.total_inflows, data.total_outflows],
              backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)'],
              borderColor: ['#10b981', '#ef4444'],
              borderWidth: 2,
              hoverOffset: 8,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
              legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 12, weight: 500 } } },
              tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 12,
                cornerRadius: 8,
                callbacks: { label: (ctx) => ' ' + ctx.label + ' : ' + fmt(ctx.raw) },
              },
            },
          },
        });
      },
    });
  }

  // Slide 6 - Best month
  if (data.best_month) {
    slides.push({
      cls: 'slide-6',
      html: '<div class="slide-emoji">&#x2B50;</div>'
          + '<p class="slide-label">Ton meilleur mois</p>'
          + '<p class="big-number glow" style="font-size:clamp(2rem,6vw,3.5rem)">' + fmtMonth(data.best_month.month) + '</p>'
          + '<p class="slide-sublabel">Flux net : ' + fmt(data.best_month.net) + '</p>',
      onEnter: () => launchConfetti(),
    });
  }

  // Slide 7 - Top expenses
  if (data.top_expenses.length > 0) {
    let barsHtml = '<div class="bar-list">';
    const maxAmount = data.top_expenses[0].amount;
    for (let i = 0; i < data.top_expenses.length; i++) {
      const e = data.top_expenses[i];
      const pct = maxAmount > 0 ? (e.amount / maxAmount) * 100 : 0;
      barsHtml += '<div class="bar-item">'
        + '<span class="bar-rank">#' + (i + 1) + '</span>'
        + '<div class="bar-info">'
        + '<div class="bar-name">' + esc(e.name) + '</div>'
        + '<div class="bar-amount">' + fmt(e.amount) + '</div>'
        + '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>'
        + '</div></div>';
    }
    barsHtml += '</div>';
    slides.push({
      cls: 'slide-7',
      html: '<div class="slide-emoji">&#x1F4B8;</div>'
          + '<p class="slide-label" style="margin-bottom:0.5rem">Tes plus grosses d&eacute;penses</p>' + barsHtml,
    });
  }

  // Slide 8 - Transactions
  if (data.transactions_count > 0) {
    const daysInPeriod = isAllTime
      ? wrappedData.company.years_active * 365
      : (new Date(selectedYear + '-12-31') <= new Date() ? 365 : Math.ceil((new Date() - new Date(selectedYear + '-01-01')) / 86400000));
    const perDay = daysInPeriod > 0 ? data.transactions_count / daysInPeriod : 0;
    const freqLabel = perDay >= 1
      ? '~' + perDay.toFixed(1) + ' par jour en moyenne'
      : '~' + (perDay * 30).toFixed(0) + ' par mois en moyenne';
    slides.push({
      cls: 'slide-8',
      html: '<div class="slide-emoji">&#x1F4CA;</div>'
          + '<p class="slide-label">Transactions trait&eacute;es</p>'
          + '<p class="big-number glow">' + data.transactions_count.toLocaleString('fr-FR') + '</p>'
          + '<p class="slide-sublabel">' + freqLabel + '</p>',
    });
  }

  // Slide 9 - Evolution chart
  if (data.monthly.length > 1) {
    const chartId = 'chart-evolution-' + Date.now();
    slides.push({
      cls: 'slide-9',
      html: '<div class="slide-emoji">&#x1F4C8;</div>'
          + '<p class="slide-label">&Eacute;volution mensuelle</p>'
          + '<div class="chart-container"><canvas id="' + chartId + '"></canvas></div>',
      chart: (slideEl) => {
        const ctx = slideEl.querySelector('canvas').getContext('2d');
        const labels = data.monthly.map(m => {
          const [y, mo] = m.month.split('-');
          return new Date(y, mo - 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        });
        return new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Encaissements',
                data: data.monthly.map(m => m.inflows),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.15)',
                fill: true,
                tension: 0.4,
                borderWidth: 2.5,
                pointRadius: 0,
                pointHoverRadius: 5,
              },
              {
                label: 'D\\u00e9caissements',
                data: data.monthly.map(m => m.outflows),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239,68,68,0.15)',
                fill: true,
                tension: 0.4,
                borderWidth: 2.5,
                pointRadius: 0,
                pointHoverRadius: 5,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
              legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 12, weight: 500 } } },
              tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 12,
                cornerRadius: 8,
                callbacks: { label: (ctx) => ' ' + ctx.dataset.label + ' : ' + fmtCompact(ctx.raw) },
              },
            },
            scales: {
              x: { ticks: { maxRotation: 45, font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
              y: { ticks: { callback: (v) => fmtCompact(v), font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
            },
          },
        });
      },
    });
  }

  // Slide 10 - Outro
  const outroLines = [];
  if (isAllTime) outroLines.push(company.years_active + ' an(s) d&#x2019;activit&eacute;');
  if (data.revenue_ttc > 0) outroLines.push(fmt(data.revenue_ttc) + ' de CA');
  if (data.top_clients.length > 0) outroLines.push(data.top_clients.length + ' client(s) fid&egrave;le(s)');
  if (data.transactions_count > 0) outroLines.push(data.transactions_count.toLocaleString('fr-FR') + ' transactions');
  slides.push({
    cls: 'slide-10',
    html: '<div class="slide-emoji">&#x1F389;</div>'
        + '<p class="slide-label" style="margin-bottom:1.5rem">En r&eacute;sum&eacute;</p>'
        + '<div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:2rem">'
        + outroLines.map(l => '<p class="outro-line big-number" style="font-size:clamp(1.25rem,4vw,2rem)">' + l + '</p>').join('')
        + '</div>'
        + '<a href="/" style="color:rgba(255,255,255,0.7);text-decoration:underline;font-weight:500">&larr; Retour au dashboard</a>',
    onEnter: () => launchConfetti(),
  });

  totalSlides = slides.length;

  // Render slides
  const container = document.getElementById('slides-container');
  container.innerHTML = '';
  container.scrollLeft = 0;
  window._slideCallbacks = [];
  for (let i = 0; i < slides.length; i++) {
    const div = document.createElement('div');
    div.className = 'slide ' + slides[i].cls + (i === 0 ? ' active' : '');
    div.innerHTML = '<div class="slide-content">' + slides[i].html + '</div>';
    container.appendChild(div);

    window._slideCallbacks[i] = slides[i].onEnter || null;

    if (slides[i].chart) {
      const chartFn = slides[i].chart;
      setTimeout(() => {
        const c = chartFn(div);
        if (c) charts.push(c);
      }, 100);
    }
  }

  // Render dots
  const dotsEl = document.getElementById('progress-dots');
  dotsEl.innerHTML = '';
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dotsEl.appendChild(dot);
  }

  updateNav();

  // Fire intro callback
  if (window._slideCallbacks[0]) window._slideCallbacks[0]();
}

function goToSlide(index) {
  if (index < 0 || index >= totalSlides) return;
  const container = document.getElementById('slides-container');
  const slideEls = container.querySelectorAll('.slide');

  slideEls[currentSlide]?.classList.remove('active');
  currentSlide = index;
  slideEls[currentSlide]?.classList.add('active');

  container.scrollTo({ left: currentSlide * window.innerWidth, behavior: 'smooth' });
  updateNav();

  // Fire slide callback
  if (window._slideCallbacks && window._slideCallbacks[currentSlide]) {
    window._slideCallbacks[currentSlide]();
  }
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

function updateNav() {
  document.getElementById('btn-prev').disabled = currentSlide === 0;
  document.getElementById('btn-next').disabled = currentSlide === totalSlides - 1;

  const dots = document.getElementById('progress-dots').children;
  for (let i = 0; i < dots.length; i++) {
    dots[i].className = 'dot' + (i === currentSlide ? ' active' : '');
  }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
});

// Sync state when user scrolls (native scroll-snap)
let scrollTimer = null;
document.getElementById('slides-container').addEventListener('scroll', () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    const container = document.getElementById('slides-container');
    const newIndex = Math.round(container.scrollLeft / window.innerWidth);
    if (newIndex !== currentSlide && newIndex >= 0 && newIndex < totalSlides) {
      const slideEls = container.querySelectorAll('.slide');
      slideEls[currentSlide]?.classList.remove('active');
      currentSlide = newIndex;
      slideEls[currentSlide]?.classList.add('active');
      updateNav();
      if (window._slideCallbacks && window._slideCallbacks[currentSlide]) {
        window._slideCallbacks[currentSlide]();
      }
    }
  }, 100);
}, { passive: true });

init();
</script>
</body>
</html>`;
