// Name pronunciation using Web Speech API
(function() {
  function speak(text, rate) {
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = rate || 0.6;
    speechSynthesis.speak(u);
  }

  document.addEventListener('DOMContentLoaded', function() {
    var fullBtn = document.getElementById('pronounce-full');
    var mengBtn = document.getElementById('pronounce-meng');
    if (fullBtn) fullBtn.addEventListener('click', function() { speak('孟蔚', 0.55); });
    if (mengBtn) mengBtn.addEventListener('click', function() { speak('孟', 0.5); });
  });
})();
