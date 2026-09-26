/* =========================================================
   main.js — page interactivity (vanilla ES6, no libraries)
   The 3D hero lives separately in hero3d.js.
   ========================================================= */

// ---- Personal settings: edit these before deploying ----
const CONFIG = {
  githubUser: "THICHANAMOORTHY",
  formspreeId: "YOUR_FORM_ID",                 // from https://formspree.io → your form → "f/xxxxxxx"
  email: "thichu683@gmail.com",                // shown on the Email contact button
  phone: "+91 6374742431",
  linkedin: "https://www.linkedin.com/in/thichanamoorthy-t-2371a5325",
  roles: [
    "Embedded Systems Engineer",
    "ESP32 & IoT Builder",
    "FPGA & Verilog Developer",
  ],
  // Shown if the GitHub API is unreachable or rate-limited (60 requests/hour without login)
  fallbackRepos: [
    { name: "FPGA Sobel Edge Detection", description: "Streaming Sobel edge detector on Artix-7 with line buffers and UART image transfer.", language: "Verilog", stars: 0, url: "https://github.com/THICHANAMOORTHY?tab=repositories&q=sobel" },
    { name: "HDLBits-Verilog-Solutions", description: "My Verilog solutions to the HDLBits problem set.", language: "Verilog", stars: 0, url: "https://github.com/THICHANAMOORTHY?tab=repositories&q=hdlbits" },
    { name: "K-Best MIMO Detector", description: "2×2 16-QAM K-Best MIMO detector with CORDIC QR decomposition on Artix-7.", language: "Verilog", stars: 0, url: "https://github.com/THICHANAMOORTHY?tab=repositories&q=mimo" },
    { name: "dept_web", description: "ECE ELITES department website.", language: "HTML", stars: 0, url: "https://github.com/THICHANAMOORTHY/dept_web" },
    { name: "digital-elc", description: "Digital electronics experiments and Verilog designs.", language: "Verilog", stars: 0, url: "https://github.com/THICHANAMOORTHY/digital-elc" },
    { name: "Portfolio", description: "This website: HTML, CSS, JavaScript and a Three.js FPGA hero.", language: "JavaScript", stars: 0, url: "https://github.com/THICHANAMOORTHY?tab=repositories" },
  ],
};

const LANG_COLORS = {
  Verilog: "#b2b7f8", SystemVerilog: "#DAE1C2", VHDL: "#adb2cb", Python: "#3572A5",
  JavaScript: "#f1e05a", TypeScript: "#3178c6", HTML: "#e34c26", CSS: "#563d7c",
  "C++": "#f34b7d", C: "#555555", Java: "#b07219", "Jupyter Notebook": "#DA5B0B", Tcl: "#e4cc98",
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Navigation: sticky style, mobile menu, active link ---------- */
function initNav() {
  const header = $(".site-header");
  const toggle = $(".nav-toggle");
  const menu = $("#nav-menu");
  const backdrop = $("#nav-backdrop");

  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setOpen = (open) => {
    menu.classList.toggle("open", open);
    if (backdrop) backdrop.classList.toggle("open", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setOpen(!menu.classList.contains("open")));
  if (backdrop) backdrop.addEventListener("click", () => setOpen(false));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820 && menu.classList.contains("open")) {
      setOpen(false);
    }
  });

  // Highlight the nav link for the section in view
  const links = $$(".nav-menu a[href^='#']");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => spy.observe(s));
}

/* ---------- Typing effect ---------- */
function initTyping() {
  const el = $("#typed");
  if (!el) return;
  if (prefersReducedMotion) { el.textContent = CONFIG.roles[0]; return; }

  let role = 0, char = 0, deleting = false;
  const tick = () => {
    const word = CONFIG.roles[role];
    char += deleting ? -1 : 1;
    el.textContent = word.slice(0, char);

    let delay = deleting ? 35 : 70;
    if (!deleting && char === word.length) { deleting = true; delay = 1800; }
    else if (deleting && char === 0) { deleting = false; role = (role + 1) % CONFIG.roles.length; delay = 400; }
    setTimeout(tick, delay);
  };
  tick();
}

