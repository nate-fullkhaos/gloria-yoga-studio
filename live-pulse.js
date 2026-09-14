(() => {
  const root = document.querySelector("[data-live-pulse]");
  if (!root) return;

  const TZ = "Asia/Kolkata";
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const BOOK_URL = "https://zohosecurepay.in/checkout/n10kfpui-qpbxptgtydyrc/Drop-In-Pass";

  const kicker = root.querySelector("[data-pulse-kicker]");
  const title = root.querySelector("[data-pulse-title]");
  const meta = root.querySelector("[data-pulse-meta]");
  const countdown = root.querySelector("[data-pulse-countdown]");
  const cta = root.querySelector("[data-pulse-cta]");

  function text(el, value) {
    if (el) el.textContent = value == null ? "" : String(value);
  }

  function partsInKolkata(date) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const bag = {};
    fmt.formatToParts(date).forEach((part) => {
      if (part.type !== "literal") bag[part.type] = part.value;
    });
    return bag;
  }

  function parseClock(label) {
    const match = String(label || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridian = match[3].toUpperCase();
    if (meridian === "PM" && hours !== 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  function parseRange(range) {
    const [startLabel, endLabel] = String(range || "").split(" - ");
    const start = parseClock(startLabel);
    const end = parseClock(endLabel);
    if (start == null || end == null) return null;
    return { start, end, startLabel: startLabel.trim(), endLabel: endLabel.trim() };
  }

  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

  function kolkataDate(base, dayOffset, minutes) {
    const bag = partsInKolkata(base);
    const asIstNumbers = Date.UTC(
      Number(bag.year),
      Number(bag.month) - 1,
      Number(bag.day) + dayOffset,
      Math.floor(minutes / 60),
      minutes % 60,
      0
    );
    return new Date(asIstNumbers - IST_OFFSET_MS);
  }

  function formatRemain(ms) {
    if (ms <= 0) return "starting now";
    const total = Math.floor(ms / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }

  function flatten(days) {
    const items = [];
    days.forEach((day) => {
      const dayName = day.day;
      const dayIndex = DAYS.indexOf(dayName);
      if (dayIndex < 0) return;
      (day.slots || []).forEach((slot) => {
        const range = parseRange(slot.time);
        if (!range) return;
        items.push({
          dayIndex,
          dayName,
          title: slot.title,
          mode: slot.mode,
          ...range,
        });
      });
    });
    return items;
  }

  function occurrence(base, slot, dayOffset) {
    const startAt = kolkataDate(base, dayOffset, slot.start);
    const endAt = kolkataDate(base, dayOffset, slot.end);
    return { ...slot, startAt, endAt };
  }

  function pick(slots, now) {
    const bag = partsInKolkata(now);
    const todayIndex = DAYS.indexOf(bag.weekday);
    const candidates = [];

    for (let offset = 0; offset <= 8; offset += 1) {
      const weekday = (todayIndex + offset) % 7;
      slots
        .filter((slot) => slot.dayIndex === weekday)
        .forEach((slot) => candidates.push(occurrence(now, slot, offset)));
    }

    const live = candidates.find((item) => now >= item.startAt && now < item.endAt);
    if (live) return { state: "live", item: live };
    const upcoming = candidates.find((item) => item.startAt > now);
    if (upcoming) return { state: "next", item: upcoming };
    return { state: "rest", item: null };
  }

  function paint(state) {
    root.dataset.state = state.state;
    if (state.state === "live") {
      text(kicker, "Class in session");
      text(title, state.item.title);
      text(meta, `${state.item.startLabel} – ${state.item.endLabel} · ${state.item.mode}`);
      text(countdown, "Happening now in Mangaluru");
      if (cta) {
        cta.textContent = "Join this class";
        cta.href = BOOK_URL;
      }
      return;
    }

    if (state.state === "next") {
      text(kicker, "Next class");
      text(title, state.item.title);
      text(meta, `${state.item.dayName} · ${state.item.startLabel} · ${state.item.mode}`);
      text(countdown, `Begins in ${formatRemain(state.item.startAt - Date.now())}`);
      if (cta) {
        cta.textContent = "Reserve your mat";
        cta.href = BOOK_URL;
      }
      return;
    }

    text(kicker, "Studio rhythm");
    text(title, "A quiet day on the schedule");
    text(meta, "Monday–Friday flows in-studio and live online.");
    text(countdown, "See the weekly timetable");
    if (cta) {
      cta.textContent = "View programs";
      cta.href = "/programs";
    }
  }

  let slots = [];

  function tick() {
    paint(pick(slots, new Date()));
  }

  fetch("/schedule.json", { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error("schedule");
      return response.json();
    })
    .then((days) => {
      slots = flatten(days);
      tick();
      window.setInterval(tick, 1000);
    })
    .catch(() => {
      text(kicker, "Live in Mangaluru");
      text(title, "Guided Hatha, morning to twilight");
      text(meta, "Online and in-studio · Monday to Friday");
      text(countdown, "Open the weekly schedule");
      if (cta) {
        cta.textContent = "View programs";
        cta.href = "/programs";
      }
    });
})();
