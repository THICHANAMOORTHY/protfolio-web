# Thichanamoorthy T — Portfolio

Personal portfolio of **Thichanamoorthy T**, a final-year B.E. ECE student at EASA College of Engineering and Technology, Coimbatore, focused on **embedded systems** (ESP32, Embedded C, IoT, EV electronics) and **FPGA/Verilog design**.

The hero is a 3D Artix-7 FPGA built with Three.js. It floats and tilts toward the mouse, signal particles flow along PCB traces into it, and scrolling lifts the lid and zooms the camera into the die.

## Tech stack

| Layer | Choice |
|---|---|
| Structure | HTML5, semantic tags (`header`, `main`, `section`, `footer`) |
| Styling | CSS3: custom properties, Flexbox, Grid, media queries, keyframes |
| Interactivity | Vanilla JavaScript (ES6): typing effect, project filter, counters, mobile menu |
| Scroll animations | `IntersectionObserver` + CSS transitions |
| 3D hero | Three.js (ES module from jsDelivr CDN), hero section only |
| Project cards | Pure CSS 3D flip (`perspective`, `rotateY`, `backface-visibility`) |
| Live GitHub data | GitHub REST API via `fetch`, with a hard-coded fallback |
| Contact form | Formspree |
| Icons & fonts | Font Awesome, Devicon, JetBrains Mono, Space Grotesk |
| Hosting | Vercel (auto-deploys on every push) |

No frameworks and no build step.

## Project structure

```
index.html        page markup, all sections
css/style.css     theme tokens, layout, responsive rules, flip cards, timeline
js/main.js        nav, typing effect, reveal, counters, filter, GitHub API, contact form
js/hero3d.js      Three.js scene: chip, PCB traces, particles, scroll-driven zoom
assets/           favicon (put your resume PDF here)
```

## Run locally

ES modules don't load from `file://`, so serve the folder instead of double-clicking `index.html`:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

Or use the VS Code **Live Server** extension. If the page is opened from disk anyway, a CSS-only chip is shown instead of the 3D one.

## Before you deploy

1. **Resume:** replace `assets/Thichanamoorthy_T_Resume.pdf` whenever you update your resume (keep the file name).
2. **Formspree:** create a free form at formspree.io and put its ID in `CONFIG.formspreeId`. Until then, the form opens the visitor's email app.
3. **Fallback repos:** `CONFIG.fallbackRepos` is shown when the GitHub API is rate-limited (60 requests/hour without login). Point each `url` at the real repo.
4. **Project links:** the "View on GitHub" links in `index.html` currently search your repositories. Replace them with direct repo URLs.

## Deploy on Vercel

1. Push this repo to GitHub.
2. On vercel.com, choose **Add New → Project** and import the repo.
3. Framework preset: **Other**. No build command, output directory `.`.
4. Every push to the main branch redeploys automatically.

## Performance and accessibility

- 3D is limited to the hero, and rendering pauses when the hero is off screen.
- Lower particle count, pixel ratio, and no antialiasing on phones.
- `prefers-reduced-motion` gets a still 3D frame, no scroll zoom, and no typing or reveal animations.
- Falls back to a CSS chip when WebGL or the CDN is unavailable.
- Keyboard accessible: skip link, visible focus, and flip cards open with Enter or Space.
