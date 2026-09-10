(() => {
  const MAPS_URL = "https://maps.app.goo.gl/9u9xJYySYaHkw9UM9";
  const WRITE_URL = "https://search.google.com/local/writereview?cid=501252956521389804";

  const GOOGLE_REVIEWS = [
    {
      author: "Anjeline Jose",
      rating: 5,
      relativeTime: "a month ago",
      text: "An energising session that turned out to be a surprisingly intense full-body workout. The sequence was well paced, leaving me feeling both challenged and rejuvenated. Gloria is an amazing teacher and her studio has the perfect ambience."
    },
    {
      author: "Samantha Talwar",
      rating: 5,
      relativeTime: "a month ago",
      text: "Great session! Felt rejuvenated and had the best sleep in months after class. I had highly underestimated the power of a relaxed body and mind to sleep well. Gloria's class gives me new insights about my body and mind."
    },
    {
      author: "Ann Dehnugar",
      rating: 5,
      relativeTime: "4 weeks ago",
      text: "Best Yoga class in town. Gloria is attentive, knowledgeable and created a wonderful environment. Highly recommended Psyyogashala."
    },
    {
      author: "Karthika Jayakumar",
      rating: 5,
      relativeTime: "a month ago",
      text: "Grateful to dear yogini Gloria for being a great instructor. Every session leaves me feeling physically stronger, mentally calmer, and spiritually uplifted. The attention given to proper alignment, breathing techniques, and the philosophy of yoga makes the training truly holistic."
    },
    {
      author: "Smitha Raj",
      rating: 5,
      relativeTime: "4 weeks ago",
      text: "I’ve really enjoyed my yoga sessions with Gloria. She is a very experienced and dedicated teacher, and her way of teaching is quite different from regular yoga classes. She uses different props which makes the sessions really effective."
    },
    {
      author: "Riya Tellis",
      rating: 5,
      relativeTime: "a month ago",
      text: "It’s been a month since I’ve started yoga lessons with Gloria, and with her studio open now it’s such a bonus. The studio is calming, has fresh breeze surrounded by trees and natural sunlight. She is a wonderful teacher, very friendly and approachable."
    },
    {
      author: "Lakshmi DK",
      rating: 5,
      relativeTime: "a month ago",
      text: "I recently tried yoga here for the very first time, and it was such a great experience!! Gloria is incredibly passionate about what she does, and her experience really shows throughout the session. It was challenging in the best way."
    },
    {
      author: "Surendra Kumar",
      rating: 5,
      relativeTime: "a month ago",
      text: "A dedicated and focused teacher. Attention to detail and is great with her students."
    },
    {
      author: "Prathima Naik",
      rating: 5,
      relativeTime: "a month ago",
      text: "Always she is the best yoga trainer in town."
    },
    {
      author: "Sowmya Raju",
      rating: 5,
      relativeTime: "a month ago",
      text: "I’ve been attending Gloria's yoga classes for a year now—even with a short gap in between—and returning to the mat has always been such a welcoming experience."
    }
  ];

  const root = document.querySelector("[data-google-reviews]");
  if (!root) return;

  const fallback = root.querySelector("[data-reviews-fallback]");
  const carousel = root.querySelector("[data-carousel]");
  const track = root.querySelector(".carousel-track");
  const dots = root.querySelector(".carousel-dots") || document.querySelector(".carousel-dots");

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function stars(count) {
    const rating = Math.max(0, Math.min(5, Number(count) || 5));
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }

  if (!GOOGLE_REVIEWS.length) {
    if (fallback) fallback.hidden = false;
    if (carousel) carousel.remove();
    if (dots) dots.remove();
    return;
  }

  if (fallback) fallback.remove();
  if (carousel) carousel.hidden = false;
  if (dots) dots.hidden = false;

  if (!track) return;

  track.innerHTML = GOOGLE_REVIEWS.map((review) => {
    const author = escapeHtml(review.author || "Google reviewer");
    const quote = escapeHtml(review.text || "");
    const time = review.relativeTime ? escapeHtml(review.relativeTime) : "";
    const meta = time ? `${author} · ${time}` : author;
    return `
      <article class="testimonial-card">
        <div class="testimonial-stars" aria-hidden="true">${stars(review.rating)}</div>
        <p class="testimonial-quote">“${quote}”</p>
        <p class="testimonial-meta">${meta}</p>
        <a class="testimonial-source" href="${MAPS_URL}" target="_blank" rel="noopener noreferrer">Posted on Google</a>
      </article>
    `;
  }).join("");

  const actions = document.createElement("div");
  actions.className = "button-row center-row google-reviews-actions";
  actions.innerHTML = `
    <a class="btn btn-primary" href="${MAPS_URL}" target="_blank" rel="noopener noreferrer">See all 16 on Google</a>
    <a class="btn btn-light" href="${WRITE_URL}" target="_blank" rel="noopener noreferrer">Write a Review</a>
  `;
  root.appendChild(actions);
})();
