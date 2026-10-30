/* The BESTEPS Guide web edition: drawer, scroll-spy, reading progress, search, copy citation. */
(function () {
  'use strict';
  var body = document.body;

  /* ---------- drawer (phones) ---------- */
  var drawer = document.querySelector('[data-guide-drawer]');
  var scrim = document.querySelector('[data-guide-scrim]');
  var openers = document.querySelectorAll('[data-guide-drawer-open]');

  var phone = window.matchMedia('(max-width: 767px)');
  var lastOpener = null;

  function setDrawer(open) {
    if (!drawer) return;
    var wasOpen = body.classList.contains('guide-drawer-open');
    if (open === wasOpen) return;
    body.classList.toggle('guide-drawer-open', open);
    if (scrim) scrim.hidden = !open;
    openers.forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    if (open) {
      lastOpener = document.activeElement;
      var close = drawer.querySelector('[data-guide-drawer-close]');
      if (close) close.focus({ preventScroll: true });
    } else if (lastOpener && lastOpener.focus) {
      lastOpener.focus({ preventScroll: true });
    }
    if (open) {
      // scroll the drawer itself (never the page) only when the current chapter is out of view
      drawer.scrollTop = 0;
      var current = drawer.querySelector('.guide-toc-item.is-current');
      if (current) {
        var bottom = current.offsetTop + Math.min(current.offsetHeight, 160);
        if (bottom > drawer.clientHeight) drawer.scrollTop = current.offsetTop - 80;
      }
    }
  }
  openers.forEach(function (b) { b.addEventListener('click', function () { setDrawer(true); }); });
  document.querySelectorAll('[data-guide-drawer-close]').forEach(function (b) {
    b.addEventListener('click', function () { setDrawer(false); });
  });
  if (scrim) scrim.addEventListener('click', function () { setDrawer(false); });
  if (drawer) drawer.addEventListener('click', function (e) {
    if (e.target.closest('a[href]')) setDrawer(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setDrawer(false);
    // keep Tab inside the open drawer on phones
    if (e.key === 'Tab' && drawer && body.classList.contains('guide-drawer-open')) {
      var f = drawer.querySelectorAll('a[href], button, input');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // the drawer only exists on phones: close it if the screen grows past that width
  var onWidth = function (e) { if (!e.matches) setDrawer(false); };
  if (phone.addEventListener) phone.addEventListener('change', onWidth); else if (phone.addListener) phone.addListener(onWidth);

  /* ---------- scroll-spy and reading progress ---------- */
  var article = document.querySelector('.guide-body');
  var bar = document.querySelector('.guide-progress span');
  var headings = article ? Array.prototype.slice.call(article.querySelectorAll('h2[id], h3[id]'))
    .filter(function (h) { return h.id !== 'notes'; }) : [];
  var spyLinks = document.querySelectorAll('[data-spy]');
  var activeId = null;
  var ticking = false;

  function topOffset() {
    var b = document.querySelector('.guide-bar');
    return (b ? b.getBoundingClientRect().bottom : 100) + 24;
  }

  function update() {
    ticking = false;
    if (article && bar) {
      var r = article.getBoundingClientRect();
      var total = r.height - window.innerHeight + topOffset();
      var done = Math.min(1, Math.max(0, (topOffset() - r.top) / Math.max(total, 1)));
      bar.style.width = (done * 100).toFixed(1) + '%';
    }
    if (!headings.length) return;
    var limit = topOffset();
    var id = headings[0].id;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top <= limit) id = headings[i].id; else break;
    }
    if (headings[0].getBoundingClientRect().top > limit) id = null;
    if (id === activeId) return;
    activeId = id;
    spyLinks.forEach(function (a) {
      var on = a.getAttribute('data-spy') === id;
      // the sidebar lists only h2s: keep the parent section lit while inside its h3s
      a.classList.toggle('is-active', on);
    });
    if (id) {
      var h = document.getElementById(id);
      if (h && h.tagName === 'H3') {
        var prev = h;
        while ((prev = prev.previousElementSibling)) {
          if (prev.tagName === 'H2' && prev.id) {
            document.querySelectorAll('.guide-sidebar [data-spy="' + prev.id + '"]').forEach(function (a) {
              a.classList.add('is-active');
            });
            break;
          }
        }
      }
      var onpageLink = document.querySelector('.guide-onpage [data-spy="' + id + '"]');
      var box = document.querySelector('.guide-onpage');
      if (onpageLink && box) {
        var lr = onpageLink.getBoundingClientRect(), br = box.getBoundingClientRect();
        if (lr.top < br.top || lr.bottom > br.bottom) box.scrollTop += lr.top - br.top - br.height / 3;
      }
    }
  }
  function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // Re-align a #section target once web fonts have loaded (they change line heights).
  function alignHash() {
    var id = decodeURIComponent(window.location.hash.slice(1));
    var el = id && document.getElementById(id);
    if (el) el.scrollIntoView({ block: 'start' });
  }
  if (window.location.hash) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignHash); else alignHash();
  }

  /* ---------- search ---------- */
  var index = null;
  var loading = null;

  function loadIndex(url) {
    if (index) return Promise.resolve(index);
    if (!loading) {
      loading = fetch(url).then(function (r) { return r.json(); }).then(function (data) {
        index = data.map(function (e) {
          e._s = (e.section + ' ' + e.title).toLowerCase();
          e._t = e.text.toLowerCase();
          return e;
        });
        return index;
      });
    }
    return loading;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // Highlight on the raw text, escaping each piece separately, so matches never land inside "&amp;".
  function highlight(text, terms) {
    var re = new RegExp(terms.map(escapeRe).join('|'), 'gi');
    var out = '', last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (!m[0].length) { re.lastIndex++; continue; }
      out += escapeHtml(text.slice(last, m.index)) + '<mark>' + escapeHtml(m[0]) + '</mark>';
      last = m.index + m[0].length;
    }
    return out + escapeHtml(text.slice(last));
  }

  function snippet(text, terms) {
    var lower = text.toLowerCase();
    var at = -1;
    terms.forEach(function (t) { var i = lower.indexOf(t); if (i >= 0 && (at < 0 || i < at)) at = i; });
    var start = Math.max(0, at - 60);
    var s = text.slice(start, start + 180);
    return (start > 0 ? '… ' : '') + highlight(s, terms) + (start + 180 < text.length ? ' …' : '');
  }

  function search(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!terms.length) return [];
    var phrase = q.toLowerCase().trim();
    return index.map(function (e) {
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var inS = e._s.indexOf(terms[i]) >= 0, inT = e._t.indexOf(terms[i]) >= 0;
        if (!inS && !inT) return null;
        score += (inS ? 5 : 0) + (inT ? 1 : 0);
      }
      if (e._s.indexOf(phrase) >= 0) score += 10;
      if (e._t.indexOf(phrase) >= 0) score += 4;
      return { e: e, score: score, terms: terms };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 10);
  }

  document.querySelectorAll('[data-guide-search]').forEach(function (box) {
    var input = box.querySelector('input');
    var out = box.querySelector('[data-guide-results]');
    var url = box.getAttribute('data-index');
    var focused = -1;

    function render() {
      var q = input.value.trim();
      if (q.length < 2) { out.hidden = true; out.innerHTML = ''; return; }
      loadIndex(url).then(function () {
        var hits = search(q);
        focused = -1;
        out.innerHTML = hits.length ? hits.map(function (h) {
          return '<a href="' + h.e.url + '"><span class="r-where">' + escapeHtml(h.e.chapter) + '</span>' +
            '<span class="r-section">' + escapeHtml(h.e.section === 'Introduction' ? h.e.title : h.e.section) + '</span>' +
            '<span class="r-snip">' + snippet(h.e.text, h.terms) + '</span></a>';
        }).join('') : '<div class="r-empty">No results for “' + escapeHtml(q) + '”.</div>';
        out.hidden = false;
      });
    }
    function move(d) {
      var links = out.querySelectorAll('a');
      if (!links.length) return;
      focused = (focused + d + links.length) % links.length;
      links.forEach(function (a, i) { a.classList.toggle('is-focused', i === focused); });
      links[focused].scrollIntoView({ block: 'nearest' });
    }
    input.addEventListener('focus', function () { loadIndex(url); if (input.value.trim().length > 1) render(); });
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        var links = out.querySelectorAll('a');
        var a = links[focused >= 0 ? focused : 0];
        if (a) { e.preventDefault(); window.location.href = a.getAttribute('href'); out.hidden = true; }
      } else if (e.key === 'Escape') { input.value = ''; out.hidden = true; }
    });
    out.addEventListener('click', function (e) { if (e.target.closest('a')) out.hidden = true; });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) out.hidden = true; });
  });

  /* ---------- diagram: light up a lecture's label and arrow together ---------- */
  document.querySelectorAll('.guide-flow-link').forEach(function (a) {
    var group = document.querySelectorAll('.guide-flow-link[data-flow="' + a.getAttribute('data-flow') + '"]');
    function set(on) { group.forEach(function (g) { g.classList.toggle('is-hover', on); }); }
    a.addEventListener('mouseenter', function () { set(true); });
    a.addEventListener('mouseleave', function () { set(false); });
    a.addEventListener('focus', function () { set(true); });
    a.addEventListener('blur', function () { set(false); });
  });

  /* ---------- copy citation ---------- */
  document.querySelectorAll('[data-guide-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.querySelector(btn.getAttribute('data-guide-copy'));
      if (!el || !navigator.clipboard) return;
      navigator.clipboard.writeText(el.innerText.trim()).then(function () {
        var label = btn.querySelector('span');
        var old = label.textContent;
        label.textContent = 'Copied';
        setTimeout(function () { label.textContent = old; }, 1800);
      });
    });
  });
})();
