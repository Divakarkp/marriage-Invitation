/**
 * YouTube video id from the watch URL: https://www.youtube.com/watch?v=THIS_PART
 * Upload as Unlisted if you do not want it in search. Embed must be allowed (default for normal uploads).
 */
const HERO_YOUTUBE_VIDEO_ID = "1mVoid9lyH8";

let heroYoutubeInitStarted = false;
let youtubeIframeApiPromise = null;

function ensureYoutubeIframeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (!youtubeIframeApiPromise) {
    youtubeIframeApiPromise = new Promise((resolve) => {
      const prior = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        try {
          if (typeof prior === "function") prior();
        } catch (_) {
          /* ignore */
        }
        resolve();
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return youtubeIframeApiPromise;
}

function tryRequestHighestYoutubeQuality(player) {
  if (!player) return;
  try {
    const levels = player.getAvailableQualityLevels?.();
    if (levels && levels.length > 0) {
      player.setPlaybackQuality(levels[0]);
      return;
    }
  } catch (_) {
    /* fall through */
  }
  try {
    player.setPlaybackQuality?.("highres");
  } catch (_) {
    /* YouTube may ignore; adaptive bitrate still applies */
  }
}

function loadHeroYoutube(autoplay) {
  const mount = document.getElementById("heroYoutube");
  if (!mount || heroYoutubeInitStarted) return;
  const id = HERO_YOUTUBE_VIDEO_ID.trim();
  if (!id) return;

  heroYoutubeInitStarted = true;

  const origin =
    window.location.protocol === "https:" || window.location.protocol === "http:"
      ? window.location.origin
      : undefined;

  ensureYoutubeIframeAPI().then(() => {
    const playerVars = {
      autoplay: autoplay ? 1 : 0,
      mute: 1,
      playsinline: 1,
      loop: 1,
      playlist: id,
      rel: 0,
      modestbranding: 1,
      enablejsapi: 1,
    };
    if (origin) playerVars.origin = origin;

    new YT.Player("heroYoutube", {
      videoId: id,
      width: "100%",
      height: "100%",
      host: "https://www.youtube.com",
      playerVars,
      events: {
        onReady: (e) => {
          tryRequestHighestYoutubeQuality(e.target);
          if (autoplay) e.target.playVideo();
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) {
            tryRequestHighestYoutubeQuality(e.target);
          }
        },
      },
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const clickLayer = document.getElementById("clickLayer");
  const envelope = document.querySelector(".envelope");
  const screen = document.getElementById("envelopeScreen");
  const content = document.getElementById("content");

  initCountdownTimer();
  initGalleryLightbox();
  initHeroYoutubeFullscreen();

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

        loadHeroYoutube(true);
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

function initHeroYoutubeFullscreen() {
  const btn = document.getElementById("heroVideoFs");
  const wrap = document.getElementById("heroYoutubeWrap");
  if (!btn || !wrap || btn.dataset.fsBound === "1") return;
  btn.dataset.fsBound = "1";

  const lockLandscape = () => {
    const o = screen.orientation;
    if (o && typeof o.lock === "function") {
      o.lock("landscape").catch(() => {});
    }
  };

  const openFullscreen = () => {
    if (!HERO_YOUTUBE_VIDEO_ID.trim()) return;
    if (!heroYoutubeInitStarted) {
      loadHeroYoutube(true);
    }
    const req =
      wrap.requestFullscreen ||
      wrap.webkitRequestFullscreen ||
      wrap.msRequestFullscreen;
    if (req) {
      Promise.resolve(req.call(wrap))
        .then(() => lockLandscape())
        .catch(() => {});
    }
  };

  btn.addEventListener("click", openFullscreen);

  const onFullscreenChange = () => {
    const fsEl =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement;
    if (fsEl === wrap) {
      lockLandscape();
    }
  };

  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);
  document.addEventListener("MSFullscreenChange", onFullscreenChange);
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
