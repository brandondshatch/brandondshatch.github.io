(() => {
  'use strict';

  // Tunables — safe to adjust without touching the animation logic below.
  const CONFIG = {
    imageOpacity: 0.45,
    parallax: 0.14,
    motionBlur: true
  };

  const els = {
    blur: document.getElementById('ll-mblur-std'),
    bgCanvas: document.getElementById('bg-canvas'),
    scrollCue: document.getElementById('scroll-cue'),
    b1: document.getElementById('b1'),
    b2: document.getElementById('b2'),
    b3: document.getElementById('b3'),
    b4: document.getElementById('b4'),
    b5: document.getElementById('b5'),
    nodesSvg: document.getElementById('nodes-svg'),
    c1: document.getElementById('node-circle-1'),
    c2: document.getElementById('node-circle-2'),
    c3: document.getElementById('node-circle-3'),
    l1: document.getElementById('node-line-1'),
    l2: document.getElementById('node-line-2'),
    icon1: document.getElementById('node-icon-1'),
    icon2: document.getElementById('node-icon-2'),
    icon3: document.getElementById('node-icon-3')
  };

  let groups = [];
  let blueprint = [];
  let seqWorld, seqDeer;
  let cityImg;
  let lastY = window.scrollY;
  let vel = 0;
  let t0 = performance.now();
  let prepped = false;
  let nodesRun = false;

  // ---------- word animation ----------

  function wrapWords(el) {
    const spans = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const parts = ch.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const s = document.createElement('span');
            s.textContent = p;
            s.style.display = 'inline-block';
            s.style.opacity = '0';
            s.style.transform = 'translateY(0.55em)';
            s.style.filter = 'blur(9px)';
            spans.push(s);
            frag.appendChild(s);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
          walk(ch);
        }
      });
    };
    walk(el);
    return spans;
  }

  function prepGroups() {
    if (prepped) return;
    prepped = true;
    document.querySelectorAll('[data-anim]').forEach((groupEl) => {
      const items = [];
      groupEl.querySelectorAll('[data-words]').forEach((el) => {
        items.push({ kind: el.getAttribute('data-words'), spans: wrapWords(el) });
      });
      groupEl.querySelectorAll('[data-fade]').forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(18px)';
        items.push({ kind: 'fade', el });
      });
      groupEl.style.willChange = 'transform';
      groups.push({ el: groupEl, items, revealed: false, ty: 0, top: 0, h: 0 });
    });
  }

  function revealGroup(g) {
    if (g.revealed) return;
    g.revealed = true;
    let off = 0;
    g.items.forEach((item) => {
      if (item.kind === 'fade') {
        item.el.style.transition = 'opacity 0.9s ease ' + off + 'ms, transform 0.9s ease ' + off + 'ms';
        item.el.style.opacity = '1';
        item.el.style.transform = 'translateY(0)';
        off += 260;
        return;
      }
      const per = item.kind === 'title' ? 85 : item.kind === 'label' ? 55 : 17;
      item.spans.forEach((s, i) => {
        const d = off + i * per;
        s.style.transition = 'opacity 0.85s ease ' + d + 'ms, transform 0.85s ease ' + d + 'ms, filter 0.85s ease ' + d + 'ms';
        s.style.opacity = '1';
        s.style.transform = 'translateY(0)';
        s.style.filter = 'blur(0px)';
      });
      off += item.spans.length * per + 240;
    });
    // clear per-word filters once done so scroll blur stays cheap
    setTimeout(() => {
      g.items.forEach((item) => {
        if (item.spans) item.spans.forEach((s) => { s.style.filter = ''; s.style.transition = ''; });
      });
    }, off + 1000);
  }

  let io;
  function setupObserver() {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const g = groups.find((x) => x.el === e.target);
          if (g) revealGroup(g);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.22 });
    groups.forEach((g) => io.observe(g.el));
  }

  // ---------- scroll-scrubbed background sequences ----------

  function initSequences() {
    const mk = (base, count) => ({ base, count, frames: new Array(count), started: false });
    seqWorld = mk('assets/world/w_', 121);
    seqDeer = mk('assets/deer/d_', 121);
    loadSeq(seqWorld);
    setTimeout(() => loadSeq(seqDeer), 1200);
    cityImg = new Image();
    cityImg.decoding = 'async';
    cityImg.src = 'assets/city.webp';
  }

  function loadSeq(seq) {
    if (seq.started) return;
    seq.started = true;
    let next = 0, active = 0;
    const pump = () => {
      while (active < 8 && next < seq.count) {
        const i = next++;
        active++;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { seq.frames[i] = img; active--; pump(); };
        img.onerror = () => { active--; pump(); };
        img.src = seq.base + String(i).padStart(3, '0') + '.webp';
      }
    };
    pump();
  }

  function pickFrame(seq, p) {
    const want = Math.round(p * (seq.count - 1));
    if (seq.frames[want]) return seq.frames[want];
    for (let d = 1; d < seq.count; d++) {
      if (seq.frames[want - d]) return seq.frames[want - d];
      if (seq.frames[want + d]) return seq.frames[want + d];
    }
    return null;
  }

  function drawCover(ctx, img, w, h, alpha, dy) {
    if (!img || alpha <= 0.004) return;
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2 + (dy || 0), dw, dh);
    ctx.globalAlpha = 1;
  }

  // ---------- blueprint interlude ----------

  function buildBlueprint() {
    let seed = 4242;
    const rnd = () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const traces = [];
    for (let i = 0; i < 26; i++) {
      const pts = [];
      let x = rnd(), y = rnd() * 1.5 - 0.25;
      pts.push([x, y]);
      let horiz = rnd() < 0.5;
      const n = 3 + Math.floor(rnd() * 3);
      for (let s = 0; s < n; s++) {
        const len = 0.05 + rnd() * 0.16;
        const dir = rnd() < 0.5 ? -1 : 1;
        if (horiz) x += len * dir; else y += len * dir * 0.8;
        pts.push([x, y]);
        horiz = !horiz;
      }
      traces.push({ pts, ph: rnd(), w: rnd() < 0.2 ? 1.4 : 1 });
    }
    blueprint = traces;
  }

  function drawBlueprint(ctx, w, h, vc, mid, t, alpha) {
    if (alpha <= 0.004) return;
    const drift = (vc - mid) * 0.28;
    ctx.save();
    ctx.lineWidth = 1;
    blueprint.forEach((tr) => {
      ctx.strokeStyle = 'rgba(247,244,240,' + (alpha * (0.55 + tr.ph * 0.45)) + ')';
      ctx.lineWidth = tr.w;
      ctx.beginPath();
      tr.pts.forEach((p, i) => {
        const x = p[0] * w;
        const y = p[1] * h - drift + Math.sin(t * 0.25 + tr.ph * 6.28) * 4;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      const last = tr.pts[tr.pts.length - 1];
      const first = tr.pts[0];
      [first, last].forEach((p) => {
        ctx.beginPath();
        ctx.arc(p[0] * w, p[1] * h - drift + Math.sin(t * 0.25 + tr.ph * 6.28) * 4, 2.2, 0, Math.PI * 2);
        ctx.stroke();
      });
    });
    ctx.restore();
  }

  function anchor(el) {
    if (!el) return 0;
    const g = groups.find((x) => x.el === el);
    if (g) return g.top + g.h / 2;
    const r = el.getBoundingClientRect();
    return r.top + window.scrollY + r.height / 2;
  }

  function drawBackground(y, vh, t) {
    const c = els.bgCanvas;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = window.innerWidth, h = window.innerHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const vc = y + vh / 2;
    const span = (a, b, v) => Math.max(0, Math.min(1, (v - a) / (b - a)));
    const A1 = anchor(els.b1), A2 = anchor(els.b2);
    const A3 = anchor(els.b3), A4 = anchor(els.b4), A5 = anchor(els.b5);
    if (!A1) return;
    // virtual pivots standing in for the removed quote blocks — keep the
    // same crossfade/interlude timing without needing extra DOM anchors
    const A2q = A2 + vh * 0.55;
    const A3q = A3 + vh * 0.5;
    // overall image level: quieter, and it breathes — dips while a text block
    // is centered on screen, rises in the space between blocks
    const base = CONFIG.imageOpacity;
    let nearText = 0;
    [A1, A2, A2q, A3, A3q, A4, A5].forEach((a) => {
      const d = Math.abs(vc - a) / (vh * 0.5);
      nearText = Math.max(nearText, Math.max(0, 1 - d));
    });
    const level = base * (1 - 0.45 * nearText);
    // world remade: shattered at "It's loud out there", whole by "Built with you"
    const wAlpha = span(A1 - vh * 0.95, A1 - vh * 0.25, vc) * (1 - span(A2q, A2q + vh * 0.55, vc));
    if (wAlpha > 0) {
      const p = span(A1, A2, vc);
      drawCover(ctx, pickFrame(seqWorld, p), w, h, wAlpha * level);
    }
    // deer zoom: crossfades in at the quote, animates until "Prove one thing", dissolves by "One working routine"
    const dAlpha = span(A2q, A2q + vh * 0.55, vc) * (1 - span(A3 + vh * 0.3, A3q - vh * 0.1, vc));
    if (dAlpha > 0) {
      const p = span(A2q + vh * 0.35, A3, vc);
      drawCover(ctx, pickFrame(seqDeer, p), w, h, dAlpha * level);
    }
    // blueprint interlude between the flow quote and the path heading
    const bt = span(A3q + vh * 0.15, A4 - vh * 0.15, vc);
    if (bt > 0 && bt < 1) {
      const env = Math.sin(bt * Math.PI);
      drawBlueprint(ctx, w, h, vc, (A3q + A4) / 2, t, env * 0.15);
    }
    // city skyline: dissolves in as it rises between the offers and "Begin
    // with a conversation," then dissolves back out as it drifts offscreen
    if (A5) {
      const ct = span(A5 - vh * 0.9, A5 - vh * 0.05, vc);
      if (ct > 0 && ct < 1) {
        const cEnv = Math.sin(ct * Math.PI);
        const rise = (0.5 - ct) * vh * 0.5;
        drawCover(ctx, cityImg, w, h, cEnv * level, rise);
      }
    }
  }

  // ---------- three-offer node sequence ----------

  let nodesIo;
  function prepNodes() {
    [els.l1, els.l2].forEach((l) => {
      if (!l) return;
      l.style.strokeDasharray = '250';
      l.style.strokeDashoffset = '250';
    });
    [els.c1, els.c2, els.c3].forEach((c) => { if (c) c.style.opacity = '0'; });
    if (!els.nodesSvg) return;
    nodesIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          runNodes();
          nodesIo.disconnect();
        }
      });
    }, { threshold: 0.6 });
    nodesIo.observe(els.nodesSvg);
  }

  function runNodes() {
    if (nodesRun) return;
    nodesRun = true;
    const cs = [els.c1, els.c2, els.c3];
    const ls = [els.l1, els.l2];
    const icons = [els.icon1, els.icon2, els.icon3];
    cs.forEach((c, i) => {
      if (!c) return;
      c.style.transition = 'opacity 0.6s ease ' + (i * 100) + 'ms';
      c.style.opacity = '1';
    });
    const fill = (c, icon, d) => setTimeout(() => {
      if (c) {
        c.style.transition = 'fill-opacity 0.5s ease, stroke 0.5s ease';
        c.style.fillOpacity = '1';
        c.style.stroke = '#C17D3C';
      }
      if (icon) {
        setTimeout(() => {
          icon.style.transition = 'opacity 0.6s ease';
          icon.style.opacity = '1';
        }, 150);
      }
    }, d);
    const draw = (l, d) => setTimeout(() => {
      if (!l) return;
      l.style.transition = 'stroke-dashoffset 0.5s ease';
      l.style.strokeDashoffset = '0';
    }, d);
    fill(cs[0], icons[0], 300);
    draw(ls[0], 600);
    fill(cs[1], icons[1], 1000);
    draw(ls[1], 1300);
    fill(cs[2], icons[2], 1700);
  }

  // ---------- parallax float + motion blur ----------

  function measure() {
    groups.forEach((g) => {
      const r = g.el.getBoundingClientRect();
      g.top = r.top + window.scrollY - g.ty;
      g.h = r.height;
    });
  }

  let raf;
  function frame() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const strength = reduce ? 0 : CONFIG.parallax;
    const blurOn = !reduce && CONFIG.motionBlur;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const dy = y - lastY;
    lastY = y;
    vel = vel * 0.82 + dy * 0.18;
    if (els.scrollCue) els.scrollCue.style.opacity = String(Math.max(0, 1 - y / (vh * 0.3)));
    drawBackground(y, vh, reduce ? 0 : (performance.now() - t0) / 1000);
    const b = blurOn ? Math.min(Math.abs(vel) * 0.055, 6) : 0;
    if (els.blur) els.blur.setAttribute('stdDeviation', '0 ' + b.toFixed(2));
    const lim = vh * 0.22;
    groups.forEach((g) => {
      const center = g.top + g.h / 2;
      const viewCenter = y + vh / 2;
      // off-screen: skip work
      if (g.top + g.h < y - vh || g.top > y + vh * 2) return;
      let ty = (viewCenter - center) * strength;
      ty = Math.max(-lim, Math.min(lim, ty));
      g.ty = ty;
      g.el.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0)';
      const useBlur = b > 0.35 && g.revealed;
      const f = useBlur ? 'url(#ll-mblur)' : '';
      if (g.el.style.filter !== f) g.el.style.filter = f;
    });
    raf = requestAnimationFrame(frame);
  }

  function init() {
    groups = [];
    initSequences();
    buildBlueprint();
    prepGroups();
    measure();
    setupObserver();
    prepNodes();
    lastY = window.scrollY;
    vel = 0;
    t0 = performance.now();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    }
    raf = requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
