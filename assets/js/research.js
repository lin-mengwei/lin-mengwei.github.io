document.addEventListener("DOMContentLoaded", function () {
  // Abstract toggle → dual-image expansion
  var detailsList = document.querySelectorAll(".abstract-box");
  detailsList.forEach(function (detailsEl) {
    var card = detailsEl.closest(".research-card");
    if (!card) return;
    var imageBox = card.querySelector(".research-image-box.is-dual");
    if (!imageBox) return;
    detailsEl.addEventListener("toggle", function () {
      if (detailsEl.open) {
        imageBox.classList.add("expanded");
      } else {
        imageBox.classList.remove("expanded");
      }
    });
  });

  // Lightbox
  var lightbox = document.getElementById("research-lightbox");
  if (!lightbox) return;
  var lightboxImg = lightbox.querySelector("img");

  document.querySelectorAll(".research-image-box img").forEach(function (img) {
    img.addEventListener("click", function () {
      lightboxImg.src = this.src;
      lightbox.classList.add("is-active");
    });
  });

  lightbox.addEventListener("click", function () {
    lightbox.classList.remove("is-active");
    lightboxImg.src = "";
  });
});
