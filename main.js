/**
 * DMR Web Design — main.js
 * Módulos compartidos por todas las páginas.
 *
 * ÍNDICE
 *  1. Config
 *  2. Navbar (scroll + hamburger)
 *  3. Scroll Reveal
 *  4. FAQ Accordion
 *  5. Pricing Toggle (USD / ARS)
 *  6. Tipos Filter + Search
 *  7. Services Filter + Search (mantenimiento)
 *  8. Contact Form (validación + submit + fallback WA)
 *  9. URL Params → form pre-fill
 * 10. WhatsApp SVG (inyectado dinámicamente)
 * 11. Init
 */

/* ─────────────────────────────────────────────────────────
   1. CONFIG
   ───────────────────────────────────────────────────────── */
const CONFIG = {
  WA_NUMBER: '5492615892555',
  WA_MSG_GENERIC: 'Hola Diego, quiero saber más sobre tus servicios.',
  WA_MSG_PC:      'Hola Diego, necesito ayuda con mi PC.',
  FORMSPREE_ID:   'xqegbdbe', // ← SOLO EL ID, SIN LA URL
  PRICES: {
    usd: { basico: '$199 <span>USD</span>', pro: '$349 <span>USD</span>', premium: '$549 <span>USD</span>' },
    ars: { basico: '$199k <span>ARS</span>', pro: '$349k <span>ARS</span>', premium: '$549k <span>ARS</span>' },
  },
};

/* ─────────────────────────────────────────────────────────
   2. NAVBAR
   ───────────────────────────────────────────────────────── */
const Navbar = (() => {
  let navbar, hamburger, mobileNav;

  function _onScroll() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }

  function _toggleMobile() {
    if (!mobileNav) return;
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  }

  function _closeMobileOnLink() {
    mobileNav?.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileNav.classList.remove('open'));
    });
  }

  function init() {
    navbar     = document.querySelector('.navbar');
    hamburger  = document.getElementById('hamburger');
    mobileNav  = document.getElementById('mobile-nav');

    if (navbar) {
      window.addEventListener('scroll', _onScroll, { passive: true });
      _onScroll(); // run once on load
    }

    hamburger?.addEventListener('click', _toggleMobile);
    _closeMobileOnLink();

    // Highlight active nav link
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
      const href = a.getAttribute('href')?.split('/').pop() || '';
      if (href === current) a.classList.add('active');
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────
   3. SCROLL REVEAL
   ───────────────────────────────────────────────────────── */
const ScrollReveal = (() => {
  let observer;

  function init() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    // Skip animation if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(el => el.classList.add('visible'));
      return;
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });

    els.forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────
   4. FAQ ACCORDION
   ───────────────────────────────────────────────────────── */
const FAQ = (() => {
  function _toggle(btn) {
    const item   = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');

    // Close all
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));

    // Open clicked (if it wasn't already open)
    if (!isOpen) item.classList.add('open');
  }

  function init() {
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => _toggle(btn));
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────
   5. PRICING TOGGLE (USD / ARS)
   ───────────────────────────────────────────────────────── */
const PricingToggle = (() => {
  let currentCurrency = 'usd';

  function _apply(currency) {
    currentCurrency = currency;
    const data = CONFIG.PRICES[currency];

    Object.keys(data).forEach(plan => {
      const el = document.getElementById(`price-${plan}`);
      if (el) el.innerHTML = data[plan];
    });

    document.querySelectorAll('.pricing-toggle button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.currency === currency);
    });
  }

  function init() {
    document.querySelectorAll('.pricing-toggle button').forEach(btn => {
      btn.addEventListener('click', () => _apply(btn.dataset.currency));
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────
   6. TIPOS FILTER + SEARCH
   ───────────────────────────────────────────────────────── */
const TiposFilter = (() => {
  let currentFilter = 'all';
  let searchInput, countEl, emptyState;

  function _filterCards() {
    const query = searchInput?.value.toLowerCase().trim() ?? '';
    const cards = document.querySelectorAll('.tipo-card');
    let visible  = 0;

    cards.forEach(card => {
      const cat      = card.dataset.category ?? '';
      const keywords = (card.dataset.keywords ?? '') + ' ' +
                       (card.querySelector('.tipo-card-title')?.textContent ?? '').toLowerCase() + ' ' +
                       (card.querySelector('.tipo-card-desc')?.textContent ?? '').toLowerCase();

      const matchFilter = currentFilter === 'all' || cat === currentFilter;
      const matchSearch = !query || keywords.includes(query);

      const show = matchFilter && matchSearch;
      card.classList.toggle('hidden', !show);
      if (show) visible++;
    });

    if (countEl) countEl.textContent = visible;
    emptyState?.classList.toggle('visible', visible === 0);
  }

  function reset() {
    if (searchInput) searchInput.value = '';
    currentFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
    _filterCards();
  }

  function init() {
    searchInput = document.getElementById('search');
    countEl     = document.getElementById('count');
    emptyState  = document.getElementById('empty-state');

    if (!document.querySelector('.tipo-card')) return; // not on this page

    searchInput?.addEventListener('input', _filterCards);

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        _filterCards();
      });
    });

    // Expose reset for empty-state link
    window.resetFilters = reset;
  }

  return { init, reset };
})();

/* ─────────────────────────────────────────────────────────
   7. SERVICES FILTER + SEARCH (mantenimiento)
   ───────────────────────────────────────────────────────── */
const ServicesFilter = (() => {
  let currentTab = 'all';
  let searchInput, countEl, emptyState;

  function _filterServices() {
    const query      = searchInput?.value.toLowerCase().trim() ?? '';
    const allCards   = document.querySelectorAll('.service-card');
    const allHeaders = document.querySelectorAll('.service-category-header');
    let visible      = 0;

    // Show/hide category header rows
    allHeaders.forEach(h => {
      h.style.display = (currentTab === 'all' || h.dataset.cat === currentTab) ? '' : 'none';
    });

    // Show/hide service cards
    allCards.forEach(card => {
      const cat      = card.dataset.cat ?? '';
      const keywords = (card.dataset.keywords ?? '') + ' ' +
                       (card.querySelector('.service-name')?.textContent ?? '').toLowerCase();

      const matchTab    = currentTab === 'all' || cat === currentTab;
      const matchSearch = !query || keywords.toLowerCase().includes(query);

      const show = matchTab && matchSearch;
      card.classList.toggle('hidden', !show);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    // Hide category headers with no visible children
    allHeaders.forEach(h => {
      if (h.style.display === 'none') return;
      const cat       = h.dataset.cat;
      const anyVisible = [...document.querySelectorAll(`.service-card[data-cat="${cat}"]`)]
        .some(c => !c.classList.contains('hidden'));
      if (!anyVisible) h.style.display = 'none';
    });

    if (countEl) countEl.textContent = visible;
    emptyState?.classList.toggle('visible', visible === 0);
  }

  function reset() {
    if (searchInput) searchInput.value = '';
    currentTab = 'all';
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'all'));
    _filterServices();
  }

  function init() {
    searchInput = document.getElementById('search');
    countEl     = document.getElementById('count');
    emptyState  = document.getElementById('empty-state');

    if (!document.querySelector('.service-card')) return; // not on this page

    searchInput?.addEventListener('input', _filterServices);

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        _filterServices();
      });
    });

    // Budget selector (re-used here for completeness)
    document.querySelectorAll('.budget-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.budget-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const budgetInput = document.getElementById('budget');
        if (budgetInput) budgetInput.value = btn.dataset.value;
      });
    });

    // Expose reset
    window.resetAll = reset;
  }

  return { init, reset };
})();

