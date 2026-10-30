/* The BESTEPS Guide web edition: reading settings (theme, text size, font, spacing, focus mode) and reading aids.
   The saved choices are first applied before paint by _includes/guide-settings-head.html; this keeps them in step. */
(function () {
  'use strict';
  var root = document.documentElement;
  var KEY = 'besteps-guide:';
  var THEMES = ['auto', 'day', 'green', 'night'];
  var SIZES = ['90%', '100%', '112%', '125%'];
  var BAR_COLOURS = { day: '#e4edf3', green: '#dbe6d3', night: '#20262f' };
  // radio-group settings: stored value -> <html data-guide-NAME>; the first value is the default
  var CHOICES = { font: ['poppins', 'sans', 'serif'], leading: ['1', '0', '2'] };
  // on/off settings
  var TOGGLES = ['spacing'];
  var dark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  // the phone layout (keep in step with _sass/_guide.scss)
  var phone = window.matchMedia('(max-width: 767px), (max-height: 500px) and (max-width: 1099px)');

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
  function choice(name) { var v = root.getAttribute('data-guide-' + name); return CHOICES[name].indexOf(v) < 0 ? CHOICES[name][0] : v; }
  function setChoice(name, v) { root.setAttribute('data-guide-' + name, CHOICES[name].indexOf(v) < 0 ? CHOICES[name][0] : v); }
  function setToggle(name, on) { root.setAttribute('data-guide-' + name, on ? 'on' : 'off'); }

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
      box.querySelectorAll('[data-guide-choice]').forEach(function (r) { r.checked = r.value === choice(r.getAttribute('data-guide-choice')); });
      box.querySelectorAll('[data-guide-toggle]').forEach(function (c) { c.checked = root.getAttribute('data-guide-' + c.getAttribute('data-guide-toggle')) === 'on'; });
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
    box.querySelectorAll('[data-guide-choice]').forEach(function (r) {
      r.addEventListener('change', function () {
        var name = r.getAttribute('data-guide-choice');
        setChoice(name, r.value); save(name, r.value); sync();
      });
    });
    box.querySelectorAll('[data-guide-toggle]').forEach(function (c) {
      c.addEventListener('change', function () {
        var name = c.getAttribute('data-guide-toggle');
        setToggle(name, c.checked); save(name, c.checked ? 'on' : 'off'); sync();
      });
    });
  });

  function toggleFocus(on) { setFocus(on); save('focus', on ? 'on' : 'off'); sync(); }

  // Esc closes the open panel and returns focus to its button; a click outside closes it
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    panels.forEach(function (box) {
      var btn = box.querySelector('[data-guide-settings-btn]');
      if (btn.getAttribute('aria-expanded') !== 'true') return;
      open(box, false);
      // in the phone drawer, Esc has also closed the drawer (guide.js); focus is already back on "Contents"
      if (!(box.closest('.guide-sidebar') && !document.body.classList.contains('guide-drawer-open'))) btn.focus();
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
    else if (CHOICES[k]) setChoice(k, e.newValue);
    else if (TOGGLES.indexOf(k) >= 0) setToggle(k, e.newValue === 'on');
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
  window.guideToast = toast;   // used by guide-notes.js

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
      pop.addEventListener('focusout', function (ev) {
        var to = ev.relatedTarget;
        if (to && pop && !pop.contains(to) && to !== popRef) closeNote(false);
      });
      document.body.appendChild(pop);
      placeNote();
      pop.focus({ preventScroll: true });
    });
  });
  function placeNote() {
    if (!pop || !popRef) return;
    if (phone.matches) { pop.style.left = pop.style.top = ''; return; }   // phones: a sheet at the bottom
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
    var q = window.guideFromSearch || new URLSearchParams(location.search).get('q');
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

  /* ---------- how far through the page: "42% · 8 min left" ---------- */
  // Same rate as the "min read" label (scripts/build_guide.py): 200 words a minute, 12 s per figure,
  // footnotes and code left out. Shown in the "On this page" column when it is on screen, otherwise as a
  // small label in the corner while the reader scrolls. Pages under two minutes get none.
  if (main && body) {
    var count = body.cloneNode(true);
    count.querySelectorAll('.guide-notes, pre, button').forEach(function (el) { el.remove(); });
    var words = (count.textContent.match(/\w[\w'’-]*/g) || []).length;
    var total = words / 200 + body.querySelectorAll('img').length * 12 / 60;
    // lectures show a rounded "min read" under the title: start from that figure so the two agree
    if (+main.getAttribute('data-guide-minutes') > 0) total = +main.getAttribute('data-guide-minutes');
    var column = document.querySelector('.guide-onpage');
    if (total >= 2) {
      var line = document.createElement('p');
      line.className = 'guide-onpage-progress';
      if (column) { column.removeAttribute('aria-hidden'); column.appendChild(line); }
      var chip = document.createElement('div');
      chip.className = 'guide-progress-chip';
      chip.setAttribute('aria-hidden', 'true');
      document.body.appendChild(chip);
      var chipTimer = null, lastText = '', startDone = null, opened = Date.now();

      var progressText = function () {
        var barEl = document.querySelector('.guide-bar');
        var top = barEl ? barEl.getBoundingClientRect().bottom : 0;
        var notes = body.querySelector('.guide-notes');
        var r = body.getBoundingClientRect();
        var end = notes ? notes.getBoundingClientRect().top : r.bottom;
        // 0 % while the text starts below the bar, 100 % once its last line is in view
        var span = end - r.top - (window.innerHeight - top);
        var done = span > 0 ? Math.min(1, Math.max(0, (top - r.top) / span)) : 1;
        var left = total * (1 - done);
        return { done: done, text: Math.round(done * 100) + '%' + (done >= 0.995 ? '' : ' · ' + (left < 1 ? '<1' : Math.ceil(left)) + ' min left') };
      };
      var showProgress = function (fromScroll) {
        var pr = progressText(), text = pr.text;
        if (startDone === null) startDone = pr.done;
        // "read" means scrolled to the end from the first half, after at least a minute on the page:
        // landing on #notes, a footnote or the last section does not count
        if (fromScroll && pr.done >= 0.98 && startDone < 0.5 && Date.now() - opened > 60000) noteRead(main.getAttribute('data-guide-slug'));
        var inColumn = column && getComputedStyle(column).display !== 'none';
        if (text !== lastText) { line.textContent = chip.textContent = text; lastText = text; }
        if (inColumn || !fromScroll) return;
        chip.classList.add('is-shown');
        clearTimeout(chipTimer);
        chipTimer = setTimeout(function () { chip.classList.remove('is-shown'); }, 1500);
      };
      window.addEventListener('scroll', function () { showProgress(true); }, { passive: true });
      window.addEventListener('resize', function () { showProgress(false); });
      window.addEventListener('load', function () { showProgress(false); });
      showProgress(false);
    }
  }

  /* ---------- previews of figure and section references, and "back to where you were" ---------- */
  // Mouse: hovering a reference shows the figure or the start of the section; a click still jumps.
  // Touch: the first tap shows the preview with a "Go to" link. After a jump within the page a small
  // button returns to the reading position (as Kindle's Page Flip does).
  if (body) {
    var hover = window.matchMedia('(hover: hover) and (pointer: fine)');
    var refPop = null, refFrom = null, refTimer = null, pages = {};
    var isRef = function (a) {
      if (a.classList.contains('footnote-ref') || a.classList.contains('footnote-back')) return false;
      var h = a.getAttribute('href') || '';
      return h.charAt(0) === '#' ? h.length > 1 : (a.origin === location.origin && /^\/besteps\/guide\/[^/]+\/#./.test(a.pathname + a.hash));
    };
    var samePage = function (a) { return a.origin === location.origin && a.pathname === location.pathname; };
    var targetDoc = function (a) {
      if (samePage(a)) return Promise.resolve(document);
      if (!pages[a.pathname]) {
        pages[a.pathname] = fetch(a.href.split('#')[0]).then(function (r) { return r.text(); })
          .then(function (t) { return new DOMParser().parseFromString(t, 'text/html'); });
      }
      return pages[a.pathname];
    };
    var excerpt = function (h) {
      var text = '', el = h.nextElementSibling;
      while (el && text.length < 260 && !/^H[1-3]$/.test(el.tagName)) {
        if (/^(P|UL|OL|BLOCKQUOTE)$/.test(el.tagName)) {
          var cl = el.cloneNode(true);
          cl.querySelectorAll('.guide-tick, .guide-anchor, a.footnote-ref').forEach(function (n) { n.remove(); });
          text += ' ' + cl.textContent;
        }
        el = el.nextElementSibling;
      }
      text = text.replace(/\s+/g, ' ').trim();
      if (text.length > 260) text = text.slice(0, text.lastIndexOf(' ', 250)) + ' …';
      return text;
    };
    var buildPreview = function (a, doc) {
      var id = decodeURIComponent(a.hash.slice(1));
      var el = doc.getElementById(id);
      if (!el) return null;
      var card = document.createElement('div');
      var fig = el.tagName === 'FIGURE' ? el : null;
      if (fig) {
        var img = fig.querySelector('img');
        if (img) {
          var small = new Image();
          var set = (img.getAttribute('srcset') || '').split(',')[0].trim().split(/\s+/)[0];
          small.src = set || img.getAttribute('src');
          small.alt = '';
          card.appendChild(small);
        }
        var cap = fig.querySelector(':scope > figcaption');
        if (cap) { var c = document.createElement('p'); c.className = 'guide-ref-caption'; c.textContent = cap.textContent.replace(/\s+/g, ' ').trim(); card.appendChild(c); }
      } else {
        if (!samePage(a)) {
          var where = doc.querySelector('.guide-main[data-guide-label]');
          var k = document.createElement('p'); k.className = 'guide-ref-kicker';
          k.textContent = where ? where.getAttribute('data-guide-label') : '';
          card.appendChild(k);
        }
        var t = document.createElement('p'); t.className = 'guide-ref-title';
        t.textContent = el.textContent.replace(/\s+/g, ' ').trim();
        card.appendChild(t);
        var x = excerpt(el);
        if (x) { var p = document.createElement('p'); p.className = 'guide-ref-text'; p.textContent = x; card.appendChild(p); }
      }
      return card;
    };
    var closeRef = function () { clearTimeout(refTimer); if (refPop) refPop.remove(); refPop = null; refFrom = null; };
    var placeRef = function () {
      if (!refPop || !refFrom) return;
      if (phone.matches) { refPop.style.left = refPop.style.top = ''; return; }   // phones: a sheet at the bottom
      var r = refFrom.getBoundingClientRect(), w = refPop.offsetWidth, hgt = refPop.offsetHeight;
      var left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), document.documentElement.clientWidth - w - 12);
      var top = r.bottom + 10 + hgt > window.innerHeight - 12 && r.top - hgt - 10 > 60 ? r.top - hgt - 10 : r.bottom + 10;
      refPop.style.left = (left + window.scrollX) + 'px';
      refPop.style.top = (top + window.scrollY) + 'px';
    };
    var showRef = function (a, touch) {
      targetDoc(a).then(function (doc) {
        if (refFrom !== a) return;               // the pointer has moved on
        var card = buildPreview(a, doc);
        if (!card) { refFrom = null; if (touch) location.href = a.href; return; }
        refPop = document.createElement('div');
        refPop.className = 'guide-note-pop guide-ref-pop' + (touch ? ' is-touch' : '');
        if (touch) {
          refPop.setAttribute('role', 'dialog');
          refPop.setAttribute('aria-label', 'Preview: ' + a.textContent.trim());
          var go = document.createElement('a');
          go.className = 'guide-ref-go';
          go.href = a.href;
          go.textContent = 'Go to ' + a.textContent.trim() + ' →';
          go.addEventListener('click', function () { if (samePage(a)) rememberSpot(); closeRef(); });
          card.appendChild(go);
          var x = document.createElement('button');
          x.type = 'button'; x.className = 'guide-note-close'; x.setAttribute('aria-label', 'Close preview'); x.innerHTML = ICON.close;
          x.addEventListener('click', closeRef);
          refPop.appendChild(x);
        } else {
          refPop.setAttribute('aria-hidden', 'true');
        }
        refPop.insertBefore(card, refPop.firstChild);
        document.body.appendChild(refPop);
        placeRef();
        refPop.querySelectorAll('img').forEach(function (i) { i.addEventListener('load', placeRef); });
      }, function () {
        refFrom = null; delete pages[a.pathname];
        if (touch) location.href = a.href;
      });
    };
    body.querySelectorAll('a[href]').forEach(function (a) {
      if (!isRef(a)) return;
      a.addEventListener('mouseenter', function () {
        if (!hover.matches) return;
        closeRef(); refFrom = a;
        refTimer = setTimeout(function () { showRef(a, false); }, 350);
      });
      a.addEventListener('mouseleave', function () { if (hover.matches) closeRef(); });
      a.addEventListener('click', function (e) {
        if (!hover.matches && refFrom !== a) {        // touch: first tap previews
          e.preventDefault();
          closeRef(); refFrom = a; showRef(a, true);
          return;
        }
        closeRef();
        if (samePage(a)) rememberSpot();
      });
    });
    document.addEventListener('click', function (e) {
      if (refPop && !refPop.contains(e.target) && !(refFrom && refFrom.contains(e.target))) closeRef();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeRef(); });
    window.addEventListener('resize', placeRef);

    // the way back
    var back = null, backY = null;
    var backTimer = null;
    var hideBack = function () { clearTimeout(backTimer); if (back) back.classList.remove('is-shown'); backY = null; };
    function rememberSpot() {
      backY = window.scrollY;
      if (!back) {
        back = document.createElement('button');
        back.type = 'button';
        back.className = 'guide-back-chip';
        back.innerHTML = '<span aria-hidden="true">↩</span> Back<span class="guide-back-more"> to where you were</span>';
        back.addEventListener('click', function () { var y = backY; hideBack(); if (y !== null) window.scrollTo(0, y); });
        document.body.appendChild(back);
      }
      clearTimeout(backTimer);
      backTimer = setTimeout(function () { if (backY !== null) back.classList.add('is-shown'); }, 50);
    }
    window.addEventListener('scroll', function () {
      if (backY !== null && Math.abs(window.scrollY - backY) < 150) hideBack();   // the reader went back by hand
    }, { passive: true });
  }

  /* ---------- tick-offs: the book's exercises and the "Rule N" checklist (kept in this browser) ---------- */
  // Found by the book's own wording, so nothing is added to the text: a bold "Exercise N" gets a "Done" box,
  // and a list whose items all start "Rule N" becomes a checklist. Saved per section heading, so a tick
  // stays with its item if the chapter is edited.
  if (main && body) {
    var tickKey = 'ticks:' + main.getAttribute('data-guide-slug');
    var ticks = {};
    try { ticks = JSON.parse(load(tickKey) || '{}') || {}; } catch (e) { ticks = {}; }
    var sectionOf = function (el) {
      var hs = body.querySelectorAll('h2[id], h3[id]'), id = 'top';
      for (var i = 0; i < hs.length; i++) { if (hs[i].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) id = hs[i].id; else break; }
      return id;
    };
    var makeTick = function (id, label) {
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = !!ticks[id];
      box.setAttribute('aria-label', label);
      box.addEventListener('change', function () {
        if (box.checked) ticks[id] = Date.now(); else delete ticks[id];
        save(tickKey, JSON.stringify(ticks));
      });
      return box;
    };
    body.querySelectorAll('p strong, p em').forEach(function (t) {
      // the outermost bold/italic run that reads "Exercise N…"
      if (/^(STRONG|EM)$/.test(t.parentElement.tagName)) return;
      var m = t.textContent.trim().match(/^Exercise\s+(\d+)/);
      if (!m) return;
      var tick = document.createElement('label');
      tick.className = 'guide-tick';
      tick.appendChild(makeTick(sectionOf(t) + ':exercise-' + m[1], 'Exercise ' + m[1] + ' done'));
      tick.appendChild(document.createTextNode('Done'));
      // after the title when it stands on its own line, otherwise at the end of the paragraph
      var after = t;
      while (after.nextSibling && after.nextSibling.nodeType === 1 && after.nextSibling.classList.contains('footnote-ref')) after = after.nextSibling;
      var next = after.nextSibling;
      while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling;
      if (!next || next.nodeName === 'BR') after.parentNode.insertBefore(tick, after.nextSibling);
      else t.closest('p').appendChild(tick);
    });
    body.querySelectorAll('ul, ol').forEach(function (list) {
      var items = Array.prototype.filter.call(list.children, function (li) { return li.tagName === 'LI'; });
      if (items.length < 3 || !items.every(function (li) { return /^Rule\s+\d+/.test(li.textContent.trim()); })) return;
      list.classList.add('guide-checklist');
      var sec = sectionOf(list);
      items.forEach(function (li) {
        var n = li.textContent.trim().match(/^Rule\s+(\d+)/)[1];
        li.insertBefore(makeTick(sec + ':rule-' + n, 'Rule ' + n + ' done'), li.firstChild);
      });
    });
  }

  /* ---------- chapters read: a tick in the contents and on the home cards ---------- */
  function markRead() {
    document.querySelectorAll('.guide-toc-item > a, .guide-card').forEach(function (a) {
      var m = a.pathname.match(/\/besteps\/guide\/([^/]+)\/$/);
      if (!m || !load('read:' + m[1]) || a.querySelector('.guide-read-mark')) return;
      var mark = document.createElement('span');
      mark.className = 'guide-read-mark';
      mark.title = 'Read';
      mark.innerHTML = '<svg class="guide-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7"/></svg><span class="guide-visually-hidden"> (read)</span>';
      a.appendChild(mark);
    });
  }
  markRead();
  function noteRead(slug) {
    if (load('read:' + slug)) return;
    save('read:' + slug, String(Date.now()));
    markRead();
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
    // leave arrows to wide code blocks and tables (they scroll sideways), and to the panels and drawer
    if (e.target.closest && e.target.closest('.pre-scroll, .table-scroll, [data-guide-settings], .guide-sidebar, .guide-mynotes')) return;
    var draft = document.querySelector('.guide-mynotes-input');
    if (draft && draft.value.trim() && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      var link = document.querySelector(e.key === 'ArrowLeft' ? '.guide-pager-card--prev' : '.guide-pager-card--next');
      if (link) { e.preventDefault(); location.href = link.href; }
    } else if ((e.key === 'f' || e.key === 'F') && main && !phone.matches) {
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
