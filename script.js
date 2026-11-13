/* ==========================================================================
   JEREMY MARTÍNEZ — PORTFOLIO
   Cielo nocturno ambiental + interacciones de la interfaz.
   ========================================================================== */

(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // El carrusel de proyectos se recalcula aquí abajo; esta referencia permite
  // llamarlo desde el controlador de pestañas cuando esa sección se hace visible.
  let refreshProjectsCarousel = () => {};

  /* ---------------- Intro: la estrella se dibuja y abre paso al sitio ---------------- */
  const introOverlay = document.getElementById("introOverlay");
  if (introOverlay) {
    const introDuration = prefersReducedMotion ? 500 : 3000;
    const dismissIntro = () => {
      introOverlay.classList.add("intro-hidden");
      document.body.classList.remove("is-intro-active");
      introOverlay.addEventListener(
        "transitionend",
        () => introOverlay.remove(),
        { once: true }
      );
      // Respaldo por si transitionend no dispara (pestaña oculta, etc.)
      setTimeout(() => introOverlay.remove(), 900);
    };
    setTimeout(dismissIntro, introDuration);
    // Permite saltar la intro con un clic o toque.
    introOverlay.addEventListener("click", dismissIntro, { once: true });
  } else {
    document.body.classList.remove("is-intro-active");
  }

  /* ---------------- Año en footer ---------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Header: fondo al hacer scroll ---------------- */
  const header = document.getElementById("siteHeader");
  const scrollBar = document.getElementById("scrollBar");
  const toTopBtn = document.getElementById("toTop");

  function onScroll() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

    if (header) header.classList.toggle("scrolled", scrollY > 12);
    if (scrollBar) scrollBar.style.width = progress + "%";
    if (toTopBtn) toTopBtn.classList.toggle("visible", scrollY > 600);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTopBtn) {
    toTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------- Menú móvil (dropdown bajo la cápsula) ---------------- */
  const navToggle = document.getElementById("navToggle");
  const navDropdown = document.getElementById("navDropdown");

  if (navToggle && navDropdown) {
    navToggle.addEventListener("click", () => {
      const isOpen = navDropdown.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navDropdown.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navDropdown.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Sitio por pestañas: una sola sección visible a la vez ---------------- */
  const tabTriggers = Array.from(document.querySelectorAll("[data-section]"));
  const tabPanels = Array.from(document.querySelectorAll("[data-tab]"));
  const validTabs = Array.from(new Set(tabPanels.map((p) => p.dataset.tab)));
  const DEFAULT_TAB = "inicio";

  function switchTab(tab, { updateHash = true } = {}) {
    if (!validTabs.includes(tab)) tab = DEFAULT_TAB;

    tabPanels.forEach((panel) => {
      panel.hidden = panel.dataset.tab !== tab;
    });

    tabTriggers.forEach((link) => {
      const isActive = link.dataset.section === tab;
      link.classList.toggle("active", isActive);
      if (link.getAttribute("role") === "tab") {
        link.setAttribute("aria-selected", String(isActive));
      }
    });

    if (navDropdown && navDropdown.classList.contains("open")) {
      navDropdown.classList.remove("open");
      if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    }

    window.scrollTo({ top: 0, behavior: "auto" });
    onScroll();
    if (tab === "proyectos") refreshProjectsCarousel();

    if (updateHash) {
      const url = `${location.pathname}${location.search}#${tab}`;
      history.pushState({ tab }, "", url);
    }
  }

  tabTriggers.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab(link.dataset.section);
    });
  });

  window.addEventListener("popstate", () => {
    switchTab((location.hash || `#${DEFAULT_TAB}`).slice(1), { updateHash: false });
  });

  const initialTab = (location.hash || `#${DEFAULT_TAB}`).slice(1);
  switchTab(initialTab, { updateHash: false });
  history.replaceState({ tab: validTabs.includes(initialTab) ? initialTab : DEFAULT_TAB }, "", `${location.pathname}${location.search}#${validTabs.includes(initialTab) ? initialTab : DEFAULT_TAB}`);

  /* ---------------- Cue de scroll en el hero ---------------- */
  const scrollCue = document.getElementById("scrollCue");
  if (scrollCue) {
    scrollCue.addEventListener("click", () => {
      const next = document.querySelector(".philosophy");
      if (next) next.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------- Revelado al hacer scroll ---------------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = Math.min((i % 6) * 60, 240);
            setTimeout(() => el.classList.add("is-visible"), prefersReducedMotion ? 0 : delay);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------------- Imágenes: aparecen con fundido cuando ya cargaron ---------------- */
  document.querySelectorAll(".project-img, .seal-photo").forEach((img) => {
    const show = () => img.classList.add("is-loaded");
    if (img.complete) {
      if (img.naturalWidth > 0) show();
    } else {
      img.addEventListener("load", show, { once: true });
    }
  });

  /* ---------------- Carrusel de proyectos ---------------- */
  const track = document.getElementById("projectsTrack");
  const prevBtn = document.getElementById("projPrev");
  const nextBtn = document.getElementById("projNext");
  const dotsWrap = document.getElementById("projectDots");

  if (track && prevBtn && nextBtn && dotsWrap) {
    const cards = Array.from(track.children);
    let dots = [];

    function step() {
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || "24");
      const cardWidth = cards[0].getBoundingClientRect().width;
      return cardWidth + gap;
    }

    // Cuántas tarjetas caben a la vez en el viewport actual del track.
    function getVisibleCount() {
      const s = step();
      if (!s) return 1;
      return Math.max(1, Math.min(cards.length, Math.round((track.clientWidth + parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || "24")) / s)));
    }

    // Solo existen (total - visibles + 1) posiciones de scroll alcanzables:
    // más allá de eso, varias tarjetas comparten la última posición.
    function getStopCount() {
      return Math.max(1, cards.length - getVisibleCount() + 1);
    }

    // (Re)construir los puntos según las posiciones realmente alcanzables.
    function buildDots() {
      const stopCount = getStopCount();
      if (dots.length === stopCount) return; // nada que reconstruir
      dotsWrap.innerHTML = "";
      dots = [];
      for (let i = 0; i < stopCount; i++) {
        const dot = document.createElement("button");
        dot.className = "carousel-dot";
        dot.type = "button";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Ir al proyecto ${i + 1}`);
        dot.addEventListener("click", () => {
          track.scrollTo({ left: cards[i].offsetLeft, behavior: prefersReducedMotion ? "auto" : "smooth" });
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
    }

    function updateArrows() {
      const max = track.scrollWidth - track.clientWidth - 2;
      prevBtn.disabled = track.scrollLeft <= 2;
      nextBtn.disabled = track.scrollLeft >= max;
    }

    prevBtn.addEventListener("click", () => {
      track.scrollBy({ left: -step(), behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
    nextBtn.addEventListener("click", () => {
      track.scrollBy({ left: step(), behavior: prefersReducedMotion ? "auto" : "smooth" });
    });

    function activeIndexFromScroll() {
      const stopCount = getStopCount();
      let idx = 0;
      let min = Infinity;
      for (let i = 0; i < stopCount; i++) {
        const d = Math.abs(cards[i].offsetLeft - track.scrollLeft);
        if (d < min) { min = d; idx = i; }
      }
      return idx;
    }

    let dotTicking = false;
    function updateActiveDot() {
      const idx = activeIndexFromScroll();
      dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
      dotTicking = false;
    }
    function queueDotUpdate() {
      if (dotTicking) return;
      dotTicking = true;
      requestAnimationFrame(updateActiveDot);
    }

    refreshProjectsCarousel = () => {
      buildDots();
      updateActiveDot();
      updateArrows();
    };
    refreshProjectsCarousel();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refreshProjectsCarousel, 150);
    });

    track.addEventListener("scroll", queueDotUpdate, { passive: true });
    updateActiveDot();

    track.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    updateArrows();
  }

  /* ---------------- Clic en correo: abre Gmail + copia al portapapeles ---------------- */
  const emailLink = document.getElementById("emailLink");
  if (emailLink) {
    let copyTipTimer;
    emailLink.addEventListener("click", (e) => {
      e.preventDefault();
      const email = emailLink.querySelector(".contact-email-text")?.textContent?.trim();
      if (!email) return;

      const subject = encodeURIComponent("Contacto desde tu portafolio");
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}`;
      const gmailWindow = window.open(gmailUrl, "_blank", "noopener,noreferrer");

      // Si el navegador bloquea la ventana (o no hay conexión a Gmail), usar mailto como respaldo
      if (!gmailWindow) {
        window.location.href = `mailto:${email}?subject=${subject}`;
      }

      if (navigator.clipboard) {
        navigator.clipboard.writeText(email).catch(() => {});
      }

      emailLink.classList.add("is-copied");
      clearTimeout(copyTipTimer);
      copyTipTimer = setTimeout(() => emailLink.classList.remove("is-copied"), 2200);
    });
  }

  /* ---------------- Cielo nocturno: estrellas + luna ---------------- */
  const canvas = document.getElementById("sky");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let width, height, dpr;
  let stars = [];
  let shootingStar = null;
  let mouseX = 0.5, mouseY = 0.5;
  let targetMouseX = 0.5, targetMouseY = 0.5;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = document.documentElement.scrollHeight;
    canvas.width = width * dpr;
    canvas.height = Math.min(height, window.innerHeight * 2.2) * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = canvas.height / dpr + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
  }

  function buildStars() {
    const area = width * (canvas.height / dpr);
    const count = Math.round(area / 9000);
    stars = Array.from({ length: Math.max(count, 60) }, () => ({
      x: Math.random() * width,
      y: Math.random() * (canvas.height / dpr),
      r: Math.random() * 1.3 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.25,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.015 + 0.006,
      parallax: Math.random() * 0.5 + 0.15,
    }));
  }

  /* Posiciones fijas de "cráteres" (proporcionales al radio, no aleatorias
     en cada frame, para que la luna no "tiemble"). */
  const MOON_CRATERS = [
    { dx: -0.34, dy: 0.2, cr: 0.17 },
    { dx: 0.1, dy: -0.3, cr: 0.11 },
    { dx: 0.32, dy: 0.02, cr: 0.09 },
    { dx: -0.06, dy: 0.42, cr: 0.075 },
    { dx: 0.4, dy: 0.34, cr: 0.06 },
    { dx: -0.4, dy: -0.12, cr: 0.055 },
  ];

  function drawMoon() {
    const mx = width * 0.87 + (mouseX - 0.5) * 14;
    const my = 128 + (mouseY - 0.5) * 10;
    const r = Math.min(52, width * 0.042);

    /* halo suave en dos capas */
    const glow = ctx.createRadialGradient(mx, my, 0, mx, my, r * 4.4);
    glow.addColorStop(0, "rgba(244,236,210,0.15)");
    glow.addColorStop(0.4, "rgba(244,236,210,0.05)");
    glow.addColorStop(1, "rgba(244,236,210,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, r * 4.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    /* esfera base, luz cálida arriba-izquierda */
    const moonGrad = ctx.createRadialGradient(mx - r * 0.35, my - r * 0.35, r * 0.08, mx, my, r * 1.05);
    moonGrad.addColorStop(0, "#fffaf0");
    moonGrad.addColorStop(0.45, "#f2e9cf");
    moonGrad.addColorStop(1, "#d9cda6");
    ctx.fillStyle = moonGrad;
    ctx.fillRect(mx - r, my - r, r * 2, r * 2);

    /* cráteres sutiles, con su propio degradado para que no se vean planos */
    MOON_CRATERS.forEach((c) => {
      const cx = mx + c.dx * r;
      const cy = my + c.dy * r;
      const cr = c.cr * r;
      const cg = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.3, 0, cx, cy, cr);
      cg.addColorStop(0, "rgba(150,138,102,0.28)");
      cg.addColorStop(1, "rgba(150,138,102,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    });

    /* sombra de terminador con borde suave (en vez de un círculo sólido duro) */
    const shadowGrad = ctx.createRadialGradient(
      mx - r * 0.5, my - r * 0.06, r * 0.55,
      mx - r * 0.5, my - r * 0.06, r * 1.1
    );
    shadowGrad.addColorStop(0, "rgba(14,25,19,0.05)");
    shadowGrad.addColorStop(0.65, "rgba(14,25,19,0.5)");
    shadowGrad.addColorStop(1, "rgba(14,25,19,0.6)");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(mx - r * 0.46, my - r * 0.04, r * 1.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    /* borde de luz muy fino, para separar la luna del cielo */
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,250,235,0.22)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function maybeSpawnShootingStar() {
    if (shootingStar || prefersReducedMotion) return;
    if (Math.random() < 0.0028) {
      const startX = Math.random() * width * 0.6;
      const startY = Math.random() * height * 0.3;
      shootingStar = {
        x: startX,
        y: startY,
        vx: 6 + Math.random() * 3,
        vy: 3 + Math.random() * 2,
        life: 1,
      };
    }
  }

  function drawShootingStar() {
    if (!shootingStar) return;
    const s = shootingStar;
    ctx.save();
    ctx.strokeStyle = `rgba(244,236,210,${s.life})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8);
    ctx.stroke();
    ctx.restore();

    s.x += s.vx;
    s.y += s.vy;
    s.life -= 0.018;
    if (s.life <= 0 || s.x > width + 50 || s.y > height + 50) shootingStar = null;
  }

  function frame(t) {
    ctx.clearRect(0, 0, width, canvas.height / dpr);

    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;

    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height / dpr);
    bg.addColorStop(0, "#0a100c");
    bg.addColorStop(0.5, "#0b1410");
    bg.addColorStop(1, "#0a100c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, canvas.height / dpr);

    drawMoon();

    stars.forEach((s) => {
      const twinkle = prefersReducedMotion ? s.baseAlpha : s.baseAlpha + Math.sin(t * s.speed + s.phase) * 0.25;
      const px = s.x + (mouseX - 0.5) * 22 * s.parallax;
      const py = s.y + (mouseY - 0.5) * 14 * s.parallax;
      ctx.beginPath();
      ctx.fillStyle = `rgba(237,243,239,${Math.max(twinkle, 0.05)})`;
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!prefersReducedMotion) {
      maybeSpawnShootingStar();
      drawShootingStar();
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  window.addEventListener(
    "mousemove",
    (e) => {
      targetMouseX = e.clientX / window.innerWidth;
      targetMouseY = e.clientY / window.innerHeight;
    },
    { passive: true }
  );

  resize();
  requestAnimationFrame(frame);

  // Recalcular altura del canvas si el contenido cambia (ej. tras cargar fuentes)
  window.addEventListener("load", resize);
})();