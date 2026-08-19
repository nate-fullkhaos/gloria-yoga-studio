(() => {
  const root = document.querySelector('[data-carousel]');
  if (!root) return;

  const viewport = root.querySelector('.carousel-viewport');
  const track = root.querySelector('.carousel-track');
  const slides = Array.from(root.querySelectorAll('.testimonial-card'));
  const prevBtn = root.querySelector('.carousel-prev');
  const nextBtn = root.querySelector('.carousel-next');
  const dotsEl =
    root.closest('.center-copy')?.querySelector('.carousel-dots') ??
    document.querySelector('.carousel-dots');

  let index = 0;
  let dotCount = -1;

  function getPerView() {
    return window.matchMedia('(min-width: 681px)').matches ? 2 : 1;
  }

  function getGapPx() {
    const g = getComputedStyle(track).gap;
    const n = parseFloat(g);
    return Number.isFinite(n) ? n : 12;
  }

  function maxStart() {
    return Math.max(0, slides.length - getPerView());
  }

  function cardWidthPx() {
    const V = viewport.getBoundingClientRect().width;
    const perView = getPerView();
    const gap = getGapPx();
    if (perView === 2) {
      return (V - gap) / 2;
    }
    return V;
  }

  function stepPx() {
    return cardWidthPx() + getGapPx();
  }

  function updateTransform() {
    track.style.transform = `translateX(-${index * stepPx()}px)`;
  }

  function rebuildDotsIfNeeded() {
    if (!dotsEl) return;
    const count = maxStart() + 1;

    if (count !== dotCount || dotsEl.childElementCount !== count) {
      dotCount = count;
      dotsEl.innerHTML = '';

      for (let i = 0; i < count; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('role', 'tab');
        btn.className = 'carousel-dot';
        btn.setAttribute('aria-label', `Go to testimonial slide ${i + 1}`);
        btn.addEventListener('click', () => go(i));
        dotsEl.appendChild(btn);
      }
    }

    updateDotStates();
  }

  function updateDotStates() {
    if (!dotsEl) return;
    dotsEl.querySelectorAll('.carousel-dot').forEach((btn, i) => {
      const active = i === index;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.tabIndex = active ? 0 : -1;
    });
  }

  function updateButtons() {
    const max = maxStart();
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= max;
  }

  function go(n) {
    const max = maxStart();
    index = Math.max(0, Math.min(max, n));
    updateTransform();
    updateDotStates();
    updateButtons();
  }

  function setSlideWidths() {
    const w = cardWidthPx();
    slides.forEach((slide) => {
      slide.style.flex = `0 0 ${w}px`;
      slide.style.width = `${w}px`;
    });
    if (index > maxStart()) {
      index = maxStart();
    }
    updateTransform();
    rebuildDotsIfNeeded();
    updateButtons();
  }

  prevBtn.addEventListener('click', () => go(index - 1));
  nextBtn.addEventListener('click', () => go(index + 1));

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) go(index - 1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < maxStart()) go(index + 1);
    }
  });

  const mq = window.matchMedia('(min-width: 681px)');
  mq.addEventListener('change', () => setSlideWidths());

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => setSlideWidths());
    ro.observe(viewport);
  } else {
    window.addEventListener('resize', setSlideWidths, { passive: true });
  }

  setSlideWidths();
})();
