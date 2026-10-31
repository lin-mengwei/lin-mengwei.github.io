/* The BESTEPS Guide web edition: the reader's own notes.
   A panel that opens from the bar (or N), notes the section being read, can quote a selected sentence,
   and exports everything as Markdown. Notes stay in this browser (localStorage "besteps-guide:notes"). */
(function () {
  'use strict';
  var main = document.querySelector('.guide-main[data-guide-slug]');
  var body = document.querySelector('.guide-body');
  var btn = document.querySelector('[data-guide-notes-btn]');
  if (!main || !body || !btn) return;

  var root = document.documentElement;
  var KEY = 'besteps-guide:notes';
  var slug = main.getAttribute('data-guide-slug');
  var label = main.getAttribute('data-guide-label') || '';
  var titleEl = document.querySelector('.guide-title');
  var chapterTitle = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : document.title;
  var wide = window.matchMedia('(min-width: 1100px) and (min-height: 501px)');
  var CLOSE = '<svg class="guide-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var stored = true;

  var memory = [];
  function all() {
    if (!stored) return memory.slice();
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { stored = false; return memory.slice(); }
  }
  function keep(list) {
    memory = list.slice();
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { stored = false; }
  }
  function toast(text, action, onAction) { if (window.guideToast) window.guideToast(text, action, onAction); }
  function clean(t) { return t.replace(/\s+/g, ' ').trim(); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  /* ---------- where the reader is ---------- */
  var heads = Array.prototype.slice.call(body.querySelectorAll('h2[id], h3[id]')).filter(function (h) { return h.id !== 'notes'; });
  function headingText(h) { return clean(h.textContent); }
  function currentSection() {
    var cur = null;
    for (var i = 0; i < heads.length; i++) { if (heads[i].getBoundingClientRect().top <= 140) cur = heads[i]; else break; }
    return cur ? { id: cur.id, title: headingText(cur) } : { id: '', title: '' };
  }
  function sectionOfNode(node) {
    var cur = null;
    for (var i = 0; i < heads.length; i++) { if (heads[i].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) cur = heads[i]; else break; }
    return cur ? { id: cur.id, title: headingText(cur) } : { id: '', title: '' };
  }
  function sectionName(s) { return s.title || 'Start of ' + label; }

  /* ---------- the panel ---------- */
  var panel = el('aside', 'guide-mynotes');
  panel.id = 'guide-mynotes';
  panel.setAttribute('aria-labelledby', 'guide-mynotes-title');
  panel.hidden = true;
  var head = el('div', 'guide-mynotes-head');
  var h = el('h2', 'guide-mynotes-title', 'Notes');
  h.id = 'guide-mynotes-title';
  var sub = el('span', 'guide-mynotes-chapter', label);
  var x = el('button', 'guide-mynotes-close');
  x.type = 'button'; x.setAttribute('aria-label', 'Close notes'); x.innerHTML = CLOSE;
  head.appendChild(h); head.appendChild(sub); head.appendChild(x);

  var form = el('div', 'guide-mynotes-form');
  var at = el('p', 'guide-mynotes-at');
  var quoteBox = el('blockquote', 'guide-mynotes-quote');
  quoteBox.hidden = true;
  var area = el('textarea', 'guide-mynotes-input');
  area.rows = 4;
  area.placeholder = 'Write a note for this section…';
  area.setAttribute('aria-label', 'Note');
  var actions = el('div', 'guide-mynotes-actions');
  var saveBtn = el('button', 'guide-btn guide-btn--solid guide-mynotes-save', 'Save note');
  saveBtn.type = 'button';
  var cancelBtn = el('button', 'guide-mynotes-cancel', 'Cancel');
  cancelBtn.type = 'button'; cancelBtn.hidden = true;
  var hint = el('span', 'guide-mynotes-hint', 'Ctrl+Enter');
  actions.appendChild(saveBtn); actions.appendChild(cancelBtn); actions.appendChild(hint);
  form.appendChild(at); form.appendChild(quoteBox); form.appendChild(area); form.appendChild(actions);

  var listHead = el('p', 'guide-mynotes-count');
  var list = el('ol', 'guide-mynotes-list');
  var foot = el('div', 'guide-mynotes-foot');
  var exportBtn = el('button', 'guide-mynotes-export', 'Download all notes (.md)');
  exportBtn.type = 'button';
  var where = el('p', 'guide-mynotes-where', 'Notes are kept in this browser only. Download them to keep a copy.');
  foot.appendChild(exportBtn); foot.appendChild(where);

  panel.appendChild(head); panel.appendChild(form); panel.appendChild(listHead); panel.appendChild(list); panel.appendChild(foot);
  document.body.appendChild(panel);
  btn.hidden = false;

  /* ---------- state of the form ---------- */
  var pinned = null;      // section fixed once the reader starts typing or quotes
  var quote = null;       // { text, section }
  var editing = null;     // id of the note being edited
  function formSection() { return pinned || currentSection(); }
  function showAt() { at.textContent = (editing ? 'Editing note at: ' : 'At: ') + sectionName(formSection()); }
  function resetForm() {
    try { sessionStorage.removeItem(DRAFT); } catch (e) { /* nothing kept */ }
    pinned = null; quote = null; editing = null;
    area.value = ''; quoteBox.hidden = true; quoteBox.textContent = '';
    saveBtn.textContent = 'Save note'; cancelBtn.hidden = true;
    showAt();
  }
  function showQuote() {
    quoteBox.innerHTML = '';
    if (!quote) { quoteBox.hidden = true; return; }
    quoteBox.appendChild(el('span', '', '“' + quote.text + '”'));
    var rm = el('button', 'guide-mynotes-quote-x');
    rm.type = 'button'; rm.setAttribute('aria-label', 'Remove quote'); rm.innerHTML = CLOSE;
    rm.addEventListener('click', function () { quote = null; showQuote(); if (!area.value) pinned = null; showAt(); });
    quoteBox.appendChild(rm);
    quoteBox.hidden = false;
  }

  var DRAFT = 'besteps-guide:note-draft:' + slug;
  area.addEventListener('input', function () {
    if (!pinned && area.value) { pinned = currentSection(); showAt(); }
    if (!editing) { try { if (area.value) sessionStorage.setItem(DRAFT, area.value); else sessionStorage.removeItem(DRAFT); } catch (e) { /* the draft lasts until the page is left */ } }
  });
  area.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveNote(); }
  });
  window.addEventListener('scroll', function () { if (!panel.hidden && !pinned) showAt(); }, { passive: true });

  function saveNote() {
    var text = area.value.trim();
    if (!text && !quote) { area.focus(); return; }
    var notes = all();
    var now = Date.now();
    if (editing) {
      notes.forEach(function (n) { if (n.id === editing) { n.text = text; n.quote = quote ? quote.text : ''; n.updated = now; } });
    } else {
      var s = quote ? quote.section : formSection();
      notes.push({ id: now.toString(36) + Math.random().toString(36).slice(2, 6), slug: slug, label: label, chapter: chapterTitle,
                   url: location.pathname, section: s.id, sectionTitle: s.title, place: placeOf(s.id), quote: quote ? quote.text : '', text: text,
                   created: now, updated: now });
    }
    keep(notes);
    resetForm();
    render();
    toast(stored ? 'Note saved' : 'Note saved for this visit only (this browser blocks storage)');
  }
  saveBtn.addEventListener('click', saveNote);
  cancelBtn.addEventListener('click', function () { resetForm(); render(); });

  /* ---------- this chapter's notes, in reading order ---------- */
  function placeOf(id) {
    for (var i = 0; i < heads.length; i++) if (heads[i].id === id) return i + 1;
    return 0;
  }
  function order(n) { return typeof n.place === 'number' ? n.place : placeOf(n.section); }
  // just after the last heading of a major section (where a recall is written)
  function endOf(id) {
    var i = placeOf(id);
    if (!i) return 0.5;
    while (heads[i] && heads[i].tagName === 'H3') i++;
    return i + 0.5;
  }
  function when(t) { return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function render() {
    var mine = all().filter(function (n) { return n.slug === slug; })
      .sort(function (a, b) { return order(a) - order(b) || a.created - b.created; });
    listHead.textContent = mine.length ? mine.length + (mine.length === 1 ? ' note' : ' notes') + ' in this chapter' : 'No notes in this chapter yet.';
    list.innerHTML = '';
    mine.forEach(function (n) {
      var li = el('li', 'guide-mynotes-item' + (n.id === editing ? ' is-editing' : ''));
      var link = el('a', 'guide-mynotes-section', sectionName({ id: n.section, title: n.sectionTitle }));
      link.href = '#' + (n.section || 'guide-text');
      link.addEventListener('click', function () { if (!wide.matches) closePanel(false); });
      li.appendChild(link);
      if (n.quote) li.appendChild(el('blockquote', 'guide-mynotes-quote', '“' + n.quote + '”'));
      if (n.kind === 'recall') li.appendChild(el('span', 'guide-mynotes-tag', 'Recall'));
      if (n.text) li.appendChild(el('p', 'guide-mynotes-text', n.text));
      var meta = el('div', 'guide-mynotes-meta');
      meta.appendChild(el('span', '', when(n.updated || n.created)));
      var ed = el('button', '', 'Edit'); ed.type = 'button';
      ed.addEventListener('click', function () {
        editing = n.id; pinned = { id: n.section, title: n.sectionTitle }; quote = n.quote ? { text: n.quote, section: pinned } : null;
        area.value = n.text; showQuote(); saveBtn.textContent = 'Save changes'; cancelBtn.hidden = false; showAt(); render(); area.focus();
      });
      var del = el('button', '', 'Delete'); del.type = 'button';
      del.addEventListener('click', function () {
        var before = all();
        keep(before.filter(function (m) { return m.id !== n.id; }));
        if (editing === n.id) resetForm();
        render();
        toast('Note deleted', 'Undo', function () { keep(before); render(); });
      });
      meta.appendChild(ed); meta.appendChild(del);
      li.appendChild(meta);
      list.appendChild(li);
    });
    // a small dot beside sections with notes in "On this page"
    document.querySelectorAll('.guide-onpage a[data-spy]').forEach(function (a) {
      a.classList.toggle('has-note', mine.some(function (n) { return n.section === a.getAttribute('data-spy'); }));
    });
  }

  /* ---------- open / close ---------- */
  function openPanel() {
    panel.hidden = false;
    root.classList.add('guide-mynotes-open');
    btn.setAttribute('aria-expanded', 'true');
    if (!pinned) showAt();
    render();
    area.focus({ preventScroll: true });
  }
  function closePanel(back) {
    if (panel.contains(document.activeElement)) back = true;
    panel.hidden = true;
    root.classList.remove('guide-mynotes-open');
    btn.setAttribute('aria-expanded', 'false');
    hideQuoteButton();
    if (back) btn.focus();
  }
  btn.addEventListener('click', function () { if (panel.hidden) openPanel(); else closePanel(false); });
  x.addEventListener('click', function () { closePanel(true); });
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
    if (e.key === 'Escape' && !panel.hidden && panel.contains(t)) { closePanel(true); return; }
    if (document.querySelector('.guide-viewer') || document.body.classList.contains('guide-drawer-open')) return;
    if ((e.key === 'n' || e.key === 'N') && !typing && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      if (panel.hidden) openPanel(); else closePanel(false);
    }
  });

  /* ---------- quote a sentence: select text in the chapter while the panel is open ---------- */
  var qBtn = el('button', 'guide-quote-btn', 'Quote in note');
  qBtn.type = 'button';
  qBtn.hidden = true;
  document.body.appendChild(qBtn);
  function hideQuoteButton() { qBtn.hidden = true; }
  var selTimer = null, picked = null;
  document.addEventListener('selectionchange', function () {
    clearTimeout(selTimer);
    selTimer = setTimeout(function () {
      var sel = window.getSelection();
      var text = sel && !sel.isCollapsed ? clean(sel.toString()) : '';
      if (panel.hidden || !text || text.length < 3 || !body.contains(sel.anchorNode) || panel.contains(sel.anchorNode)) {
        if (document.activeElement !== qBtn) { hideQuoteButton(); picked = null; }
        return;
      }
      picked = { text: text, node: sel.anchorNode };
      var r = sel.getRangeAt(0).getBoundingClientRect();
      qBtn.hidden = false;
      var left = Math.min(Math.max(8, r.left + r.width / 2 - qBtn.offsetWidth / 2), document.documentElement.clientWidth - qBtn.offsetWidth - 8);
      var top = r.top - qBtn.offsetHeight - 8 > 60 ? r.top - qBtn.offsetHeight - 8 : r.bottom + 8;
      qBtn.style.left = (left + window.scrollX) + 'px';
      qBtn.style.top = (top + window.scrollY) + 'px';
    }, 200);
  });
  qBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });   // keep the selection
  qBtn.addEventListener('click', function () {
    var sel = window.getSelection();
    var live = sel && !sel.isCollapsed && body.contains(sel.anchorNode) ? { text: clean(sel.toString()), node: sel.anchorNode } : null;
    var use = live || picked;
    if (!use) return;
    var text = use.text;
    if (text.length > 600) text = text.slice(0, text.lastIndexOf(' ', 590)) + ' …';
    quote = { text: text, section: sectionOfNode(use.node) };
    picked = null;
    if (!editing) pinned = quote.section;
    showQuote(); showAt();
    if (sel) sel.removeAllRanges();
    hideQuoteButton();
    area.focus({ preventScroll: true });
  });

  /* ---------- export every chapter's notes as Markdown ---------- */
  exportBtn.addEventListener('click', function () {
    var notes = all();
    if (!notes.length) { toast('No notes to download yet'); return; }
    // book order: every page link in the contents (volume pages included), then place in the chapter
    var orderOf = {}, i = 0;
    document.querySelectorAll('.guide-toc a[href]').forEach(function (a) {
      var m = a.pathname.match(/\/besteps\/guide\/([^/]+)\/$/);
      if (m && !(m[1] in orderOf)) orderOf[m[1]] = i++;
    });
    var rank = function (n) { return n.slug in orderOf ? orderOf[n.slug] : 999; };
    notes.sort(function (a, b) {
      return (rank(a) - rank(b)) || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0) || ((a.place || 0) - (b.place || 0)) || (a.created - b.created);
    });
    var base = location.origin;
    var out = ['# My notes on The BESTEPS Guide', '', 'Downloaded ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
               ' from ' + base + '/besteps/guide/', ''];
    var chapter = null, section = null;
    notes.forEach(function (n) {
      if (n.slug !== chapter) {
        chapter = n.slug; section = null;
        out.push('## ' + (n.label && n.label !== n.chapter ? n.label + ': ' : '') + n.chapter, '');
      }
      if (n.section !== section) {
        section = n.section;
        out.push('### [' + (n.sectionTitle || 'Start of ' + (n.label || n.chapter)) + '](' + base + n.url + (n.section ? '#' + n.section : '') + ')', '');
      }
      if (n.quote) out.push('> ' + n.quote, '');
      if (n.text) out.push((n.kind === 'recall' ? '**Recall:** ' : '') + n.text, '');
      out.push('*' + when(n.updated || n.created) + '*', '');
    });
    var blob = new Blob([out.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'besteps-guide-notes.md';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });

  // for the reading script: recall boxes save here, the welcome-back card counts and opens the notes
  window.guideNotes = {
    add: function (f) {
      var now = Date.now(), notes = all();
      notes.push({ id: now.toString(36) + Math.random().toString(36).slice(2, 6), slug: slug, label: label, chapter: chapterTitle,
                   url: location.pathname, section: f.section || '', sectionTitle: f.sectionTitle || '',
                   place: f.kind === 'recall' ? endOf(f.section) : placeOf(f.section),
                   quote: '', text: f.text, kind: f.kind || '', created: now, updated: now });
      keep(notes);
      render();
      toast(stored ? 'Saved to your notes' : 'Saved for this visit only (this browser blocks storage)');
    },
    find: function (section, kind) {
      var hit = null;
      all().forEach(function (n) { if (n.slug === slug && n.section === section && (!kind || n.kind === kind)) hit = n; });
      return hit;
    },
    count: function () { return all().filter(function (n) { return n.slug === slug; }).length; },
    open: function () { openPanel(); }
  };

  // another tab changed the notes
  window.addEventListener('storage', function (e) { if (e.key === KEY) render(); });

  var draft = null;
  try { draft = sessionStorage.getItem(DRAFT); } catch (e) { /* no draft */ }
  resetForm();
  if (draft) { area.value = draft; try { sessionStorage.setItem(DRAFT, draft); } catch (e) { /* kept in the box only */ } }
  render();
})();
