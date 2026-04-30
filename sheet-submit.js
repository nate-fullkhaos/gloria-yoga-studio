(function () {
  "use strict";

  /** Approximate ceiling for Apps Script URLs as script src (+ callback param). Very long messages may need shortening. */
  var MAX_PAYLOAD_URL_CHARS = 6000;

  function endpoint() {
    return typeof window !== "undefined" && typeof window.GLORIA_SHEET_ENDPOINT === "string"
      ? window.GLORIA_SHEET_ENDPOINT.trim()
      : "";
  }

  function ensureFeedback(form) {
    var next = form.nextElementSibling;
    if (next && next.classList && next.classList.contains("form-feedback")) {
      return next;
    }
    var div = document.createElement("div");
    div.className = "form-feedback";
    div.setAttribute("role", "status");
    form.insertAdjacentElement("afterend", div);
    return div;
  }

  function setBusy(form, busy) {
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (busy) {
      if (!btn.dataset.defaultLabel) {
        btn.dataset.defaultLabel = btn.textContent.trim();
      }
      btn.disabled = true;
      btn.textContent = "Sending…";
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.defaultLabel || btn.textContent;
    }
  }

  function show(box, msg, variant) {
    box.textContent = msg;
    box.classList.remove("is-error", "is-success");
    box.classList.add(variant === "error" ? "is-error" : "is-success");
  }

  /**
   * Google Apps Script /exec redirects in ways that block reliable fetch+POST chaining in browsers
   * (manual redirect + Location isn’t reliably readable cross-origin).
   * JSONP via a transient <script src="…exec?callback=…&payload=…"> works after redirects like a normal navigation.
   */
  function submitJsonp(execUrl, payload) {
    var jsonStr = JSON.stringify(payload);
    var encoded = encodeURIComponent(jsonStr);
    if (encoded.length > MAX_PAYLOAD_URL_CHARS) {
      return Promise.reject(new Error("tooLarge"));
    }

    var cb = "gloriaSheet_" + Math.random().toString(36).slice(2) + "_" + Date.now();

    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = window.setTimeout(finishReject, 25000);

      function finishReject() {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        cleanup();
        reject(new Error("timeout"));
      }

      function cleanup() {
        try {
          delete window[cb];
        } catch (_) {}
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      }

      function finishOk(res) {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        cleanup();
        resolve(res);
      }

      window[cb] = function (res) {
        finishOk(res);
      };

      var script = document.createElement("script");
      script.async = true;
      script.onerror = function () {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        cleanup();
        reject(new Error("script error"));
      };

      var sep = execUrl.indexOf("?") >= 0 ? "&" : "?";
      script.src =
        execUrl + sep + "callback=" + encodeURIComponent(cb) + "&payload=" + encoded;

      document.head.appendChild(script);
    });
  }

  function submitPayload(payload, form) {
    var box = ensureFeedback(form);
    setBusy(form, true);
    box.textContent = "";
    box.classList.remove("is-error", "is-success");

    var url = endpoint();
    if (!url) {
      show(box, "Form is not connected yet — add your Apps Script URL in sheet-config.js.", "error");
      setBusy(form, false);
      return;
    }

    submitJsonp(url, payload)
      .then(function (result) {
        if (result && result.ok) {
          show(box, "Thanks — your details were submitted.", "ok");
          form.reset();
        } else {
          var hint =
            result && result.error
              ? " Something went wrong. Please try again or email us directly."
              : " Could not send. Check your connection and try again.";
          show(box, "We couldn’t submit the form." + hint, "error");
        }
      })
      .catch(function (err) {
        var msg =
          err && String(err.message) === "tooLarge"
            ? "Your message is too long for our web form — please shorten it or email us directly."
            : "Could not reach the server. Check your connection and try again.";
        show(box, msg, "error");
      })
      .finally(function () {
        setBusy(form, false);
      });
  }

  function onContact(ev) {
    var form = ev.target;
    if (!(form instanceof HTMLFormElement)) return;
    ev.preventDefault();

    if (!endpoint()) {
      show(ensureFeedback(form), "Form is not connected yet — add your Apps Script URL in sheet-config.js.", "error");
      return;
    }

    var fd = new FormData(form);
    submitPayload(
      {
        form: "contact",
        name: String(fd.get("name") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        phone: String(fd.get("phone") || "").trim(),
        program: String(fd.get("program") || "").trim(),
        message: String(fd.get("message") || "").trim(),
      },
      form,
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("form.contact-form").forEach(function (form) {
      form.addEventListener("submit", onContact);
    });
  });
})();
