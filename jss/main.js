document.addEventListener("DOMContentLoaded", () => {
  const clickLayer = document.getElementById("clickLayer");
  const envelope = document.querySelector(".envelope");
  const screen = document.getElementById("envelopeScreen");
  const content = document.getElementById("content");

  initCountdownTimer();
  initGalleryLightbox();

  clickLayer.addEventListener("click", () => {
    // Prevent multiple clicks
    if (envelope.classList.contains("open")) return;
    
    // Hide hint immediately
    const hint = document.querySelector(".envelope-hint");
    if (hint) hint.style.opacity = "0";
    
    // Start envelope opening animation
    envelope.classList.add("open");

    // Wait for envelope to open, then fade screen and show content
    setTimeout(() => {
      screen.style.opacity = "0";
      
      setTimeout(() => {
        content.classList.add("show");
        document.body.style.overflow = "auto";

        // Ensure hero video starts (some browsers need a nudge)
        const heroVideo = document.querySelector(".page__video");
        heroVideo?.play?.().catch(() => {});
      }, 300);
    }, 800);

    // Remove screen after fade completes
    setTimeout(() => {
      screen.remove();
    }, 2000);
  });
});

function initCountdownTimer() {
  const daysEl = document.getElementById("cdDays");
  const hoursEl = document.getElementById("cdHours");
  const minsEl = document.getElementById("cdMins");
  const secsEl = document.getElementById("cdSecs");
  const boxes = document.querySelectorAll(".tbox");

  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  // Muhurtham: 23 April 2026, 8:30 AM
  const target = new Date("April 23, 2026 08:30:00").getTime();

  const pad2 = (n) => String(n).padStart(2, "0");

  const tick = () => {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minsEl.textContent = "00";
      secsEl.textContent = "00";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    daysEl.textContent = pad2(days);
    hoursEl.textContent = pad2(hours);
    minsEl.textContent = pad2(mins);
    secsEl.textContent = pad2(secs);

    boxes.forEach((b) => {
      b.classList.remove("pulse");
      void b.offsetWidth;
      b.classList.add("pulse");
    });
  };

  tick();
  setInterval(tick, 1000);
}

function initGalleryLightbox() {
  const items = Array.from(document.querySelectorAll(".gallery__item"));
  const lightbox = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lbPrev");
  const nextBtn = document.getElementById("lbNext");

  if (!items.length || !lightbox || !img || !closeBtn || !prevBtn || !nextBtn) return;

  const sources = items.map((b) => b.getAttribute("data-full")).filter(Boolean);
  let idx = 0;

  const openAt = (i) => {
    idx = (i + sources.length) % sources.length;
    img.src = sources[idx];
    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    img.src = "";
  };

  const prev = () => openAt(idx - 1);
  const next = () => openAt(idx + 1);

  items.forEach((b, i) => b.addEventListener("click", () => openAt(i)));
  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });

  // Touch swipe support
  let startX = 0;
  let startY = 0;
  lightbox.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) prev();
    else next();
  }, { passive: true });
}
