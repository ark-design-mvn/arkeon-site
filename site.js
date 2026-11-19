/* ARKEON site script: nav toggle, Helderberg section drawing, enquiry form. */

// Where the cost estimator lives. Change this once the estimator is deployed.
var ESTIMATOR_URL = "https://estimate.arkeon.co.za";
var EMAIL = "hello@arkeon.co.za";

(function () {
  // Point every estimator link at the configured address
  document.querySelectorAll("[data-estimator]").forEach(function (a) {
    a.setAttribute("href", ESTIMATOR_URL);
  });

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---------- Helderberg section drawing ----------
  var canvas = document.getElementById("section-drawing");
  if (canvas) {
    var draw = function () {
      var css = getComputedStyle(document.documentElement);
      var ink = css.getPropertyValue("--ink").trim();
      var line = css.getPropertyValue("--line").trim();
      var stone = css.getPropertyValue("--stone").trim();
      var graphite = css.getPropertyValue("--graphite").trim();
      var accent = css.getPropertyValue("--green").trim();

      var dpr = window.devicePixelRatio || 1;
      var w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var sea = h - 18;

      // Smooth deterministic noise
      function hash(n) { var x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }
      function noise(x) {
        var i = Math.floor(x), f = x - i;
        var u = f * f * (3 - 2 * f);
        return hash(i) * (1 - u) + hash(i + 1) * u;
      }
      function fbm(x, seed) {
        var v = 0, a = 0.5, fr = 1;
        for (var k = 0; k < 4; k++) { v += a * noise(x * fr + seed * 13.7); fr *= 2.1; a *= 0.5; }
        return v;
      }

      // A ridge: broad massif shape with a peak position, plus noise
      function ridge(peakX, peakH, spread, rough, seed, t) {
        var d = (t - peakX) / spread;
        var massif = Math.exp(-d * d * 1.6) * 0.82 + Math.exp(-Math.pow((t - peakX - spread * 0.55) / (spread * 0.6), 2)) * 0.28;
        return massif * peakH + (fbm(t * 9, seed) - 0.5) * rough * peakH;
      }

      var layers = [
        { peakX: 0.2,  peakH: 0.48, spread: 0.32, rough: 0.16, seed: 3, color: stone, width: 1 },
        { peakX: 0.86, peakH: 0.56, spread: 0.30, rough: 0.14, seed: 7, color: stone, width: 1 },
        { peakX: 0.6,  peakH: 0.86, spread: 0.24, rough: 0.12, seed: 1, color: ink, width: 1.4 }
      ];

      var steps = Math.max(120, Math.round(w / 3));
      var main = [];
      layers.forEach(function (L, li) {
        ctx.beginPath();
        for (var s = 0; s <= steps; s++) {
          var t = s / steps;
          var y = sea - ridge(L.peakX, L.peakH, L.spread, L.rough, L.seed, t) * (sea - 14);
          if (li === layers.length - 1) main.push([t * w, y]);
          if (s === 0) ctx.moveTo(t * w, y); else ctx.lineTo(t * w, y);
        }
        ctx.strokeStyle = L.color;
        ctx.lineWidth = L.width;
        ctx.stroke();
      });

      // Contour hatching under the main ridge (every 4th sample, short verticals)
      ctx.strokeStyle = line;
      ctx.lineWidth = 0.8;
      for (var i = 0; i < main.length; i += 4) {
        var p = main[i];
        ctx.beginPath();
        ctx.moveTo(p[0], p[1] + 4);
        ctx.lineTo(p[0], Math.min(sea, p[1] + 4 + (sea - p[1]) * 0.18));
        ctx.stroke();
      }

      // Sea level datum
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = graphite;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, sea); ctx.lineTo(w, sea); ctx.stroke();
      ctx.setLineDash([]);

      // Peak marker
      var top = main.reduce(function (a, b) { return b[1] < a[1] ? b : a; });
      ctx.strokeStyle = ink;
      ctx.fillStyle = graphite;
      ctx.font = "11px 'IBM Plex Mono', monospace";
      var peakLabel = "+1 137 HELDERBERG";
      var tw = ctx.measureText(peakLabel).width;
      var dir = (top[0] + 34 + tw > w - 4) ? -1 : 1; // flip the leader left if it would run off the edge
      ctx.beginPath(); ctx.moveTo(top[0], top[1] - 4); ctx.lineTo(top[0], top[1] - 16); ctx.lineTo(top[0] + dir * 30, top[1] - 16); ctx.stroke();
      ctx.fillText(peakLabel, dir > 0 ? top[0] + 34 : top[0] - 34 - tw, top[1] - 12);
      ctx.fillText("±0.00 FALSE BAY", 8, sea - 6);

      // A small house on the lower slope, in the accent colour
      var idx = Math.round(main.length * 0.47);
      var base = main[idx];
      if (base) {
        var hx = base[0], hy = base[1] + 3;
        var hw = Math.max(26, w * 0.028), hh = hw * 0.52;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(hx - hw / 2, hy);
        ctx.lineTo(hx - hw / 2, hy - hh);
        ctx.lineTo(hx + hw / 2 + hw * 0.18, hy - hh - hw * 0.12); // mono-pitch roof
        ctx.moveTo(hx + hw / 2, hy - hh - hw * 0.1);
        ctx.lineTo(hx + hw / 2, hy);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.font = "11px 'IBM Plex Mono', monospace";
        ctx.fillText("SITE", hx - hw / 2, hy - hh - hw * 0.12 - 10);
      }
    };
    draw();
    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(draw, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", draw);
    }
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  // ---------- Enquiry form: compose an email ----------
  var form = document.getElementById("enquiry");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var subject = "Project enquiry: " + (f["type"].value || "General") + (f["suburb"].value ? " (" + f["suburb"].value + ")" : "");
      var body =
        "Name: " + f["name"].value + "\n" +
        "Email: " + f["email"].value + "\n" +
        "Phone: " + f["phone"].value + "\n" +
        "Project type: " + f["type"].value + "\n" +
        "Suburb / erf: " + f["suburb"].value + "\n\n" +
        f["message"].value;
      var status = document.getElementById("form-status");
      status.textContent = "Your email app should open with this message ready to send. If it doesn't, email " + EMAIL + " directly.";
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }
  // ---------- Work page: status filter and grid/list view ----------
  var work = document.querySelector("[data-work]");
  if (work) {
    var filterBtns = work.querySelectorAll("[data-filter]");
    var viewBtns = work.querySelectorAll("[data-view]");
    var items = work.querySelectorAll("[data-group]");
    var panels = work.querySelectorAll("[data-panel]");
    filterBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filter");
        filterBtns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        items.forEach(function (el) { el.hidden = !(f === "all" || el.getAttribute("data-group") === f); });
      });
    });
    viewBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-view");
        viewBtns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== v; });
      });
    });
  }
})();
