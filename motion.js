(function () {
  document.documentElement.classList.add("motion-js");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function reveal(el) {
    el.classList.add("motion-visible");
  }

  if (reduce) {
    document.querySelectorAll("[data-motion]").forEach(reveal);
    return;
  }

  var observer = new IntersectionObserver(
    function (entries, obs) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        obs.unobserve(entry.target);
      }
    },
    { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0 }
  );

  document.querySelectorAll("[data-motion]").forEach(function (el) {
    observer.observe(el);
  });
})();
