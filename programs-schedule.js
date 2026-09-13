(() => {
  const root = document.querySelector("[data-weekly-schedule]");
  if (!root) return;

  function text(el, value) {
    el.textContent = value == null ? "" : String(value);
  }

  function renderStatus(message, isError) {
    root.replaceChildren();
    const p = document.createElement("p");
    p.className = isError
      ? "programs-weekly__status programs-weekly__status--error"
      : "programs-weekly__status";
    text(p, message);
    root.appendChild(p);
  }

  function renderSchedule(days) {
    if (!Array.isArray(days) || !days.length) {
      renderStatus("No classes are listed for this week yet.", false);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "programs-weekly__grid";

    days.forEach((day) => {
      const article = document.createElement("article");
      article.className = "programs-weekly-day";

      const heading = document.createElement("h3");
      heading.className = "programs-weekly-day__title";
      text(heading, day.day || "Day");
      article.appendChild(heading);

      const slots = Array.isArray(day.slots) ? day.slots : [];
      if (!slots.length) {
        const empty = document.createElement("p");
        empty.className = "programs-weekly-day__empty";
        text(empty, "No classes scheduled.");
        article.appendChild(empty);
        grid.appendChild(article);
        return;
      }

      const list = document.createElement("ul");
      list.className = "programs-weekly-slots";
      list.setAttribute("role", "list");

      slots.forEach((slot) => {
        const item = document.createElement("li");
        item.className = "programs-weekly-slot";

        const time = document.createElement("span");
        time.className = "programs-weekly-slot__time";
        text(time, slot.time);

        const name = document.createElement("span");
        name.className = "programs-weekly-slot__name";
        text(name, slot.title);

        const mode = document.createElement("span");
        mode.className = "programs-weekly-slot__mode";
        text(mode, slot.mode);

        item.append(time, name, mode);
        list.appendChild(item);
      });

      article.appendChild(list);
      grid.appendChild(article);
    });

    root.replaceChildren(grid);
  }

  fetch("/schedule.json", { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Schedule request failed");
      }
      return response.json();
    })
    .then(renderSchedule)
    .catch(() => {
      renderStatus("We couldn’t load the weekly schedule. Please try again shortly.", true);
    });
})();
