/* ============================================================
   IL SANGUE ROSSO — ambient.js
   Braises rouges et dorées qui montent doucement en arrière-plan.
   ============================================================ */
(function () {
  if (window.__isrAmbient) return;
  window.__isrAmbient = true;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function start() {
    const c = document.createElement("canvas");
    c.className = "ambient-canvas";
    c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    let W = 0, H = 0, dpr = 1, parts = [], raf = 0, last = 0;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      c.width = W * dpr; c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(46, Math.max(16, W * H / 36000)));
      while (parts.length < n) parts.push(make(true));
      parts.length = n;
    }
    function make(anywhere) {
      const red = Math.random() < 0.7;
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : H + 10 + Math.random() * 40,
        r: 0.6 + Math.random() * 1.7,
        vy: 8 + Math.random() * 26,            // px / s
        sway: Math.random() * Math.PI * 2,
        swayS: 0.4 + Math.random() * 0.9,
        amp: 6 + Math.random() * 22,
        tw: Math.random() * Math.PI * 2,
        rgb: red ? "214,30,36" : "236,198,106"
      };
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.y -= p.vy * dt;
        p.sway += p.swayS * dt;
        p.tw += dt * 2.2;
        const x = p.x + Math.sin(p.sway) * p.amp;
        if (p.y < -20) { parts[i] = make(false); continue; }
        const fade = Math.min(1, Math.max(0, p.y / (H * 0.25))) * Math.min(1, (H - p.y) / 60 + 0.2);
        const a = (0.35 + 0.35 * Math.sin(p.tw)) * fade;
        ctx.fillStyle = "rgba(" + p.rgb + "," + (a * 0.14).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(x, p.y, p.r * 4.5, 0, 6.283); ctx.fill();
        ctx.fillStyle = "rgba(" + p.rgb + "," + a.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, 6.283); ctx.fill();
      }
    }
    function run() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    size();
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : run()));
    run();
  }

  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
