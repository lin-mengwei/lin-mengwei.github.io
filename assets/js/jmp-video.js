// JMP video page (/jmp-video/): "Notes" side panel next to the video.
// Markup: _includes/jmp-video.html  ·  Styles: _sass/_jmp-video.scss
//
// Without JavaScript the notes are a plain <details> below the video.
// With JavaScript:
//   • wide screens (WIDE query): the button above the video opens the notes as a
//     side panel; the <details> is kept open and only shown/hidden by the
//     .is-open class on the stage (so CSS can animate it).
//   • narrow screens: the button is hidden and the <details> works as usual,
//     below the video. The open/closed state carries over when the width changes.
(function () {
  var WIDE = '(min-width: 960px)';

  var stage = document.querySelector('[data-jmp-stage]');
  if (!stage || !window.matchMedia) return;
  var panel = stage.querySelector('.jmp-making');
  var button = stage.querySelector('.jmp-notes-toggle');
  var body = stage.querySelector('.jmp-making-body');
  if (!panel || !button) return;

  var wide = window.matchMedia(WIDE);
  var open = panel.open;

  function render() {
    if (wide.matches) {
      panel.open = true;                       // content stays rendered; CSS hides it
      stage.classList.toggle('is-open', open);
    } else {
      panel.open = open;                       // native <details> below the video
      stage.classList.remove('is-open');
    }
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (wide.matches && !open) {
      panel.setAttribute('aria-hidden', 'true');
    } else {
      panel.removeAttribute('aria-hidden');
    }
  }

  function setOpen(next, moveFocus) {
    open = next;
    render();
    if (moveFocus && open && body) body.focus({ preventScroll: true });
  }

  button.addEventListener('click', function () {
    setOpen(!open, true);
  });

  // Narrow screens: the <details> summary is the toggle; remember its state.
  panel.addEventListener('toggle', function () {
    if (!wide.matches) open = panel.open;
  });

  // Escape closes the side panel and returns focus to the button.
  stage.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && open && wide.matches) {
      setOpen(false);
      button.focus();
    }
  });

  function onWidthChange() {
    stage.classList.remove('is-ready');        // no animation when the layout switches
    render();
    setTimeout(function () { stage.classList.add('is-ready'); }, 60);
  }
  if (wide.addEventListener) wide.addEventListener('change', onWidthChange);
  else if (wide.addListener) wide.addListener(onWidthChange);

  button.hidden = false;
  stage.classList.add('is-enhanced');
  onWidthChange();
})();
