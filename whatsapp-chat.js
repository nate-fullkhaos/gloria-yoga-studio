(function () {
  var selector = '.whatsapp-fab, .contact-whatsapp-btn';
  var phoneDigits = '919108983777';
  var httpsChat = 'https://api.whatsapp.com/send?phone=' + phoneDigits;

  document.addEventListener(
    'click',
    function (e) {
      var anchor = e.target.closest(selector);
      if (!anchor) return;
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();

      var appUrl = 'whatsapp://send?phone=' + phoneDigits;
      var skipFallback = false;

      function markOpened() {
        skipFallback = true;
      }

      window.addEventListener('blur', markOpened);
      window.addEventListener('pagehide', markOpened);

      function onVisibility() {
        if (document.hidden) markOpened();
      }

      document.addEventListener('visibilitychange', onVisibility);

      var iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText =
        'position:fixed;width:0;height:0;border:0;clip:rect(0,0,0,0);overflow:hidden;margin:0;padding:0;';
      document.body.appendChild(iframe);
      iframe.src = appUrl;

      window.setTimeout(function () {
        window.removeEventListener('blur', markOpened);
        window.removeEventListener('pagehide', markOpened);
        document.removeEventListener('visibilitychange', onVisibility);
        iframe.remove();

        if (!skipFallback) {
          window.open(httpsChat, '_blank', 'noopener,noreferrer');
        }
      }, 900);
    },
    false
  );
})();
