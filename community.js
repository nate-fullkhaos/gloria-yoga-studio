import { COMMUNITY_CARDS } from "./src/config/socials.js";

const ICONS = {
  "message-circle":
    '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  mail:
    '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  instagram:
    '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
  youtube:
    '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>'
};

function isHttpUrl(href) {
  return /^https?:/i.test(href);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCard(card) {
  const external = isHttpUrl(card.href);
  const relAttrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
  const highlightClass = card.highlight ? " community-card--highlight" : "";
  const badge = card.badge
    ? `<span class="community-card__badge">${escapeHtml(card.badge)}</span>`
    : "";
  const icon = ICONS[card.icon] || "";

  return `
    <li>
      <article class="community-card${highlightClass}">
        <div class="community-card__top">
          <span class="community-card__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" focusable="false">${icon}</svg>
          </span>
          ${badge}
        </div>
        <h3 class="community-card__title">${escapeHtml(card.title)}</h3>
        <p class="community-card__detail">${escapeHtml(card.detail)}</p>
        <a class="community-card__action" href="${escapeHtml(card.href)}"${relAttrs} aria-label="${escapeHtml(card.label)}">
          ${escapeHtml(card.action)}
        </a>
      </article>
    </li>
  `;
}

document.querySelectorAll("[data-community-grid]").forEach((grid) => {
  grid.innerHTML = COMMUNITY_CARDS.map(renderCard).join("");
});
