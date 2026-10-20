/* ============================================================
   IL SANGUE ROSSO — logo-anim.js
   Logo animé : lueur dorée, flammes qui vacillent, braises qui
   montent, et les deux lions qui rugissent (mâchoire qui s'ouvre,
   gorge incandescente, crocs, ondes de choc, yeux qui s'embrasent).

   Usage :
     AnimatedLogo.mount(element, { src: "img/logo.png" });
   Options : src, firstRoar (s), roarEvery [min,max] (s), embers (bool),
             manual (bool, pas de boucle auto : pour tests / seek).
   ============================================================ */
(function (global) {
  "use strict";

  var W = 1248, H = 832;
  var uidCounter = 0;
  var REDUCE = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Géométrie des deux lions, en pixels du logo d'origine (1248 x 832).
  // hinge = charnière de la mâchoire, front = bout de la gueule sur la ligne des lèvres.
  var LIONS = [
    {
      k: "L", dir: -1, maxDeg: -24,
      hinge: [372, 404], front: [316, 408],
      poly: [[300, 411], [316, 408], [372, 404], [372, 441], [300, 441]],
      fangs: [324, 342],
      eye: [368, 337], mouth: [316, 412],
      mane: { cx: 455, cy: 385, rx: 80, ry: 150, pivot: [440, 300] },
      ringClip: [0, 0, 316, H]
    },
    {
      k: "R", dir: 1, maxDeg: 24,
      hinge: [876, 407], front: [934, 411],
      poly: [[950, 414], [934, 411], [876, 407], [876, 444], [950, 444]],
      fangs: [926, 908],
      eye: [880, 337], mouth: [934, 415],
      mane: { cx: 793, cy: 385, rx: 80, ry: 150, pivot: [808, 300] },
      ringClip: [934, 0, W - 934, H]
    }
  ];

  var ROAR_TOTAL = 1.95; // secondes (ouverture, rugissement, fermeture, retombée)

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function easeOut(p) { p = clamp01(p); return 1 - Math.pow(1 - p, 3); }
  function easeInOut(p) { p = clamp01(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }

  function holdOpen(t) { return 0.93 + 0.07 * Math.sin((t - 0.16) * 34); }

  // Ouverture de la mâchoire (0 = fermée, 1 = grande ouverte)
  function openAt(t) {
    if (t < 0) return 0;
    if (t < 0.16) return easeOut(t / 0.16);
    if (t < 1.0) return holdOpen(t);
    if (t < 1.45) return holdOpen(1.0) * (1 - easeInOut((t - 1.0) / 0.45));
    return 0;
  }
  // Enveloppe générale (crinière, yeux, flash) : monte vite, retombe doucement
  function envAt(t) {
    if (t < 0) return 0;
    if (t < 0.16) return easeOut(t / 0.16);
    if (t < 1.0) return 1;
    if (t < 1.9) return 1 - easeInOut((t - 1.0) / 0.9);
    return 0;
  }

  function lipY(l, x) {
    var fx = l.front[0], fy = l.front[1], hx = l.hinge[0], hy = l.hinge[1];
    return fy + (hy - fy) * (x - fx) / (hx - fx);
  }
  function pts(arr) { return arr.map(function (p) { return p[0] + "," + p[1]; }).join(" "); }

  function lionDefs(l, id) {
    var top = Math.min(l.poly[0][1], l.poly[1][1], l.poly[2][1]);
    var bottom = l.poly[3][1];
    var fadeStart = bottom - 14;
    var xs = l.poly.map(function (p) { return p[0]; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), span = maxX - minX;
    var hingeIsMax = l.hinge[0] >= maxX - 1;
    var edge = (9 / span).toFixed(3), hing = (16 / span).toFixed(3);
    var hStops = hingeIsMax
      ? '<stop offset="0" stop-color="#000"/><stop offset="' + edge + '" stop-color="#fff"/><stop offset="' + (1 - hing) + '" stop-color="#fff"/><stop offset="1" stop-color="#000"/>'
      : '<stop offset="0" stop-color="#000"/><stop offset="' + hing + '" stop-color="#fff"/><stop offset="' + (1 - edge) + '" stop-color="#fff"/><stop offset="1" stop-color="#000"/>';
    return '' +
      '<linearGradient id="hg' + l.k + id + '" gradientUnits="userSpaceOnUse" x1="' + minX + '" y1="0" x2="' + maxX + '" y2="0">' + hStops + '</linearGradient>' +
      '<mask id="hm' + l.k + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '"><rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#hg' + l.k + id + ')"/></mask>' +
      '<clipPath id="jc' + l.k + id + '"><polygon points="' + pts(l.poly) + '"/></clipPath>' +
      '<linearGradient id="fg' + l.k + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="' + fadeStart + '" x2="0" y2="' + bottom + '">' +
        '<stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>' +
      '<mask id="jm' + l.k + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '">' +
        '<rect x="0" y="0" width="' + W + '" height="' + fadeStart + '" fill="#fff"/>' +
        '<rect x="0" y="' + fadeStart + '" width="' + W + '" height="' + (bottom - fadeStart) + '" fill="url(#fg' + l.k + id + ')"/></mask>' +
      '<radialGradient id="mg' + l.k + id + '" gradientUnits="userSpaceOnUse" cx="' + l.hinge[0] + '" cy="' + (l.hinge[1] + 4) + '" r="78">' +
        '<stop offset="0" stop-color="#d9531c"/><stop offset="0.28" stop-color="#7d1016"/><stop offset="0.65" stop-color="#2a0507"/><stop offset="1" stop-color="#0d0203"/></radialGradient>' +
      '<mask id="mm' + l.k + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '">' +
        '<rect x="0" y="0" width="' + W + '" height="' + fadeStart + '" fill="#fff"/>' +
        '<rect x="0" y="' + fadeStart + '" width="' + W + '" height="' + (bottom - fadeStart) + '" fill="url(#fg' + l.k + id + ')"/></mask>' +
      '<mask id="mn' + l.k + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '">' +
        '<ellipse cx="' + l.mane.cx + '" cy="' + l.mane.cy + '" rx="' + l.mane.rx + '" ry="' + l.mane.ry + '" fill="#fff" filter="url(#bl' + id + ')"/></mask>' +
      '<clipPath id="rc' + l.k + id + '"><rect x="' + l.ringClip[0] + '" y="' + l.ringClip[1] + '" width="' + l.ringClip[2] + '" height="' + l.ringClip[3] + '"/></clipPath>';
  }

  function lionLayers(l, id, src) {
    var hx = l.hinge[0], hy = l.hinge[1];
    var fangMarkup = "", lowerFangMarkup = "";
    l.fangs.forEach(function (fx, i) {
      var y = lipY(l, fx);
      fangMarkup += '<polygon class="uf' + i + '" points="' + (fx - 2.6) + ',' + y + ' ' + (fx + 2.6) + ',' + y + ' ' + fx + ',' + (y + 9) + '" fill="url(#tg' + id + ')"/>';
      lowerFangMarkup += '<polygon class="lf' + i + '" points="' + (fx - 2.4) + ',' + (y + 1) + ' ' + (fx + 2.4) + ',' + (y + 1) + ' ' + fx + ',' + (y - 7) + '" fill="url(#tg' + id + ')"/>';
    });
    return '' +
      // crinière qui frissonne (copie de l'image, floutée sur les bords, qui bouge un peu)
      '<g class="mane' + l.k + '" opacity="0" mask="url(#mn' + l.k + id + ')"><g class="maneT' + l.k + '"><image href="' + src + '" width="' + W + '" height="' + H + '"/></g></g>' +
      // intérieur de la gueule (gorge incandescente) + crocs du haut
      '<g class="mouth' + l.k + '" opacity="0">' +
        '<g mask="url(#mm' + l.k + id + ')"><g mask="url(#hm' + l.k + id + ')"><polygon points="' + pts(l.poly) + '" fill="url(#mg' + l.k + id + ')"/></g></g>' +
        '<g class="fangsU">' + fangMarkup + '</g>' +
      '</g>' +
      // mâchoire du bas : bout de l'image d'origine qui pivote autour de la charnière
      '<g class="jaw' + l.k + '" transform="rotate(0 ' + hx + ' ' + hy + ')">' +
        '<g mask="url(#jm' + l.k + id + ')"><g mask="url(#hm' + l.k + id + ')"><g clip-path="url(#jc' + l.k + id + ')"><image href="' + src + '" width="' + W + '" height="' + H + '"/></g></g></g>' +
        '<g class="fangsL" opacity="0">' + lowerFangMarkup + '</g>' +
      '</g>' +
      // flash de la gueule, yeux, ondes de choc
      '<circle class="flash' + l.k + '" cx="' + l.mouth[0] + '" cy="' + l.mouth[1] + '" r="52" fill="url(#fl' + id + ')" opacity="0"/>' +
      '<circle class="eye' + l.k + '" cx="' + l.eye[0] + '" cy="' + l.eye[1] + '" r="17" fill="url(#ey' + id + ')" opacity="0"/>' +
      '<g clip-path="url(#rc' + l.k + id + ')">' +
        '<circle class="ring' + l.k + '0" cx="' + l.mouth[0] + '" cy="' + l.mouth[1] + '" r="0" fill="none" stroke="#f3c969" stroke-width="3" opacity="0"/>' +
        '<circle class="ring' + l.k + '1" cx="' + l.mouth[0] + '" cy="' + l.mouth[1] + '" r="0" fill="none" stroke="#e8553a" stroke-width="3" opacity="0"/>' +
        '<circle class="ring' + l.k + '2" cx="' + l.mouth[0] + '" cy="' + l.mouth[1] + '" r="0" fill="none" stroke="#f3c969" stroke-width="3" opacity="0"/>' +
      '</g>';
  }

  function buildMarkup(src, id) {
    var defs = '' +
      '<filter id="bl' + id + '" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="16"/></filter>' +
      '<linearGradient id="tg' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4e6c4"/><stop offset="1" stop-color="#b79c63"/></linearGradient>' +
      '<radialGradient id="ey' + id + '"><stop offset="0" stop-color="#fff1b8" stop-opacity="1"/><stop offset="0.45" stop-color="#ff9a3c" stop-opacity=".55"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="fl' + id + '"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset="0.5" stop-color="#ff5a2a" stop-opacity=".28"/><stop offset="1" stop-color="#ff3b2e" stop-opacity="0"/></radialGradient>' +
      LIONS.map(function (l) { return lionDefs(l, id); }).join("");
    var body = LIONS.map(function (l) { return lionLayers(l, id, src); }).join("");
    return '<svg class="alogo-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' + defs + '</defs>' + body + '</svg>';
  }

  function mount(el, opts) {
    opts = opts || {};
    var src = opts.src || "img/logo.png";
    var id = "al" + (++uidCounter);

    el.classList.add("alogo");
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Il Sangue Rosso");
    el.innerHTML =
      '<div class="alogo-glow"></div>' +
      '<div class="alogo-inner">' +
        '<img class="alogo-img" src="' + src + '" alt="" draggable="false">' +
        '<div class="alogo-flame a" style="background-image:url(\'' + src + '\')"></div>' +
        '<div class="alogo-flame b" style="background-image:url(\'' + src + '\')"></div>' +
        buildMarkup(src, id) +
      '</div>' +
      (opts.embers === false ? "" : '<canvas class="alogo-embers"></canvas>');

    var inner = el.querySelector(".alogo-inner");
    var canvas = el.querySelector(".alogo-embers");
    var ctx = canvas ? canvas.getContext("2d") : null;
    var svg = el.querySelector(".alogo-svg");

    // --- éléments animés ---
    var nodes = LIONS.map(function (l) {
      var q = function (s) { return svg.querySelector(s); };
      return {
        l: l,
        jaw: q(".jaw" + l.k), mouth: q(".mouth" + l.k), mane: q(".mane" + l.k), maneT: q(".maneT" + l.k),
        flash: q(".flash" + l.k), eye: q(".eye" + l.k),
        rings: [q(".ring" + l.k + "0"), q(".ring" + l.k + "1"), q(".ring" + l.k + "2")],
        fangsU: q(".mouth" + l.k + " .fangsU"), fangsL: q(".jaw" + l.k + " .fangsL"),
        ufs: [q(".mouth" + l.k + " .uf0"), q(".mouth" + l.k + " .uf1")],
        lfs: [q(".jaw" + l.k + " .lf0"), q(".jaw" + l.k + " .lf1")]
      };
    });

    var width = 0, height = 0, dpr = 1;
    function resize() {
      width = el.clientWidth || 1; height = el.clientHeight || 1;
      if (canvas) {
        dpr = Math.min(global.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      }
    }
    resize();
    if (global.ResizeObserver) new ResizeObserver(resize).observe(el); else global.addEventListener("resize", resize);

    // --- rugissement ---
    function render(t) {
      var open = openAt(t), env = envAt(t);
      var flash = t >= 0 && t < 0.8 ? Math.exp(-t * 6) : 0;
      var tremor = (t > 0.16 && t < 1.0) ? Math.sin(t * 61) * 0.5 : 0; // petit tremblement pendant le cri

      nodes.forEach(function (n) {
        var l = n.l, hx = l.hinge[0], hy = l.hinge[1];
        var ang = l.maxDeg * open + tremor * (open > 0.5 ? 1 : 0) * Math.sign(l.maxDeg);
        n.jaw.setAttribute("transform", "rotate(" + ang.toFixed(3) + " " + hx + " " + hy + ")");
        n.mouth.setAttribute("opacity", Math.min(1, open * 3).toFixed(3));
        n.fangsL.setAttribute("opacity", Math.min(1, Math.max(0, (open - 0.25) * 2.2)).toFixed(3));
        // les crocs poussent avec l'ouverture
        var k = 0.35 + 0.65 * open;
        n.ufs.forEach(function (p, i) {
          var fx = l.fangs[i], y = lipY(l, fx);
          p.setAttribute("points", (fx - 2.6) + "," + y + " " + (fx + 2.6) + "," + y + " " + fx + "," + (y + 10 * k));
        });
        n.lfs.forEach(function (p, i) {
          var fx = l.fangs[i], y = lipY(l, fx);
          p.setAttribute("points", (fx - 2.4) + "," + (y + 1) + " " + (fx + 2.4) + "," + (y + 1) + " " + fx + "," + (y - 8 * k));
        });
        // crinière qui frissonne
        n.mane.setAttribute("opacity", (0.26 * env).toFixed(3));
        var px = l.mane.pivot[0], py = l.mane.pivot[1];
        var dx = Math.sin(t * 13.5) * 1.1 * env, dy = Math.sin(t * 17 + 1) * 0.8 * env, rot = Math.sin(t * 11) * 0.45 * env;
        n.maneT.setAttribute("transform", "translate(" + dx.toFixed(2) + " " + dy.toFixed(2) + ") rotate(" + rot.toFixed(2) + " " + px + " " + py + ")");
        // yeux et flash de gueule
        n.eye.setAttribute("opacity", Math.min(1, env * (0.85 + 0.15 * Math.sin(t * 40))).toFixed(3));
        n.flash.setAttribute("opacity", Math.min(1, open * 0.5).toFixed(3));
        n.flash.setAttribute("r", (40 + 22 * open).toFixed(1));
        // ondes de choc
        n.rings.forEach(function (c, i) {
          var p = (t - 0.04 - i * 0.17) / 1.05;
          if (t < 0 || p <= 0 || p >= 1) { c.setAttribute("opacity", "0"); return; }
          c.setAttribute("r", (10 + 175 * easeOut(p)).toFixed(1));
          c.setAttribute("opacity", (Math.pow(1 - p, 1.6) * 0.6).toFixed(3));
          c.setAttribute("stroke-width", (0.8 + 2.2 * (1 - p)).toFixed(2));
        });
      });

      // « coup de poing » sur tout le logo : léger zoom, secousse, flash de lumière
      if (env > 0.001 || flash > 0.001) {
        var amp = 1.3 * (width / 420);
        var sx = Math.sin(t * 61) * amp * env, sy = Math.cos(t * 47) * amp * env;
        inner.style.transform = "translate(" + sx.toFixed(2) + "px," + sy.toFixed(2) + "px) scale(" + (1 + 0.032 * env).toFixed(4) + ")";
        inner.style.filter = "brightness(" + (1 + 0.28 * flash + 0.07 * env).toFixed(3) + ")";
      } else {
        inner.style.transform = ""; inner.style.filter = "";
      }
    }

    // --- braises ---
    var embers = [];
    function spawnEmber(x, y, vx, vy, big) {
      embers.push({
        x: x, y: y, vx: vx, vy: vy,
        life: 0, max: 2.6 + Math.random() * 3.2,
        r: (big ? 1.4 : 0.8) + Math.random() * 1.6,
        hot: Math.random() < 0.55, ph: Math.random() * 6.28
      });
    }
    function burst() {
      // braises projetées par les gueules (coordonnées en fraction du logo)
      LIONS.forEach(function (l) {
        for (var i = 0; i < 22; i++) {
          var a = (l.dir < 0 ? Math.PI : 0) + (Math.random() - 0.5) * 1.1;
          var sp = 60 + Math.random() * 140;
          spawnEmber(l.mouth[0] / W * width, l.mouth[1] / H * height,
            Math.cos(a) * sp * (width / 420), Math.sin(a) * sp * (width / 420) - 20, true);
        }
      });
    }
    function stepEmbers(dt) {
      if (!ctx) return;
      var s = width / 420;
      // émission continue depuis le bas du médaillon
      if (Math.random() < dt * 7) {
        spawnEmber((0.22 + Math.random() * 0.56) * width, (0.62 + Math.random() * 0.3) * height,
          (Math.random() - 0.5) * 8 * s, -(14 + Math.random() * 22) * s, false);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      for (var i = embers.length - 1; i >= 0; i--) {
        var e = embers[i];
        e.life += dt;
        if (e.life >= e.max || embers.length > 160) { embers.splice(i, 1); continue; }
        e.vx *= 1 - dt * 0.6; e.vy *= 1 - dt * 0.35;
        e.x += (e.vx + Math.sin(e.life * 2.2 + e.ph) * 5 * s) * dt;
        e.y += e.vy * dt - 6 * s * dt;
        var a = Math.sin((e.life / e.max) * Math.PI);
        ctx.fillStyle = e.hot ? "rgba(255,92,58," + (0.8 * a).toFixed(3) + ")" : "rgba(255,206,110," + (0.85 * a).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * Math.max(0.6, s * 0.9), 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    // --- boucle ---
    var roarStart = -1, nextRoar = 0, last = 0, running = true, rafId = 0;
    var every = opts.roarEvery || [8, 13];
    var firstRoar = opts.firstRoar == null ? 1.4 : opts.firstRoar;
    var t0 = performance.now();
    nextRoar = t0 + firstRoar * 1000;

    function roar() {
      var now = performance.now();
      if (roarStart > 0 && now - roarStart < 1600) return;
      roarStart = now; burst();
      nextRoar = now + ROAR_TOTAL * 1000 + (every[0] + Math.random() * (every[1] - every[0])) * 1000;
    }

    function frame(now) {
      if (!running) return;
      if (!el.isConnected) { running = false; return; }
      var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      if (!opts.manual && now >= nextRoar && !(roarStart > 0 && now - roarStart < ROAR_TOTAL * 1000)) roar();
      var t = roarStart > 0 ? (now - roarStart) / 1000 : -1;
      if (t > ROAR_TOTAL) { t = -1; }
      if (!opts.manual) render(t);
      stepEmbers(dt);
      rafId = requestAnimationFrame(frame);
    }

    if (REDUCE) {
      // mouvement réduit : logo fixe, sans boucle
      el.classList.add("alogo-static");
      render(-1);
    } else {
      rafId = requestAnimationFrame(frame);
      el.addEventListener("click", roar);
      el.addEventListener("mouseenter", function () { if (roarStart < 0 || performance.now() - roarStart > 6000) roar(); });
    }

    return {
      roar: roar,
      seek: function (t) { render(t); },
      destroy: function () { running = false; cancelAnimationFrame(rafId); }
    };
  }

  global.AnimatedLogo = { mount: mount };
})(window);
