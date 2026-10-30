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

  var ICON = {
    close: '<svg class="guide-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    link: '<svg class="guide-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>'
  };
  var main = document.querySelector('.guide-main[data-guide-slug]');
  var body = document.querySelector('.guide-body');
  function typing(el) { return el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable); }

  /* ---------- toast ---------- */
  var toastBox = null, toastTimer = null;
  function toast(text, action, onAction) {
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.className = 'guide-toast';
      toastBox.setAttribute('role', 'status');
      document.body.appendChild(toastBox);
    }
    toastBox.innerHTML = '';
    var msg = document.createElement('span');
    msg.textContent = text;
    toastBox.appendChild(msg);
    if (action) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = action;
      b.addEventListener('click', function () { hideToast(); onAction(); });
      toastBox.appendChild(b);
    }
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'guide-toast-close';
    x.setAttribute('aria-label', 'Dismiss');
    x.innerHTML = ICON.close;
    x.addEventListener('click', hideToast);
    toastBox.appendChild(x);
    toastBox.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, action ? 8000 : 2500);
  }
  function hideToast() { if (toastBox) toastBox.classList.remove('is-shown'); }

  /* ---------- footnote pop-ups (without JavaScript the number still jumps to the note) ---------- */
  var pop = null, popRef = null;
  function closeNote(back) {
    if (!pop) return;
    pop.remove(); pop = null;
    if (back && popRef) popRef.focus();
    popRef = null;
  }
  document.querySelectorAll('.guide-body a.footnote-ref').forEach(function (ref) {
    ref.setAttribute('aria-haspopup', 'dialog');
    ref.addEventListener('click', function (e) {
      var li = document.getElementById(ref.getAttribute('href').slice(1));
      if (!li) return;
      e.preventDefault();
      var again = popRef === ref;
      closeNote(false);
      if (again) return;
      popRef = ref;
      pop = document.createElement('div');
      pop.className = 'guide-note-pop';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', 'Note ' + ref.textContent.trim());
      pop.tabIndex = -1;
      var note = document.createElement('div');
      note.className = 'guide-note-text';
      note.innerHTML = '<span class="guide-note-num">' + ref.textContent.trim() + '</span> ' + li.innerHTML;
      note.querySelectorAll('.footnote-back').forEach(function (a) { a.remove(); });
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'guide-note-close';
      x.setAttribute('aria-label', 'Close note');
      x.innerHTML = ICON.close;
      x.addEventListener('click', function () { closeNote(true); });
      pop.appendChild(note);
      pop.appendChild(x);
      document.body.appendChild(pop);
      placeNote();
      pop.focus({ preventScroll: true });
    });
  });
  function placeNote() {
    if (!pop || !popRef) return;
    if (window.innerWidth < 768) { pop.style.left = pop.style.top = ''; return; }   // phones: a sheet at the bottom
    var r = popRef.getBoundingClientRect();
    var w = pop.offsetWidth;
    var left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), document.documentElement.clientWidth - w - 12);
    var below = r.bottom + 10, above = r.top - pop.offsetHeight - 10;
    var top = below + pop.offsetHeight > window.innerHeight - 12 && above > 60 ? above : below;
    pop.style.left = (left + window.scrollX) + 'px';
    pop.style.top = (top + window.scrollY) + 'px';
  }
  window.addEventListener('resize', placeNote);
  document.addEventListener('click', function (e) {
    if (pop && !pop.contains(e.target) && !e.target.closest('a.footnote-ref')) closeNote(false);
  });

  /* ---------- figure and photo viewer ---------- */
  var viewer = null, viewerFrom = null;
  function largest(img) {
    var best = img.getAttribute('src'), bw = 0;
    (img.getAttribute('srcset') || '').split(',').forEach(function (c) {
      var m = c.trim().match(/^(\S+)\s+(\d+)w$/);
      if (m && +m[2] > bw) { bw = +m[2]; best = m[1]; }
    });
    return best;
  }
  function openViewer(content, caption, from) {
    closeViewer(false);
    viewerFrom = from;
    viewer = document.createElement('div');
    viewer.className = 'guide-viewer';
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-label', caption || 'Figure');
    var stage = document.createElement('div');
    stage.className = 'guide-viewer-stage';
    stage.appendChild(content);
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'guide-viewer-close';
    x.setAttribute('aria-label', 'Close');
    x.innerHTML = ICON.close;
    x.addEventListener('click', function () { closeViewer(true); });
    viewer.appendChild(x);
    viewer.appendChild(stage);
    if (caption) {
      var c = document.createElement('p');
      c.className = 'guide-viewer-caption';
      c.textContent = caption;
      viewer.appendChild(c);
    }
    // a click on the backdrop closes; a click on the picture toggles full size
    viewer.addEventListener('click', function (e) {
      if (e.target === viewer || e.target === stage) closeViewer(true);
      else if (e.target.tagName === 'IMG') viewer.classList.toggle('is-zoomed');
    });
    document.body.appendChild(viewer);
    root.classList.add('guide-viewer-open');
    x.focus();
  }
  function closeViewer(back) {
    if (!viewer) return;
    viewer.remove(); viewer = null;
    root.classList.remove('guide-viewer-open');
    if (back && viewerFrom) viewerFrom.focus();
    viewerFrom = null;
  }
  function captionFor(img) {
    var holder = img.closest('figure, .subfigure, .guide-photo');
    var cap = holder && holder.querySelector('figcaption');
    var parent = holder && holder.parentElement && holder.parentElement.closest('figure');
    var text = cap ? cap.textContent.replace(/\s+/g, ' ').trim() : img.alt;
    if (parent && parent !== holder) {
      var pc = parent.querySelector(':scope > figcaption');
      if (pc) text = pc.textContent.replace(/\s+/g, ' ').trim() + (text ? ' ' + text : '');
    }
    return text;
  }
  document.querySelectorAll('.guide-body img, .guide-photo img').forEach(function (img) {
    img.classList.add('guide-zoomable');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Enlarge: ' + (img.alt || 'figure'));
    function show() {
      var big = new Image();
      big.src = largest(img);
      big.alt = img.alt;
      openViewer(big, captionFor(img), img);
    }
    img.addEventListener('click', show);
    img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
  });
  // phones: the home diagram is a preview; tapping it opens a larger copy whose links still work
  var flow = document.querySelector('.guide-flow-map');
  if (flow) {
    var zoom = document.createElement('button');
    zoom.type = 'button';
    zoom.className = 'guide-flow-zoom';
    zoom.innerHTML = '<span>Tap to enlarge</span>';
    zoom.addEventListener('click', function () {
      var svg = flow.querySelector('svg');
      if (!svg) return;
      var copy = svg.cloneNode(true);
      copy.removeAttribute('id');
      copy.classList.add('guide-viewer-flow');
      openViewer(copy, 'The BESTEPS Guide: click a lecture or volume to open it.', zoom);
      viewer.classList.add('guide-viewer--flow');
    });
    flow.appendChild(zoom);
  }

  /* ---------- heading links ---------- */
  if (body) {
    body.querySelectorAll('h2[id], h3[id]').forEach(function (h) {
      if (h.id === 'notes') return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'guide-anchor';
      b.setAttribute('aria-label', 'Copy link to this section');
      b.title = 'Copy link to this section';
      b.innerHTML = ICON.link;
      b.addEventListener('click', function () {
        var url = location.origin + location.pathname + '#' + h.id;
        if (history.replaceState) history.replaceState(null, '', '#' + h.id);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { toast('Link copied'); },
            function () { toast('Link is in the address bar'); });
        } else toast('Link is in the address bar');
      });
      h.appendChild(b);
    });
  }

  /* ---------- continue reading ---------- */
  function headingText(h) { return h.textContent.replace(/\s+/g, ' ').trim(); }
  function readPos(slug) { try { return JSON.parse(load('pos:' + slug) || 'null'); } catch (e) { return null; } }

  if (main) {
    var slug = main.getAttribute('data-guide-slug');
    var label = main.getAttribute('data-guide-label') || document.title;
    var marks = body ? Array.prototype.slice.call(body.querySelectorAll('h2[id], h3[id]')).filter(function (h) { return h.id !== 'notes'; }) : [];
    var saved = readPos(slug);
    var lastSave = 0, pending = null;

    function where() {
      var limit = 120;
      var cur = null;
      for (var i = 0; i < marks.length; i++) { if (marks[i].getBoundingClientRect().top <= limit) cur = marks[i]; else break; }
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var p = docH > 0 ? window.scrollY / docH : 0;
      if (cur) return { id: cur.id, title: headingText(cur), p: p };
      // pages without headings (preface, volume pages …): remember how far down, once past the first screen
      if (!marks.length && window.scrollY > window.innerHeight * 0.6) return { id: '', title: '', p: p };
      return null;
    }
    function store() {
      pending = null; lastSave = Date.now();
      var w = where();
      if (!w) return;
      w.label = label; w.url = location.pathname; w.t = Date.now();
      save('pos:' + slug, JSON.stringify(w));
      save('last', slug);
    }
    window.addEventListener('scroll', function () {
      if (pending) return;
      pending = setTimeout(store, Math.max(0, 1000 - (Date.now() - lastSave)));
    }, { passive: true });

    // opened at the top, without a #section or search: offer to go back to where the reader stopped
    var q = new URLSearchParams(location.search).get('q');
    if (saved && !location.hash && !q && (saved.id || saved.p > 0.05)) {
      setTimeout(function () {
        if (window.scrollY > 80) return;
        toast(saved.id ? 'Resume at “' + saved.title + '”' : 'Resume where you left off', 'Resume', function () {
          var el = saved.id && document.getElementById(saved.id);
          if (el) { el.scrollIntoView({ block: 'start' }); history.replaceState && history.replaceState(null, '', '#' + saved.id); }
          else window.scrollTo(0, saved.p * (document.documentElement.scrollHeight - window.innerHeight));
        });
      }, 600);
    }
  }

  // home: a link back to the most recent chapter
  var resume = document.querySelector('[data-guide-resume]');
  var last = resume && load('last');
  var lastPos = last && readPos(last);
  if (lastPos && lastPos.url) {
    var a = document.createElement('a');
    a.href = lastPos.url + (lastPos.id ? '#' + lastPos.id : '');
    a.textContent = lastPos.label + (lastPos.title ? ' › ' + lastPos.title : '');
    var forget = document.createElement('button');
    forget.type = 'button';
    forget.className = 'guide-resume-forget';
    forget.setAttribute('aria-label', 'Hide this link');
    forget.innerHTML = ICON.close;
    forget.addEventListener('click', function () {
      try { localStorage.removeItem(KEY + 'last'); } catch (e) { /* nothing to remove */ }
      resume.hidden = true;
    });
    resume.appendChild(document.createTextNode('Continue reading: '));
    resume.appendChild(a);
    resume.appendChild(forget);
    resume.hidden = false;
  }

  /* ---------- keys: ← / → previous and next page, F focus mode, Esc closes ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (viewer) closeViewer(true); else if (pop) closeNote(true); return; }
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || typing(e.target) || viewer || pop) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      var link = document.querySelector(e.key === 'ArrowLeft' ? '.guide-pager-card--prev' : '.guide-pager-card--next');
      if (link) { e.preventDefault(); location.href = link.href; }
    } else if ((e.key === 'f' || e.key === 'F') && main && window.innerWidth >= 768) {
      e.preventDefault();
      toggleFocus(!focusOn());
      toast(focusOn() ? 'Focus mode on (F to leave)' : 'Focus mode off');
    }
  });
  // keep Tab inside the viewer while it is open
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !viewer) return;
    var f = viewer.querySelectorAll('button, a[href]');
    if (!f.length) return;
    var first = f[0], lastF = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastF.focus(); }
    else if (!e.shiftKey && document.activeElement === lastF) { e.preventDefault(); first.focus(); }
    else if (!viewer.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  });
})();
