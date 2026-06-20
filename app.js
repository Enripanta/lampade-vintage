/* ============================================================
   Pantaoo — logica della vetrina
   ============================================================ */

/* --- Configurazione contatti (modifica qui se cambia qualcosa) --- */
const CONFIG = {
  whatsapp: "393428436314",                       // numero in formato internazionale, senza +
  instagram: "pantaoo",
  email: "enricopantaleoni10@gmail.com",
  siteUrl: window.location.origin + window.location.pathname  // usato per il QR
};

/* --- Link WhatsApp precompilato per una lampada --- */
function waLink(lampName) {
  const msg = `Ciao Enrico! Sono interessato/a alla lampada "${lampName}". È ancora disponibile?`;
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
}

/* --- Render del catalogo --- */
const grid = document.getElementById("grid");
const countEl = document.getElementById("count");
let currentFilter = "tutte";

let LAMPS = [];
function getVisibleLamps() {
  const lamps = LAMPS.filter(l => !l.hidden);
  if (currentFilter === "disponibili") return lamps.filter(l => l.status === "disponibile");
  return lamps;
}

function formatPrice(p) {
  if (p === null || p === undefined) return `<span class="price">Su richiesta</span>`;
  return `<span class="price">€${p}</span>`;
}

function renderGrid() {
  const lamps = getVisibleLamps();
  grid.innerHTML = "";

  if (lamps.length === 0) {
    grid.innerHTML = `<p class="empty">Nessuna lampada in questa categoria al momento. Scrivimi su WhatsApp per le novità!</p>`;
    countEl.textContent = "";
    return;
  }

  const total = getVisibleLamps().length;
  countEl.textContent = `${total} ${total === 1 ? "lampada" : "lampade"}`;

  lamps.forEach((l, i) => {
    const sold = l.status === "venduto";
    const imgs = (Array.isArray(l.images) && l.images.length) ? l.images : (l.image ? [l.image] : []);
    const multi = imgs.length > 1;
    const card = document.createElement("article");
    card.className = "card reveal" + (sold ? " is-sold" : "");
    card.style.transitionDelay = (i % 3) * 0.08 + "s";

    const slidesHtml = imgs.map((src, n) => {
      const label = `${l.alt || l.name}${imgs.length > 1 ? " — foto " + (n + 1) : ""}`;
      // prima foto subito; le altre caricate quando la scheda entra in vista
      return n === 0
        ? `<img src="${src}" alt="${label}" loading="lazy">`
        : `<img data-src="${src}" alt="${label}">`;
    }).join("");

    const arrowsHtml = multi ? `
        <button class="nav-arrow prev" aria-label="Foto precedente">${chevron("left")}</button>
        <button class="nav-arrow next" aria-label="Foto successiva">${chevron("right")}</button>
        <div class="dots">${imgs.map((_, n) => `<span class="${n === 0 ? "active" : ""}"></span>`).join("")}</div>` : "";

    card.innerHTML = `
      <div class="card-media">
        <span class="badge ${sold ? "venduto" : "disponibile"}">${sold ? "Venduto" : "Disponibile"}</span>
        <div class="slides">${slidesHtml}</div>
        ${arrowsHtml}
      </div>
      <div class="card-body">
        <h3>${l.name}</h3>
        <p class="material">${l.material || ""}</p>
        <div class="card-foot">
          ${formatPrice(l.price)}
          ${sold
            ? `<span class="btn btn-wa">Non disponibile</span>`
            : `<a class="btn btn-primary btn-wa" href="${waLink(l.name)}" target="_blank" rel="noopener"
                 aria-label="Richiedi la lampada ${l.name} su WhatsApp">
                 ${waIcon()} Richiedi
               </a>`}
        </div>
      </div>`;
    grid.appendChild(card);
  });

  initCarousels();
  observeReveals();
}

/* --- Carosello foto per ogni scheda --- */
function chevron(dir) {
  const d = dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6";
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

function initCarousels() {
  document.querySelectorAll("#grid .card-media").forEach(media => {
    const slides = media.querySelector(".slides");
    const imgs = media.querySelectorAll(".slides img");
    if (imgs.length < 2) return;
    const dots = media.querySelectorAll(".dots span");
    let idx = 0;
    const ensureLoaded = (n) => {
      const im = imgs[n];
      if (im && im.dataset.src) { im.src = im.dataset.src; im.removeAttribute("data-src"); }
    };
    const go = (i) => {
      idx = (i + imgs.length) % imgs.length;
      ensureLoaded(idx);
      ensureLoaded((idx + 1) % imgs.length);
      slides.style.transform = `translateX(${-idx * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle("active", di === idx));
    };
    ensureLoaded(1); // preload la seconda foto per il primo clic istantaneo
    media.querySelector(".prev").addEventListener("click", e => { e.preventDefault(); go(idx - 1); });
    media.querySelector(".next").addEventListener("click", e => { e.preventDefault(); go(idx + 1); });
    dots.forEach((d, di) => d.addEventListener("click", e => { e.preventDefault(); go(di); }));
    // swipe su mobile
    let sx = null;
    media.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    media.addEventListener("touchend", e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1);
      sx = null;
    }, { passive: true });
  });
}

/* --- Filtri --- */
document.querySelectorAll(".filters button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filters button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderGrid();
  });
});

/* --- Navbar: stato "scrolled" --- */
const nav = document.getElementById("nav");
function onScroll() {
  if (window.scrollY > 60) nav.classList.add("scrolled");
  else nav.classList.remove("scrolled");
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* --- Menu mobile --- */
const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");
toggle.addEventListener("click", () => links.classList.toggle("open"));
links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));

/* --- Scroll reveal --- */
let io;
function observeReveals() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("is-visible"));
    return;
  }
  if (!io) {
    io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
  }
  document.querySelectorAll(".reveal:not(.is-visible)").forEach(el => io.observe(el));
}

/* --- QR code (punta alla home del sito) --- */
function buildQR() {
  const box = document.getElementById("qrcode");
  if (!box) return;
  if (typeof QRCode === "undefined") {
    box.innerHTML = `<span style="color:#1B1411;font-size:.8rem;padding:8px;text-align:center">Il QR appare una volta online</span>`;
    return;
  }
  new QRCode(box, {
    text: CONFIG.siteUrl,
    width: 180, height: 180,
    colorDark: "#1B1411", colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
}

/* --- Icona WhatsApp riutilizzabile --- */
function waIcon() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.488-.91zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>`;
}

/* --- Anno footer --- */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* --- Caricamento dati lampade da data/lamps.json --- */
async function loadLamps() {
  try {
    const res = await fetch("data/lamps.json", { cache: "no-store" });
    const data = await res.json();
    LAMPS = Array.isArray(data) ? data : (data.lamps || []);
  } catch (e) {
    console.error("Impossibile caricare le lampade:", e);
    LAMPS = [];
  }
  renderGrid();
}

/* --- Avvio --- */
loadLamps();
observeReveals();
window.addEventListener("load", buildQR);