/* ─────────────────────────────────────────────────────────
   8. CONTACT FORM
   ───────────────────────────────────────────────────────── */
const ContactForm = (() => {
  const RULES = {
    name:    v => v.trim().length >= 2,
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    tipo:    v => v !== '',
    message: v => v.trim().length >= 10,
  };

  function _validateField(id) {
    const el  = document.getElementById(id);
    const err = document.getElementById(`${id}-error`);
    if (!el || !RULES[id]) return true;

    const valid = RULES[id](el.value);
    el.classList.toggle('error', !valid);
    err?.classList.toggle('visible', !valid);
    return valid;
  }

  function _validateAll() {
    return Object.keys(RULES).map(_validateField).every(Boolean);
  }

  function _showBanner(type, html = '') {
    const success = document.getElementById('banner-success');
    const error   = document.getElementById('banner-error');
    const errText = document.getElementById('banner-error-text');

    success?.classList.remove('visible');
    error?.classList.remove('visible');

    if (type === 'success') {
      success?.classList.add('visible');
      success?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (type === 'error') {
      if (errText && html) errText.innerHTML = html;
      error?.classList.add('visible');
    }
  }

  function _buildWAFallback(data) {
    const msg = encodeURIComponent(
      `Hola Diego! Te escribo desde el formulario web.\n\n` +
      `Nombre: ${data.name}\nEmail: ${data.email}\n` +
      `Tipo: ${data.tipo}\nPresupuesto: ${data.budget}\n\n${data.message}`
    );
    return `Hubo un error al enviar. ` +
      `<a href="https://wa.me/${CONFIG.WA_NUMBER}?text=${msg}" target="_blank" ` +
      `style="color:var(--accent-light)">Hacé clic acá para enviar por WhatsApp →</a>`;
  }

  function _resetForm(form) {
    form.reset();
    // Re-select default budget
    document.querySelectorAll('.budget-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector('.budget-btn[data-value="pro"]')?.classList.add('selected');
    const budgetInput = document.getElementById('budget');
    if (budgetInput) budgetInput.value = 'pro';
  }

  async function _handleSubmit(e) {
    e.preventDefault();
    _showBanner(null);

    if (!_validateAll()) return;

    const btn = document.getElementById('submit-btn');
    btn?.classList.add('loading');
    if (btn) btn.disabled = true;

    const data = {
      name:    document.getElementById('name')?.value.trim(),
      email:   document.getElementById('email')?.value.trim(),
      phone:   document.getElementById('phone')?.value.trim(),
      tipo:    document.getElementById('tipo')?.value,
      budget:  document.getElementById('budget')?.value,
      message: document.getElementById('message')?.value.trim(),
    };

    try {
      const res = await fetch(`https://formspree.io/f/xqegbdbe`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify(data),
      });

      if (res.ok) {
        _showBanner('success');
        _resetForm(e.target);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      _showBanner('error', _buildWAFallback(data));
    } finally {
      btn?.classList.remove('loading');
      if (btn) btn.disabled = false;
    }
  }

  function init() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', _handleSubmit);

    // Live blur validation
    Object.keys(RULES).forEach(id => {
      const el = document.getElementById(id);
      el?.addEventListener('blur', () => _validateField(id));
      el?.addEventListener('input', () => el.classList.remove('error'));
    });

    // Budget buttons
    document.querySelectorAll('.budget-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.budget-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const budgetInput = document.getElementById('budget');
        if (budgetInput) budgetInput.value = btn.dataset.value;
      });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────
   9. URL PARAMS → FORM PRE-FILL
   ───────────────────────────────────────────────────────── */
const URLPrefill = (() => {
  const PLAN_TO_BUDGET = { basico: 'basico', pro: 'pro', premium: 'premium' };

  function init() {
    const params = new URLSearchParams(window.location.search);

    // Pre-fill tipo select
    const tipoParam = params.get('tipo') || params.get('plan');
    if (tipoParam) {
      const select = document.getElementById('tipo');
      if (select) {
        for (const opt of select.options) {
          if (opt.value === tipoParam) { opt.selected = true; break; }
        }
      }
    }

    // Pre-select budget btn
    const planParam = params.get('plan');
    const budgetKey = PLAN_TO_BUDGET[planParam];
    if (budgetKey) {
      document.querySelectorAll('.budget-btn').forEach(b => b.classList.remove('selected'));
      const btn = document.querySelector(`.budget-btn[data-value="${budgetKey}"]`);
      if (btn) {
        btn.classList.add('selected');
        const budgetInput = document.getElementById('budget');
        if (budgetInput) budgetInput.value = budgetKey;
      }
    }
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────
   10. WHATSAPP FLOAT (inyectado dinámicamente)
   ───────────────────────────────────────────────────────── */
const WAFloat = (() => {
  const SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94
    1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297
    -.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149
    -.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297
    -1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694
    .625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272
    -.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86
    9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893
    6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157
    11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0
    11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>`;

  function inject(msg = CONFIG.WA_MSG_GENERIC) {
    if (document.querySelector('.wa-float')) return; // already present
    const a       = document.createElement('a');
    a.className   = 'wa-float';
    a.href        = `https://wa.me/${CONFIG.WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    a.target      = '_blank';
    a.rel         = 'noopener noreferrer';
    a.setAttribute('aria-label', 'Contactar por WhatsApp');
    a.innerHTML   = SVG;
    document.body.appendChild(a);
  }

  return { inject };
})();

/* ─────────────────────────────────────────────────────────
   11. INIT — ejecuta solo lo necesario en cada página
   ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Always
  Navbar.init();
  ScrollReveal.init();
  FAQ.init();

  // Conditional by page content
  if (document.querySelector('.pricing-toggle'))  PricingToggle.init();
  if (document.querySelector('.tipo-card'))       TiposFilter.init();
  if (document.querySelector('.service-card'))    ServicesFilter.init();
  if (document.getElementById('contact-form'))    { ContactForm.init(); URLPrefill.init(); }

  // WhatsApp float — detect page type for custom message
  const isPC = document.body.dataset.page === 'mantenimiento';
  WAFloat.inject(isPC ? CONFIG.WA_MSG_PC : CONFIG.WA_MSG_GENERIC);
});
