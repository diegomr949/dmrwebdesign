/* DMR Web Design & IT — app.js
   Un solo script (sin dependencias). Cada bloque se activa sólo si la página lo necesita. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── Menú móvil ─────────────────────────────────────────── */
  var nav = $('.nav'), toggle = $('.nav-toggle');
  if (nav && toggle) {
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    $$('.nav-menu a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setOpen(false); });
    window.matchMedia('(min-width:1021px)').addEventListener('change', function () { setOpen(false); });
  }

  /* ── Aparición al hacer scroll ──────────────────────────── */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── FAQ (acordeón) ─────────────────────────────────────── */
  $$('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement, willOpen = !item.classList.contains('open');
      $$('.faq-item').forEach(function (i) {
        i.classList.remove('open');
        $('.faq-q', i).setAttribute('aria-expanded', 'false');
      });
      if (willOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ── Filtro de servicios (mantenimiento) ────────────────── */
  var tabs = $$('.tab-btn[data-tab]');
  if (tabs.length) {
    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabs.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
        var tab = btn.getAttribute('data-tab');
        $$('#svc-list [data-cat]').forEach(function (el) {
          el.classList.toggle('hidden', !(tab === 'all' || el.getAttribute('data-cat') === tab));
        });
      });
    });
  }

  /* ── Formulario de contacto ─────────────────────────────── */
  var form = $('#contact-form');
  if (form) {
    var select = $('#tipo', form);
    var param = new URLSearchParams(location.search).get('tipo');
    if (param && select) {
      var opt = $$('option', select).filter(function (o) { return o.value === param; })[0] ||
                $$('option', select).filter(function (o) { return o.value && o.value.indexOf(param) === 0; })[0];
      if (opt) select.value = opt.value;
    }
    var ok = $('#banner-success'), bad = $('#banner-error'), btn = $('#submit-btn');
    var check = function (id, group, test) {
      var valid = test($('#' + id).value.trim());
      $('#' + group).classList.toggle('invalid', !valid);
      return valid;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      ok.classList.remove('show'); bad.classList.remove('show');
      var results = [
        check('name', 'name-group', function (v) { return v.length > 1; }),
        check('email', 'email-group', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }),
        check('tipo', 'tipo-group', function (v) { return v.length > 0; }),
        check('message', 'message-group', function (v) { return v.length > 5; })
      ];
      if (results.indexOf(false) !== -1) {
        var first = $('.invalid input, .invalid select, .invalid textarea', form);
        if (first) first.focus();
        return;
      }
      btn.classList.add('loading'); btn.disabled = true;
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (res.ok) {
            ok.classList.add('show'); form.reset();
            if (window.gtag) window.gtag('event', 'generate_lead', { form: 'contacto' });
          } else { bad.classList.add('show'); }
        })
        .catch(function () { bad.classList.add('show'); })
        .then(function () { btn.classList.remove('loading'); btn.disabled = false; });
    });
  }
})();
