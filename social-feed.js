(() => {
  const root = document.querySelector("[data-social-feed]");
  if (!root) return;

  const grid = root.querySelector("[data-social-grid]");
  const filters = root.querySelector("[data-social-filters]");
  const status = root.querySelector("[data-social-status]");
  const dialog = root.querySelector("[data-social-player]");
  const frame = root.querySelector("[data-social-frame]");
  const closeBtn = root.querySelector("[data-social-close]");

  const FALLBACK = {
    updatedAt: null,
    sources: { youtube: true, instagram: false },
    profiles: [
      {
        network: "instagram",
        handle: "@psyyogshala",
        label: "Studio on Instagram",
        url: "https://www.instagram.com/psyyogshala/",
        image: "Images/studio-hero-community.jpg",
      },
      {
        network: "instagram",
        handle: "@psyyogi",
        label: "Gloria on Instagram",
        url: "https://www.instagram.com/psyyogi/",
        image: "Images/instructor.png",
      },
      {
        network: "facebook",
        handle: "psyyogshala",
        label: "Studio on Facebook",
        url: "https://www.facebook.com/psyyogshala",
        image: "Images/studio-hero-room.jpg",
      },
      {
        network: "youtube",
        handle: "@psyyogshala",
        label: "YouTube channel",
        url: "https://www.youtube.com/@psyyogshala",
        image: "Images/hero3.jpg",
      },
    ],
    posts: [
      {
        id: "yt-3NIUflHCSdo",
        network: "youtube",
        title: "Forward Bending Group Class",
        url: "https://www.youtube.com/watch?v=3NIUflHCSdo",
        image: "https://i.ytimg.com/vi/3NIUflHCSdo/hqdefault.jpg",
        isShort: false,
      },
      {
        id: "yt-fU8hYW1vKMM",
        network: "youtube",
        title: "Sunrise Flow",
        url: "https://www.youtube.com/shorts/fU8hYW1vKMM",
        image: "https://i.ytimg.com/vi/fU8hYW1vKMM/hqdefault.jpg",
        isShort: true,
      },
      {
        id: "yt-Bov1tFa6zSg",
        network: "youtube",
        title: "Deep in Practice",
        url: "https://www.youtube.com/shorts/Bov1tFa6zSg",
        image: "https://i.ytimg.com/vi/Bov1tFa6zSg/hqdefault.jpg",
        isShort: true,
      },
    ],
  };

  let feed = FALLBACK;
  let active = "all";

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function youtubeId(url) {
    const match = String(url).match(/(?:v=|shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return match ? match[1] : "";
  }

  function relativeTime(iso) {
    if (!iso) return "Latest";
    const delta = Date.now() - Date.parse(iso);
    if (!Number.isFinite(delta) || delta < 0) return "Just posted";
    const hours = Math.round(delta / 3600000);
    if (hours < 1) return "Just posted";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 14) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function visiblePosts() {
    if (active === "all") return feed.posts;
    return feed.posts.filter((post) => post.network === active);
  }

  function visibleProfiles() {
    if (active === "all" || active === "instagram" || active === "facebook") {
      return feed.profiles.filter((profile) => {
        if (active === "all") return profile.network !== "youtube";
        return profile.network === active;
      });
    }
    return [];
  }

  function render() {
    if (!grid) return;
    const posts = visiblePosts();
    const profiles = visibleProfiles();
    const [featured, ...rest] = posts;
    const cards = [];

    if (featured && active !== "facebook") {
      const videoId = featured.network === "youtube" ? youtubeId(featured.url) : "";
      const playable = Boolean(videoId);
      const tag = playable ? "button" : "a";
      const extra = playable
        ? `type="button" data-video-id="${escapeHtml(videoId)}"`
        : `href="${escapeHtml(featured.url)}" target="_blank" rel="noopener noreferrer"`;
      cards.push(`
        <${tag} class="social-card social-card--${featured.network} social-card--feature" ${extra}>
          <img src="${escapeHtml(featured.image)}" alt="" loading="lazy">
          <span class="social-card__shade"></span>
          ${playable ? '<span class="social-card__play" aria-hidden="true"></span>' : ""}
          <span class="social-card__network">${escapeHtml(featured.network)}${featured.isShort ? " short" : ""}</span>
          <span class="social-card__copy">
            <strong>${escapeHtml(featured.title)}</strong>
            <em>${escapeHtml(relativeTime(featured.publishedAt))}${featured.views ? ` · ${featured.views} views` : ""}</em>
          </span>
        </${tag}>
      `);
    }

    const remaining = featured && active !== "facebook" ? rest : posts;

    profiles.forEach((profile) => {
      cards.push(`
        <a class="social-card social-card--profile social-card--${profile.network}" href="${escapeHtml(profile.url)}" target="_blank" rel="noopener noreferrer">
          <img src="${escapeHtml(profile.image)}" alt="" loading="lazy">
          <span class="social-card__shade"></span>
          <span class="social-card__network">${escapeHtml(profile.network)}</span>
          <span class="social-card__copy">
            <strong>${escapeHtml(profile.handle)}</strong>
            <em>${escapeHtml(profile.label)}</em>
          </span>
        </a>
      `);
    });

    remaining.forEach((post) => {
      const videoId = post.network === "youtube" ? youtubeId(post.url) : "";
      const playable = Boolean(videoId);
      const tag = playable ? "button" : "a";
      const extra = playable
        ? `type="button" data-video-id="${escapeHtml(videoId)}"`
        : `href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer"`;
      cards.push(`
        <${tag} class="social-card social-card--${post.network}" ${extra}>
          <img src="${escapeHtml(post.image)}" alt="" loading="lazy">
          <span class="social-card__shade"></span>
          ${playable ? '<span class="social-card__play" aria-hidden="true"></span>' : ""}
          <span class="social-card__network">${escapeHtml(post.network)}${post.isShort ? " short" : ""}</span>
          <span class="social-card__copy">
            <strong>${escapeHtml(post.title)}</strong>
            <em>${escapeHtml(relativeTime(post.publishedAt))}${post.views ? ` · ${post.views} views` : ""}</em>
          </span>
        </${tag}>
      `);
    });

    if (active === "facebook") {
      cards.push(`
        <div class="social-card social-card--facebook-embed">
          <iframe
            title="PsyYogshala on Facebook"
            src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fpsyyogshala&tabs=timeline&width=500&height=560&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          ></iframe>
        </div>
      `);
    }

    grid.innerHTML = cards.join("");

    if (!posts.length && active === "youtube") {
      setStatus("YouTube is quiet right now — follow the channel for the next class film.");
    } else if (!posts.length && active === "instagram" && !feed.sources.instagram) {
      setStatus("Instagram photos appear here automatically when a studio access token is connected. Follow @psyyogshala and @psyyogi in the meantime.");
    } else if (feed.sources.instagram && feed.sources.youtube) {
      setStatus("Live from Instagram and YouTube · refreshed through the day");
    } else if (feed.sources.youtube) {
      setStatus("Live from YouTube · Instagram and Facebook profiles stay one tap away");
    } else {
      setStatus("Follow the studio across Instagram, YouTube, and Facebook");
    }
  }

  function openVideo(id) {
    if (!dialog || !frame) {
      window.open(`https://www.youtube.com/watch?v=${id}`, "_blank", "noopener,noreferrer");
      return;
    }
    frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    if (typeof dialog.showModal === "function") dialog.showModal();
  }

  function closeVideo() {
    if (frame) frame.src = "";
    if (dialog && dialog.open) dialog.close();
  }

  if (filters) {
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-social-filter]");
      if (!button) return;
      active = button.getAttribute("data-social-filter") || "all";
      filters.querySelectorAll("[data-social-filter]").forEach((node) => {
        node.setAttribute("aria-pressed", node === button ? "true" : "false");
      });
      render();
    });
  }

  if (grid) {
    grid.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-video-id]");
      if (!trigger) return;
      openVideo(trigger.getAttribute("data-video-id"));
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closeVideo);
  if (dialog) {
    dialog.addEventListener("close", () => {
      if (frame) frame.src = "";
    });
  }

  fetch("/api/social-feed", { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error("feed");
      return response.json();
    })
    .then((payload) => {
      if (payload && Array.isArray(payload.posts)) feed = payload;
      render();
    })
    .catch(() => {
      render();
    });
})();
