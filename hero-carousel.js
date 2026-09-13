(() => {
  const root = document.querySelector("[data-hero-carousel]");
  if (!root) return;

  const slides = Array.from(root.querySelectorAll(".hero-carousel__slide"));
  if (slides.length < 2) return;

  if (window.__psyHeroTimer) {
    window.clearTimeout(window.__psyHeroTimer);
    window.__psyHeroTimer = null;
  }

  let index = slides.findIndex((slide) => slide.classList.contains("is-active"));
  if (index < 0) index = 0;
  let endedHandler = null;

  const IMAGE_MS = 7000;
  const VIDEO_MAX_MS = 12000;

  function isVideo(slide) {
    return slide && slide.tagName === "VIDEO";
  }

  function pauseVideos() {
    slides.forEach((slide) => {
      if (!isVideo(slide)) return;
      if (endedHandler) slide.removeEventListener("ended", endedHandler);
      slide.pause();
      try {
        slide.currentTime = 0;
      } catch (err) {
        /* ignore seek errors on unloaded media */
      }
    });
    endedHandler = null;
  }

  function show(next) {
    pauseVideos();
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === next);
    });
    index = next;
    const active = slides[index];
    if (isVideo(active)) {
      active.muted = true;
      const play = () => {
        const attempt = active.play();
        if (attempt && attempt.catch) attempt.catch(() => {});
      };
      if (active.readyState >= 2) play();
      else active.addEventListener("canplay", play, { once: true });
    }
  }

  function advance() {
    show((index + 1) % slides.length);
    schedule();
  }

  function schedule() {
    if (window.__psyHeroTimer) {
      window.clearTimeout(window.__psyHeroTimer);
      window.__psyHeroTimer = null;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const active = slides[index];
    if (isVideo(active)) {
      endedHandler = () => advance();
      active.addEventListener("ended", endedHandler, { once: true });
      window.__psyHeroTimer = window.setTimeout(advance, VIDEO_MAX_MS);
      return;
    }

    window.__psyHeroTimer = window.setTimeout(advance, IMAGE_MS);
  }

  show(index);
  schedule();
})();
