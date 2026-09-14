(() => {
  const root = document.querySelector("[data-breath]");
  if (!root) return;

  const circle = root.querySelector("[data-breath-circle]");
  const phaseEl = root.querySelector("[data-breath-phase]");
  const timerEl = root.querySelector("[data-breath-timer]");
  const toggle = root.querySelector("[data-breath-toggle]");
  const intention = root.querySelector("[data-breath-intention]");

  const INTENTIONS = [
    "Move with kindness.",
    "Let the breath be enough.",
    "Strength, then softness.",
    "Arrive in this body.",
    "Steady spine, easy mind.",
    "Practice without hurry.",
    "Inhale space. Exhale effort.",
    "One honest breath at a time.",
  ];

  const CYCLE = [
    { name: "Inhale", ms: 4000, scale: 1.18 },
    { name: "Hold", ms: 4000, scale: 1.18 },
    { name: "Exhale", ms: 4000, scale: 0.86 },
    { name: "Rest", ms: 4000, scale: 0.86 },
  ];

  const SESSION_MS = 60000;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const day = Math.floor(Date.now() / 86400000);
  if (intention) intention.textContent = INTENTIONS[day % INTENTIONS.length];

  let running = false;
  let timers = [];
  let startedAt = 0;
  let raf = 0;

  function text(el, value) {
    if (el) el.textContent = value;
  }

  function clearTimers() {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  }

  function setPhase(step) {
    text(phaseEl, step.name);
    root.dataset.phase = step.name.toLowerCase();
    if (circle && !reduce) {
      circle.style.transform = `scale(${step.scale})`;
    }
  }

  function paintTimer() {
    const remain = Math.max(0, SESSION_MS - (Date.now() - startedAt));
    const seconds = Math.min(60, Math.ceil(remain / 1000));
    if (seconds >= 60) text(timerEl, "1:00");
    else text(timerEl, `0:${String(seconds).padStart(2, "0")}`);
    if (running && remain > 0) raf = window.requestAnimationFrame(paintTimer);
  }

  function loop(index) {
    if (!running) return;
    const step = CYCLE[index % CYCLE.length];
    setPhase(step);
    timers.push(window.setTimeout(() => loop(index + 1), step.ms));
  }

  function stop(finished) {
    running = false;
    clearTimers();
    root.classList.remove("is-running");
    if (toggle) toggle.textContent = "Begin 1-minute breath";
    text(phaseEl, finished ? "Thank you" : "Ready when you are");
    text(timerEl, "1:00");
    if (circle) circle.style.transform = "scale(1)";
  }

  function start() {
    running = true;
    startedAt = Date.now();
    root.classList.add("is-running");
    if (toggle) toggle.textContent = "Close the practice";
    loop(0);
    paintTimer();
    timers.push(window.setTimeout(() => stop(true), SESSION_MS));
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      if (running) stop(false);
      else start();
    });
  }
})();