/* ---------- Scroll reveal (IntersectionObserver) ---------- */
function initReveal() {
  const items = $$(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  // Stagger siblings slightly so grids cascade in
  items.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 6) * 70}ms`;
    io.observe(el);
  });
}

/* ---------- Animated counters ---------- */
function animateCount(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || "";
  if (prefersReducedMotion) { el.textContent = target + suffix; return; }
  const start = performance.now();
  const duration = 1400;
  const step = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initCounters() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  $$(".stat-num[data-count]").forEach((el) => io.observe(el));
}

/* ---------- Project filter + tap-to-flip ---------- */
function initProjects() {
  const buttons = $$(".filter-btn");
  const cards = $$("#projects-grid .flip-card");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      buttons.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", String(on));
      });
      cards.forEach((card) => {
        const cats = card.dataset.category.split(" ");
        const show = filter === "all" || cats.includes(filter);
        card.classList.toggle("hidden", !show);
        card.classList.remove("flipped");
        if (show) card.classList.add("visible");
      });
    });
  });

  // Touch screens / mobile viewports have no hover, so a tap flips the card
  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      const isTouchOrSmall = window.matchMedia("(hover: none)").matches || window.innerWidth <= 820 || ("ontouchstart" in window);
      if (isTouchOrSmall) card.classList.toggle("flipped");
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (e.target !== card) return;
        e.preventDefault();
        card.classList.toggle("flipped");
      }
    });
  });
}

/* ---------- Live GitHub repos (REST API) with fallback ---------- */
const escapeHTML = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

function repoCard(repo) {
  const color = LANG_COLORS[repo.language] || "#8b949e";
  return `
    <a class="repo-card reveal visible" href="${escapeHTML(repo.url)}" target="_blank" rel="noopener">
      <span class="repo-name"><i class="fa-regular fa-folder-open"></i>${escapeHTML(repo.name)}</span>
      <p class="repo-desc">${escapeHTML(repo.description || "No description yet.")}</p>
      <div class="repo-meta">
        ${repo.language ? `<span><span class="lang-dot" style="background:${color}"></span>${escapeHTML(repo.language)}</span>` : ""}
        <span><i class="fa-regular fa-star"></i> ${repo.stars}</span>
        ${repo.forks ? `<span><i class="fa-solid fa-code-fork"></i> ${repo.forks}</span>` : ""}
      </div>
    </a>`;
}

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { time, data } = JSON.parse(raw);
    return Date.now() - time < 30 * 60 * 1000 ? data : null; // 30 min
  } catch { return null; }
}
function writeCache(key, data) {
  try { sessionStorage.setItem(key, JSON.stringify({ time: Date.now(), data })); } catch { /* storage unavailable */ }
}

async function fetchRepos() {
  const cached = readCache("gh-repos");
  if (cached) return cached;

  const res = await fetch(`https://api.github.com/users/${CONFIG.githubUser}/repos?per_page=100&sort=updated`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const json = await res.json();

  const repos = json
    .filter((r) => !r.fork && !r.archived && r.name.toLowerCase() !== CONFIG.githubUser.toLowerCase())
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      url: r.html_url,
      pushed: r.pushed_at,
    }));
  const data = { total: json.filter((r) => !r.fork).length, repos };
  writeCache("gh-repos", data);
  return data;
}

async function initGitHub() {
  const grid = $("#repo-grid");
  const status = $("#gh-status");
  grid.innerHTML = Array(6).fill('<div class="skeleton"></div>').join("");

  try {
    const { total, repos } = await fetchRepos();
    // Repos with a description first, then by stars, then most recently pushed
    const top = repos
      .sort((a, b) => (!!b.description - !!a.description) || (b.stars - a.stars) || (new Date(b.pushed) - new Date(a.pushed)))
      .slice(0, 6);
    if (!top.length) throw new Error("no repos");
    grid.innerHTML = top.map(repoCard).join("");
    status.textContent = `● live · ${total} public repos`;

    // Keep the About counter in sync with the real repo count
    const counter = $("#repo-count");
    if (counter && total) counter.dataset.count = total;
  } catch (err) {
    console.warn("GitHub API unavailable, showing fallback repos:", err.message);
    grid.innerHTML = CONFIG.fallbackRepos.map(repoCard).join("");
    status.textContent = "● saved copy (GitHub API unavailable)";
  }
}

/* ---------- Contact form (Formspree) ---------- */
function initContact() {
  const email = $("#contact-email");
  const linkedin = $("#contact-linkedin");
  const phone = $("#contact-phone");
  if (email) email.href = `mailto:${CONFIG.email}`;
  if (linkedin) linkedin.href = CONFIG.linkedin;
  if (phone) phone.href = `tel:${CONFIG.phone.replace(/[\s-]/g, "")}`;

  const form = $("#contact-form");
  const status = $("#form-status");
  form.action = `https://formspree.io/f/${CONFIG.formspreeId}`;

  const setStatus = (msg, type) => { status.textContent = msg; status.className = `form-status mono ${type || ""}`; };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Simple validation
    let valid = true;
    $$(".field", form).forEach((field) => {
      const input = $("input, textarea", field);
      const ok = input.checkValidity() && input.value.trim() !== "";
      field.classList.toggle("invalid", !ok);
      if (!ok) valid = false;
    });
    if (!valid) { setStatus("Please fill in every field with a valid email.", "err"); return; }

    const data = new FormData(form);

    // Formspree not configured yet → fall back to the visitor's email app
    if (CONFIG.formspreeId === "YOUR_FORM_ID") {
      const subject = encodeURIComponent(`Portfolio message from ${data.get("name")}`);
      const body = encodeURIComponent(`${data.get("message")}\n\n— ${data.get("name")} (${data.get("email")})`);
      window.location.href = `mailto:${CONFIG.email}?subject=${subject}&body=${body}`;
      return;
    }

    const btn = $("button[type=submit]", form);
    btn.disabled = true;
    setStatus("sending…");
    try {
      const res = await fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      setStatus("✓ Message sent. Thanks, I'll reply soon!", "ok");
    } catch {
      setStatus("Something went wrong. Please email me directly instead.", "err");
    } finally {
      btn.disabled = false;
    }
  });
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  if (prefersReducedMotion) document.documentElement.classList.add("reduced-motion");
  $("#year").textContent = new Date().getFullYear();
  initNav();
  initTyping();
  initReveal();
  initProjects();
  initContact();
  initGitHub().finally(initCounters); // counters start after the real repo count is known
});

// Module scripts don't run when index.html is opened straight from disk (file://)
// or if the browser is very old, so show the CSS chip instead of an empty hero.
window.addEventListener("load", () => {
  if (!window.__hero3dLoaded) document.documentElement.classList.add("no-webgl");
});
