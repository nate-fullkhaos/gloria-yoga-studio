(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var modal = document.getElementById("book-contact-modal");
    var main = document.querySelector("main.home-main");
    if (!modal || !main) return;

    var lastFocus = null;

    function isBookCta(anchor) {
      if (!anchor || anchor.tagName !== "A") return false;
      if (!/\bbtn\b/.test(anchor.className)) return false;
      var t = (anchor.textContent || "").replace(/\s+/g, " ").trim();
      return /book/i.test(t);
    }

    function openModal(trigger) {
      lastFocus = trigger && trigger.focus ? trigger : null;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      var closeBtn = modal.querySelector(".site-modal__close");
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      }
      lastFocus = null;
    }

    main.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a || !main.contains(a) || !isBookCta(a)) return;
      e.preventDefault();
      openModal(a);
    });

    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-modal-close]")) closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || modal.hidden) return;
      e.preventDefault();
      closeModal();
    });
  });
})();
