(function () {
  var sections = document.querySelectorAll('.trans-section[data-collapsible]');
  if (!sections.length) return;

  // After expanding, glide the section title to this fraction of the viewport height from the top
  var TITLE_POS = 0.2;
  var scrollRaf = null;
  var stopScroll = null;

  function alignTitle(sec) {
    var title = sec.querySelector('.trans-section-title');
    var start = performance.now();
    var events = ['wheel', 'touchstart', 'keydown'];

    if (stopScroll) stopScroll();

    function stop() {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = null;
      events.forEach(function (t) { window.removeEventListener(t, stop); });
      stopScroll = null;
    }
    stopScroll = stop;
    // any manual scrolling by the user cancels the glide
    events.forEach(function (t) { window.addEventListener(t, stop, { passive: true }); });

    function step(now) {
      var elapsed = now - start;
      var desired = title.getBoundingClientRect().top + window.pageYOffset - window.innerHeight * TITLE_POS;
      desired = Math.max(0, desired);
      var cur = window.pageYOffset;
      var diff = desired - cur;

      if (Math.abs(diff) > 1) {
        window.scrollTo({ top: cur + diff * 0.2, behavior: 'instant' });
      }

      // keep following while the section is still growing, give up after 1.2s
      if (elapsed < 1200 && (elapsed < 600 || Math.abs(diff) > 1)) {
        scrollRaf = requestAnimationFrame(step);
      } else {
        stop();
      }
    }
    scrollRaf = requestAnimationFrame(step);
  }

  function setExpanded(sec, expanded, animate) {
    var body = sec.querySelector('.trans-body');
    var btn = sec.querySelector('.trans-toggle');
    var isCollapsed = sec.classList.contains('is-collapsed');
    if (expanded === !isCollapsed) return;

    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');

    if (!animate) {
      body.style.maxHeight = '';
      sec.classList.toggle('is-collapsed', !expanded);
      return;
    }

    if (expanded) {
      body.style.maxHeight = body.scrollHeight + 'px';
      sec.classList.remove('is-collapsed');
      var done = function (e) {
        if (e.propertyName !== 'max-height') return;
        body.style.maxHeight = '';
        body.removeEventListener('transitionend', done);
      };
      body.addEventListener('transitionend', done);
    } else {
      body.style.maxHeight = body.scrollHeight + 'px';
      void body.offsetHeight;
      sec.classList.add('is-collapsed');
      body.style.maxHeight = '';
    }
  }

  function sectionFromHash() {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    if (!id) return null;
    var el = document.getElementById(id);
    return el && el.matches('.trans-section[data-collapsible]') ? el : null;
  }

  var target = sectionFromHash();

  sections.forEach(function (sec) {
    var body = sec.querySelector('.trans-body');
    var btn = sec.querySelector('.trans-toggle');

    if (sec !== target) setExpanded(sec, false, false);

    btn.addEventListener('click', function () {
      var willExpand = sec.classList.contains('is-collapsed');
      setExpanded(sec, willExpand, true);
      if (willExpand) alignTitle(sec);
    });

    var collapseBtn = sec.querySelector('.trans-collapse-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        setExpanded(sec, false, true);
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    body.addEventListener('click', function (e) {
      if (!sec.classList.contains('is-collapsed')) return;
      if (e.target.closest('a')) return;
      setExpanded(sec, true, true);
      alignTitle(sec);
    });
  });

  if (target) target.scrollIntoView();

  window.addEventListener('hashchange', function () {
    var sec = sectionFromHash();
    if (sec) {
      setExpanded(sec, true, true);
      alignTitle(sec);
    }
  });
})();
