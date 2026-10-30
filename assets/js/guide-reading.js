/* The BESTEPS Guide web edition: reading settings (theme, text size, focus mode).
   The saved choices are first applied before paint by _includes/guide-settings-head.html; this keeps them in step. */
(function () {
  'use strict';
  var root = document.documentElement;
  var KEY = 'besteps-guide:';
  var THEMES = ['auto', 'day', 'sepia', 'night'];
  var SIZES = ['90%', '100%', '112%', '125%'];
  var BAR_COLOURS = { day: '#e4edf3', sepia: '#ece1c6', night: '#20262f' };
  var dark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function load(k) { try { return localStorage.getItem(KEY + k); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(KEY + k, v); } catch (e) { /* private mode: the choice lasts for this page only */ } }

  /* ---------- state ---------- */
  function pref() { var p = root.getAttribute('data-guide-pref'); return THEMES.indexOf(p) < 0 ? 'auto' : p; }
  function size() { var n = parseInt(root.getAttribute('data-guide-size'), 10); return n >= 0 && n <= 3 ? n : 1; }
  function focusOn() { return root.getAttribute('data-guide-focus') === 'on'; }

  function setTheme(p) {
    var theme = p === 'auto' ? (dark && dark.matches ? 'night' : 'day') : p;
    root.setAttribute('data-guide-pref', p);
    root.setAttribute('data-guide-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', BAR_COLOURS[theme]);
  }
  function setSize(n) { root.setAttribute('data-guide-size', String(n)); }
  function setFocus(on) { root.setAttribute('data-guide-focus', on ? 'on' : 'off'); }

  /* ---------- panels (one in the bar, one in the phone drawer) ---------- */
  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-guide-settings]'));

  function sync() {
    panels.forEach(function (box) {
      box.querySelectorAll('[data-guide-theme-choice]').forEach(function (r) { r.checked = r.value === pref(); });
      var out = box.querySelector('[data-guide-size-value]');
      if (out) out.textContent = SIZES[size()];
      var steps = box.querySelectorAll('[data-guide-size-step]');
      if (steps.length === 2) { steps[0].disabled = size() === 0; steps[1].disabled = size() === 3; }
      var f = box.querySelector('[data-guide-focus-toggle]');
      if (f) f.checked = focusOn();
    });
  }

  function open(box, show) {
    var btn = box.querySelector('[data-guide-settings-btn]');
    var panel = box.querySelector('.guide-settings-panel');
    panel.hidden = !show;
    btn.setAttribute('aria-expanded', show ? 'true' : 'false');
  }
  function closeAll(except) { panels.forEach(function (b) { if (b !== except) open(b, false); }); }

  panels.forEach(function (box) {
    var btn = box.querySelector('[data-guide-settings-btn]');
    btn.addEventListener('click', function () {
      var show = btn.getAttribute('aria-expanded') !== 'true';
      closeAll(box);
      open(box, show);
      if (show) { var c = box.querySelector('[data-guide-theme-choice]:checked'); if (c) c.focus(); }
    });
    box.querySelectorAll('[data-guide-theme-choice]').forEach(function (r) {
      r.addEventListener('change', function () { setTheme(r.value); save('theme', r.value); sync(); });
    });
    box.querySelectorAll('[data-guide-size-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = Math.max(0, Math.min(3, size() + parseInt(b.getAttribute('data-guide-size-step'), 10)));
        setSize(n); save('size', String(n)); sync();
      });
    });
    var f = box.querySelector('[data-guide-focus-toggle]');
    if (f) f.addEventListener('change', function () { toggleFocus(f.checked); });
  });

  function toggleFocus(on) { setFocus(on); save('focus', on ? 'on' : 'off'); sync(); }

  // Esc closes the open panel and returns focus to its button; a click outside closes it
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    panels.forEach(function (box) {
      var btn = box.querySelector('[data-guide-settings-btn]');
      if (btn.getAttribute('aria-expanded') === 'true') { open(box, false); btn.focus(); }
    });
  });
  document.addEventListener('click', function (e) {
    panels.forEach(function (box) { if (!box.contains(e.target)) open(box, false); });
  });

  // Auto follows the system while the page is open
  var onSystem = function () { if (pref() === 'auto') setTheme('auto'); };
  if (dark) { if (dark.addEventListener) dark.addEventListener('change', onSystem); else if (dark.addListener) dark.addListener(onSystem); }

  // another tab changed a setting
  window.addEventListener('storage', function (e) {
    if (!e.key || e.key.indexOf(KEY) !== 0) return;
    var k = e.key.slice(KEY.length);
    if (k === 'theme') setTheme(THEMES.indexOf(e.newValue) < 0 ? 'auto' : e.newValue);
    else if (k === 'size' && /^[0-3]$/.test(e.newValue || '')) setSize(parseInt(e.newValue, 10));
    else if (k === 'focus') setFocus(e.newValue === 'on');
    else return;
    sync();
  });

  /* ---------- home bar on phones: the search icon opens the search field ---------- */
  var bar = document.querySelector('.guide-bar');
  var searchToggle = document.querySelector('[data-guide-search-toggle]');
  if (bar && searchToggle) {
    var field = bar.querySelector('.guide-search-input');
    searchToggle.addEventListener('click', function () {
      bar.classList.add('is-searching');
      searchToggle.setAttribute('aria-expanded', 'true');
      if (field) field.focus();
    });
    if (field) field.addEventListener('blur', function () {
      // leave the field open while it holds a query (the results stay clickable)
      setTimeout(function () {
        if (field.value || bar.contains(document.activeElement)) return;
        bar.classList.remove('is-searching');
        searchToggle.setAttribute('aria-expanded', 'false');
      }, 150);
    });
  }

  sync();
  window.guideReading = { toggleFocus: function () { toggleFocus(!focusOn()); } };
})();
