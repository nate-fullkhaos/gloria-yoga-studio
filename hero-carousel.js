(() => {
  const root = document.querySelector("[data-hero-carousel]");
  if (!root) return;

  const slides = Array.from(root.querySelectorAll(".hero-carousel__slide"));
  if (slides.length < 2) return;

  if (window.__psyHeroTimer) {
    window.clearInterval(window.__psyHeroTimer);
    window.__psyHeroTimer = null;
  }

  let index = slides.findIndex((slide) => slide.classList.contains("is-active"));
  if (index < 0) index = 0;

  function show(next) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === next);
    });
    index = next;
  }

  show(index);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  window.__psyHeroTimer = window.setInterval(() => {
    show((index + 1) % slides.length);
  }, 7000);
})();
