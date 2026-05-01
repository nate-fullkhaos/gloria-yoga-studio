(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var modal = document.getElementById("program-inquiry-modal");
    var form = document.getElementById("programs-inquiry-form");
    if (!modal || !form) return;

    var programSelect = form.querySelector('select[name="program"]');
    var titleEl = document.getElementById("program-inquiry-modal-title");
    var bodyEl = document.getElementById("program-inquiry-body");
    var thankEl = document.getElementById("program-inquiry-thankyou");
    var lastTrigger = null;

    function stripFormFeedback() {
      var next = form.nextElementSibling;
      if (next && next.classList && next.classList.contains("form-feedback")) {
        next.remove();
      }
    }

    function showFormView() {
      if (titleEl) titleEl.hidden = false;
      if (bodyEl) bodyEl.hidden = false;
      if (thankEl) thankEl.hidden = true;
      stripFormFeedback();
    }

    function showThankYouView() {
      if (titleEl) titleEl.hidden = true;
      if (bodyEl) bodyEl.hidden = true;
      if (thankEl) {
        thankEl.hidden = false;
        var p = thankEl.querySelector(".program-inquiry-thankyou__text");
        if (p && typeof p.focus === "function") {
          p.setAttribute("tabindex", "-1");
          p.focus();
        }
      }
    }

    form.addEventListener("psyyog-contact-success", function () {
      showThankYouView();
    });

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (lastTrigger && typeof lastTrigger.focus === "function") {
        lastTrigger.focus();
      }
      lastTrigger = null;
    }

    function openModal(programSlug, trigger) {
      lastTrigger = trigger || null;

      showFormView();
      form.reset();

      if (programSelect && programSlug) {
        programSelect.value = programSlug;
      }

      modal.hidden = false;
      document.body.style.overflow = "hidden";

      var closeBtn = modal.querySelector(".site-modal__close");
      if (closeBtn && typeof closeBtn.focus === "function") {
        closeBtn.focus();
      }
    }

    document.querySelectorAll("[data-program-inquiry]").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        var slug = trigger.getAttribute("data-program-inquiry") || "";
        openModal(slug, trigger);
      });
    });

    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-program-modal-close]")) closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || modal.hidden) return;
      e.preventDefault();
      closeModal();
    });
  });
})();
