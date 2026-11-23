/* Lazy Fennec · dürbün girişi
   Kaydırma ilerlemesi (0 → 1) tek bir kamerayı sürer:
   geniş çöl → dürbün alttan kalkar → merceklerden girilir → tarama → tilki bulunur
   → yakınlaşma → dürbün açılır → tilki uyanır → sahne ana sayfadaki karta küçülür.
   Her şey tek bir <canvas> üzerinde, düz çizim (vektör) olarak çizilir. */
(function () {
  'use strict';

  function LFIntro() {
    // ===================== DÜRBÜN INTRO =====================
    this.capEls = [];
    // Filmde dürbünle tarama sırasında beliren bilgi kartlarının zamanlaması (metinleri Content/*.json → film.caps)
    this.caps = [{ a: 0.12, b: 0.225 }, { a: 0.235, b: 0.33 }, { a: 0.34, b: 0.44 }, { a: 0.45, b: 0.56 }];
    this.hudLines = [
      [0.13, 0.245, 'ÇÖL TARANIYOR…'], [0.245, 0.315, 'BİR KAKTÜS · TİLKİ DEĞİL'], [0.315, 0.415, 'TURUNCU… AMA SADECE BİR TAŞ'],
      [0.415, 0.52, 'SADECE YILDIZLAR'], [0.52, 0.575, 'DUR! ORADA BİR ŞEY VAR'], [0.575, 0.76, '● FENNEC BULUNDU · UYUYOR']
    ];
    // Seçili dildeki metinler (sayfa düzeni window.LF_I18N.hud olarak gönderir)
    const hudText = (window.LF_I18N && window.LF_I18N.hud) || [];
    this.hudLines.forEach((l, k) => { if (hudText[k]) l[2] = hudText[k]; });
    const cl = (v) => Math.max(0, Math.min(1, v)), ss = (t) => t * t * (3 - 2 * t);
    const io = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const lerp = (a, b, t) => a + (b - a) * t;
    // Gece ↔ gündüz renk karışımı: mix('#gece', '#gündüz', d)
    const hexc = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const mix = (a, b, t) => { const A = hexc(a), B = hexc(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
    const mixA = (a, b, t, al) => { const A = hexc(a), B = hexc(b); return 'rgba(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ',' + al.toFixed(3) + ')'; };
    const win = (p, a, b, f) => cl((p - a) / f) * (1 - cl((p - (b - f)) / f));
    let sd = 11; const rr = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
    this.sky = Array.from({ length: 950 }, () => ({ x: -1600 + rr() * 6800, y: -500 + rr() * 1080, r: rr() < 0.86 ? 0.55 + rr() * 0.85 : 1.5 + rr() * 1.0, c: rr() < 0.24 ? '#9CC3FF' : '#F4EFE6', ph: rr() * 6.28, sp: 0.6 + rr() * 2.2 }));
    const FX = 2600;
    const far = (x) => 600 + 34 * Math.sin(x / 260 + 1) + 14 * Math.sin(x / 97 + 2.3);
    const mid = (x) => { const g = Math.exp(-Math.pow((x - FX) / 130, 2)); return 624 + 20 * Math.sin(x / 190 + 0.5) + (9 * Math.sin(x / 63 + 1.1)) * (1 - g) - 42 * Math.exp(-Math.pow((x - FX) / 160, 2)); };
    const near = (x) => 772 + 30 * Math.sin(x / 310 + 2) + 12 * Math.sin(x / 120);
    const FY = mid(FX);
    const MOON = [2820, 430, 40], RING = [1000, 170, 70], BLUE = [2150, 300, 26];
    const ZF = 91, MAG0 = 4, WIDE_CX = 1650, WIDE_CY = 520, SCAN_CY = 640;
    const keys = [[0.16, 1250], [0.245, 1480], [0.285, 1480], [0.35, 1960], [0.39, 1960], [0.47, 2340], [0.535, 3120], [0.555, 3120], [0.6, FX]];
    const scanX = (p) => { if (p <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (p <= b[0]) return lerp(a[1], b[1], ss((p - a[0]) / (b[0] - a[0]))); } return keys[keys.length - 1][1]; };

    // camera for a given progress p and viewport vp
    this.camAt = (p, vp, t) => {
      const base = vp.h / 1000;
      let Z = 1, cx = WIDE_CX, cy = WIDE_CY, foxY = null;
      const m = ss(cl((p - 0.02) / 0.14));
      const shake = (1 - cl((p - 0.6) / 0.05)) * m;
      if (p < 0.16) { Z = Math.exp(lerp(0, Math.log(MAG0), m)); cx = lerp(WIDE_CX, keys[0][1], m); cy = lerp(WIDE_CY, SCAN_CY, m); }
      else if (p < 0.6) { Z = MAG0; cx = scanX(p); cy = SCAN_CY; }
      else {
        const e = io(cl((p - 0.6) / 0.12));
        Z = Math.exp(lerp(Math.log(MAG0), Math.log(ZF), e)); cx = FX;
        const s0 = base * Math.pow(MAG0, 0.6), y0 = vp.h / 2 + (FY - SCAN_CY) * s0;
        const yd = lerp(y0, 0.64 * vp.h, e);
        foxY = yd; const s = base * Math.pow(Z, 0.6); cy = FY - (yd - vp.h / 2) / s;
      }
      cx += shake * (6 * Math.sin(t * 0.9) + 3 * Math.sin(t * 2.3));
      cy += shake * (4 * Math.sin(t * 1.1 + 1) + 2 * Math.sin(t * 2.9));
      return { Z, cx, cy, base, m };
    };

    this.paths = null;
    this.mkPaths = () => {
      const P = (d) => new Path2D(d);
      this.paths = {
        tail: P('M150 150 Q235 150 225 105 Q215 75 190 98 Q205 130 150 132 Z'), tip: P('M205 92 Q222 84 226 106 Q214 100 205 92 Z'),
        ear1: P('M30 60 L62 110 L40 122 Z'), ear2: P('M118 52 L92 108 L118 116 Z'), in1: P('M38 74 L56 106 L44 113 Z'), in2: P('M112 68 L98 106 L112 110 Z'),
        head: P('M28 118 Q75 92 122 118 Q120 158 75 166 Q30 158 28 118 Z'), paws: P('M50 168 Q75 176 110 166 L118 176 L42 178 Z'),
        c1: P('M44 132 q8 6 16 0'), c2: P('M88 132 q8 6 16 0')
      };
    };
    this.drawFox = (g, X, Y, sc, w, t) => {
      if (!this.paths) this.mkPaths();
      const F = this.paths;
      g.save(); g.translate(X, Y); g.scale(sc, sc); g.translate(-128, -178);
      // ground shadow
      g.fillStyle = mixA('#08060E', '#8A4516', this.day || 0, 0.35 - 0.12 * (this.day || 0)); g.beginPath(); g.ellipse(128, 178, 112, 9, 0, 0, Math.PI * 2); g.fill();
      const br = 1 + 0.03 * Math.sin(t * 1.9) * (1 - 0.6 * w);
      g.save(); g.translate(0, 178); g.scale(1, br); g.translate(0, -178);
      // tail
      g.save(); const ta = w * (0.16 * Math.sin(t * 7) - 0.06); g.translate(160, 140); g.rotate(ta); g.translate(-160, -140);
      g.fillStyle = '#FF8A3D'; g.fill(F.tail); g.fillStyle = '#FFF3E8'; g.fill(F.tip); g.restore();
      g.fillStyle = '#FF8A3D'; g.beginPath(); g.ellipse(128, 140, 78, 38, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(224,111,37,.55)'; g.beginPath(); g.ellipse(150, 160, 52, 14, 0, 0, Math.PI * 2); g.fill();
      g.restore();
      // fare takibi: başın ekrandaki yeri → fareye yön ve uzaklık
      let lx = 0, ly = 0, near = 0;
      const m = this.mouse;
      if (m && w > 0.45) {
        const hx = X + (75 - 128) * sc, hy = Y + (135 - 178 - 8 * w) * sc;
        const dx = m.x - hx, dy = m.y - hy, dist = Math.hypot(dx, dy) || 1, reach = Math.min(1, dist / (90 * sc));
        lx = dx / dist * reach; ly = dy / dist * reach;
        near = 1 - ss(cl((dist - 60 * sc) / (160 * sc)));
      }
      const L = this.lookS || (this.lookS = { x: 0, y: 0, n: 0 });
      L.x += (lx - L.x) * 0.12; L.y += (ly - L.y) * 0.12; L.n += (near - L.n) * 0.08;
      // head group
      g.save(); g.translate(75, 150); g.rotate(-0.07 * w + 0.05 * L.x * w); g.translate(0, -8 * w); g.translate(-75, -150);
      const ear = (path, inner, px, py, a) => { g.save(); g.translate(px, py); g.rotate(a); g.translate(-px, -py); g.fillStyle = '#FF8A3D'; g.fill(path); g.fillStyle = '#FFD9BE'; g.fill(inner); g.restore(); };
      const flick = w > 0.9 ? 0.05 * Math.max(0, Math.sin(t * 2.2)) ** 8 : 0;
      const twitch = L.n * (0.1 + 0.035 * Math.sin(t * 16) * Math.max(0, Math.sin(t * 1.3)));
      ear(F.ear1, F.in1, 50, 116, -0.16 * w - flick - twitch);
      ear(F.ear2, F.in2, 104, 112, 0.13 * w + twitch * 0.8);
      g.fillStyle = '#FF9C59'; g.fill(F.head);
      g.fillStyle = 'rgba(255,110,80,.28)'; g.beginPath(); g.ellipse(40, 146, 8, 5, 0, 0, 6.3); g.ellipse(110, 146, 8, 5, 0, 0, 6.3); g.fill();
      if (w < 0.45) { g.strokeStyle = '#1A0F05'; g.lineWidth = 3; g.lineCap = 'round'; g.stroke(F.c1); g.stroke(F.c2); }
      else {
        const bl = (t % 3.6) < 0.14 ? 0.12 : 1, op = ss(cl((w - 0.45) / 0.25)) * bl;
        g.fillStyle = '#1A0F05';
        const ex = 3.2 * L.x, ey = 2.6 * L.y, big = 1 + 0.12 * L.n;
        g.beginPath(); g.ellipse(52 + ex, 133 + ey, 6.5 * big, Math.max(0.8, 8 * op * big), 0, 0, 6.3); g.ellipse(96 + ex, 133 + ey, 6.5 * big, Math.max(0.8, 8 * op * big), 0, 0, 6.3); g.fill();
        if (op > 0.5) { g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(54.5 + ex * 1.2, 130 + ey * 1.2, 2.3, 0, 6.3); g.arc(98.5 + ex * 1.2, 130 + ey * 1.2, 2.3, 0, 6.3); g.fill(); }
      }
      const yawn = Math.sin(Math.PI * cl((w - 0.05) / 0.45));
      if (yawn > 0.02) { g.fillStyle = '#5A1E10'; g.beginPath(); g.ellipse(74, 160, 6 * yawn, 7 * yawn, 0, 0, 6.3); g.fill(); }
      g.fillStyle = '#1A0F05'; g.beginPath(); g.ellipse(74, 152, 5, 4, 0, 0, 6.3); g.fill();
      g.restore();
      g.fillStyle = '#FFF3E8'; g.fill(F.paws);
      // z z z
      const zs = 1 - ss(cl(w / 0.3));
      if (zs > 0.01) {
        g.font = '800 26px "Bricolage Grotesque", sans-serif'; g.fillStyle = mix('#FFD9BE', '#8A4A1A', this.day || 0);
        for (let i = 0; i < 3; i++) { const k = ((t * 0.33 + i / 3) % 1); g.globalAlpha = zs * Math.sin(Math.PI * k) * 0.95; g.save(); g.translate(112 + k * 34, 112 - k * 60); g.scale(0.6 + k * 0.6, 0.6 + k * 0.6); g.fillText('z', 0, 0); g.restore(); }
        g.globalAlpha = 1;
      }
      g.restore();
    };

    this.drawScene = (g, vp, cam, t, w) => {
      const { Z, cx, cy, base } = cam;
      const S = (k) => base * Math.pow(Z, k);
      const X = (x, s) => vp.x + vp.w / 2 + (x - cx) * s, Y = (y, s) => vp.y + vp.h / 2 + (y - cy) * s;
      const d = this.day || 0, nd = 1 - d;
      const sky = g.createLinearGradient(0, vp.y, 0, vp.y + vp.h);
      sky.addColorStop(0, mix('#09080F', '#C9788A', d)); sky.addColorStop(0.45, mix('#15111E', '#F29A72', d)); sky.addColorStop(1, mix('#2A2233', '#FFD49A', d));
      g.fillStyle = sky; g.fillRect(vp.x, vp.y, vp.w, vp.h);
      // stars
      if (nd > 0.01) { const s = S(0.04); const rs = base * 1.1 * Math.pow(Z, 0.05);
        for (const st of this.sky) { const x = X(st.x, s), y = Y(st.y, s); if (x < vp.x - 4 || x > vp.x + vp.w + 4 || y < vp.y - 4 || y > vp.y + vp.h) continue;
          g.globalAlpha = nd * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * st.sp + st.ph))); g.fillStyle = st.c; g.beginPath(); g.arc(x, y, st.r * rs, 0, 6.3); g.fill(); }
        g.globalAlpha = 1; }
      // shooting stars (screen space, during the scan)
      { const ph = (t % 2.8) / 2.8, id = Math.floor(t / 2.8); const a = (id * 0.618) % 1;
        if (ph < 0.22 && nd > 0.3) { const k = ph / 0.22; const sx = vp.x + vp.w * (0.3 + 0.6 * a), sy = vp.y + vp.h * (0.08 + 0.2 * ((id * 0.37) % 1));
          const L = vp.h * 0.22, dx = -Math.cos(0.45), dy = Math.sin(0.45); const hx = sx + dx * L * 1.8 * k, hy = sy + dy * L * 1.8 * k;
          const gr = g.createLinearGradient(hx, hy, hx - dx * L, hy - dy * L); gr.addColorStop(0, 'rgba(244,239,230,' + (0.9 * Math.sin(Math.PI * k)).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(244,239,230,0)');
          g.strokeStyle = gr; g.lineWidth = Math.max(1, vp.h * 0.0022); g.lineCap = 'round'; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - dx * L, hy - dy * L); g.stroke(); } }
      // clouds (day)
      if (d > 0.01) { const s = S(0.12); g.globalAlpha = d * 0.85; g.fillStyle = '#FFE3D0';
        [[1000, 190, 44], [1720, 120, 32], [2360, 240, 38], [3020, 160, 30], [1380, 300, 24], [2700, 300, 22]].forEach(([cx0, cy0, cr], i) => {
          const x = X(cx0 + 8 * Math.sin(t * 0.05 + i), s), y = Y(cy0, s), r = cr * s;
          if (x < vp.x - 4 * r || x > vp.x + vp.w + 4 * r) return;
          g.beginPath(); g.arc(x - r * 1.1, y, r * 0.75, 0, 6.3); g.arc(x, y - r * 0.35, r, 0, 6.3); g.arc(x + r * 1.15, y, r * 0.8, 0, 6.3); g.fill();
          g.beginPath(); if (g.roundRect) g.roundRect(x - r * 1.85, y - r * 0.1, r * 3.75, r * 0.85, r * 0.42); else g.rect(x - r * 1.85, y - r * 0.1, r * 3.75, r * 0.85); g.fill(); });
        g.globalAlpha = 1; }
      g.globalAlpha = nd;
      // ringed planet
      { const s = S(0.12), x = X(RING[0], s), y = Y(RING[1], s), r = RING[2] * s;
        if (x > vp.x - 3 * r && x < vp.x + vp.w + 3 * r) {
          g.save(); g.translate(x, y); g.rotate(-0.28);
          g.strokeStyle = 'rgba(110,168,255,.8)'; g.lineWidth = r * 0.09;
          g.beginPath(); g.ellipse(0, 0, r * 1.75, r * 0.4, 0, Math.PI, 2 * Math.PI); g.stroke();
          g.fillStyle = '#FF8A3D'; g.beginPath(); g.arc(0, 0, r, 0, 6.3); g.fill();
          g.fillStyle = '#FF9C59'; g.beginPath(); g.arc(-r * 0.36, -r * 0.33, r * 0.2, 0, 6.3); g.fill();
          g.fillStyle = '#E06F25'; g.beginPath(); g.arc(r * 0.34, r * 0.3, r * 0.15, 0, 6.3); g.arc(r * 0.2, -r * 0.45, r * 0.08, 0, 6.3); g.fill();
          g.beginPath(); g.ellipse(0, 0, r * 1.75, r * 0.4, 0, 0, Math.PI); g.stroke();
          g.restore(); } }
      // blue planet
      { const s = S(0.14), x = X(BLUE[0], s), y = Y(BLUE[1], s), r = BLUE[2] * s;
        g.fillStyle = '#6EA8FF'; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill();
        g.fillStyle = '#9CC3FF'; g.beginPath(); g.arc(x - r * 0.33, y - r * 0.3, r * 0.21, 0, 6.3); g.fill();
        g.fillStyle = '#4F86E0'; g.beginPath(); g.arc(x + r * 0.3, y + r * 0.36, r * 0.15, 0, 6.3); g.fill(); }
      g.globalAlpha = 1;
      // sun (day)
      if (d > 0.01) { const s = S(0.1), x = X(MOON[0], s), y = Y(MOON[1], s), r = MOON[2] * s * 1.2;
        g.globalAlpha = d;
        const gl = g.createRadialGradient(x, y, r * 0.6, x, y, r * 5); gl.addColorStop(0, 'rgba(255,190,110,.7)'); gl.addColorStop(1, 'rgba(255,170,100,0)');
        g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 5, 0, 6.3); g.fill();
        g.fillStyle = '#FFB15C'; g.beginPath(); g.arc(x, y, r * 1.12, 0, 6.3); g.fill();
        g.fillStyle = '#FFD98F'; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill();
        g.globalAlpha = 1; }
      // crescent moon
      if (nd > 0.01) { const s = S(0.1), x = X(MOON[0], s), y = Y(MOON[1], s), r = MOON[2] * s; g.globalAlpha = nd;
        const gl = g.createRadialGradient(x, y, r * 0.8, x, y, r * 3.2); gl.addColorStop(0, 'rgba(255,217,190,.14)'); gl.addColorStop(1, 'rgba(255,217,190,0)');
        g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 3.2, 0, 6.3); g.fill();
        g.fillStyle = '#FFD9BE'; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill();
        g.fillStyle = sky; g.beginPath(); g.arc(x + r * 0.46, y - r * 0.32, r * 0.92, 0, 6.3); g.fill(); g.globalAlpha = 1; }
      // dune layer helper
      const dune = (k, fn, col, edge, rip) => { const s = S(k); const step = Math.max(3, vp.w / 260);
        const pts = []; for (let sx = vp.x - step; sx <= vp.x + vp.w + step; sx += step) { const wx = cx + (sx - vp.x - vp.w / 2) / s; pts.push([sx, wx]); }
        g.beginPath(); g.moveTo(vp.x - step, vp.y + vp.h + 2);
        let top = 1e9; pts.forEach(([sx, wx]) => { const y = Y(fn(wx), s); if (y < top) top = y; g.lineTo(sx, y); });
        g.lineTo(vp.x + vp.w + step, vp.y + vp.h + 2); g.closePath();
        const gr = g.createLinearGradient(0, Math.max(vp.y, top), 0, Math.max(vp.y + 1, Math.min(vp.y + vp.h, top + 520 * s))); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
        g.fillStyle = gr; g.fill();
        if (edge) { g.strokeStyle = edge; g.lineWidth = Math.max(1, base * 1.2); g.beginPath(); pts.forEach(([sx, wx], i) => { const y = Y(fn(wx), s); i ? g.lineTo(sx, y) : g.moveTo(sx, y); }); g.stroke(); }
        if (rip) { g.strokeStyle = mixA('#FFD9BE', '#8A4516', d, 0.045 + 0.08 * d); g.lineWidth = Math.max(1, s * 1.6);
          rip.forEach((off, j) => { g.beginPath(); pts.forEach(([sx, wx], i) => { const y = Y(fn(wx * 0.97 + j * 37) + off + 4 * Math.sin(wx / 40 + j), s); i ? g.lineTo(sx, y) : g.moveTo(sx, y); }); g.stroke(); }); }
        return s; };
      const sf = dune(0.35, far, [mix('#241D2F', '#F8DCB6', d), mix('#16111D', '#F0C799', d)], mixA('#6EA8FF', '#FFE7CC', d, 0.1 + 0.4 * d));
      [[1180, 0.8], [1720, 1], [2240, 0.7], [3020, 0.9]].forEach(([kx, hs]) => { const x = X(kx, sf), y = Y(far(kx), sf) + 2 * sf, u = sf * hs;
        if (x < vp.x - 60 * u || x > vp.x + vp.w + 60 * u) return;
        g.strokeStyle = mix('#17121F', '#7C9A62', d); g.lineCap = 'round'; g.lineWidth = 7 * u; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 46 * u); g.stroke();
        g.lineWidth = 5 * u; g.beginPath(); g.moveTo(x, y - 20 * u); g.quadraticCurveTo(x - 14 * u, y - 20 * u, x - 13 * u, y - 34 * u); g.moveTo(x, y - 28 * u); g.quadraticCurveTo(x + 13 * u, y - 28 * u, x + 12 * u, y - 40 * u); g.stroke(); });
      const sm = dune(0.6, mid, [mix('#30273A', '#F5D0A3', d), mix('#1F1928', '#E8B17C', d)], mixA('#FFD9BE', '#FFF4E2', d, 0.1 + 0.45 * d), [26, 60, 105]);
      [[1330, 5], [1610, 4], [2140, 6], [2420, 3.5], [2790, 5], [2960, 4]].forEach(([px, pr]) => { const x = X(px, sm), y = Y(mid(px), sm) + pr * 0.4 * sm, r = pr * sm;
        if (x < vp.x - 2 * r || x > vp.x + vp.w + 2 * r) return; g.fillStyle = mix('#211B2A', '#C27A42', d); g.beginPath(); g.ellipse(x, y, r * 1.4, r, 0, Math.PI, 2 * Math.PI); g.fill(); });
      // orange decoy rock
      { const rx = 1960, x = X(rx, sm), y = Y(mid(rx), sm) + 3 * sm, r = 15 * sm;
        g.fillStyle = '#A84E1E'; g.beginPath(); g.ellipse(x, y - r * 0.55, r * 1.25, r * 0.85, 0, Math.PI, 2 * Math.PI); g.ellipse(x, y - r * 0.55, r * 1.25, r * 0.2, 0, 0, Math.PI); g.fill();
        g.fillStyle = '#D9692B'; g.beginPath(); g.ellipse(x - r * 0.25, y - r * 0.75, r * 0.85, r * 0.55, -0.1, Math.PI * 1.05, Math.PI * 1.95); g.fill(); }
      // fox
      { const x = X(FX, sm), y = Y(FY, sm) + 1.5 * sm; this.foxScreen = { x, y, s: sm };
        this.drawFox(g, x, y, (34 / 250) * sm, w, t); }
      const sn = dune(1.0, near, [mix('#3B3046', '#EDB67E', d), mix('#231C2C', '#D3935A', d)], mixA('#FFD9BE', '#FFF4E2', d, 0.08 + 0.4 * d), [22, 50, 90, 140]);
      // cactus on the near dunes
      { const kx = 1480, x = X(kx, sn), y = Y(near(kx), sn) + 6 * sn, u = sn;
        if (x > vp.x - 200 * u && x < vp.x + vp.w + 200 * u) {
          const cap = (x0, y0, x1, y1, r) => { g.lineCap = 'round'; g.lineWidth = r * 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
          g.strokeStyle = mix('#1A1523', '#5C8452', d);
          cap(x, y, x, y - 150 * u, 13 * u);
          g.beginPath(); g.lineWidth = 18 * u; g.moveTo(x, y - 70 * u); g.quadraticCurveTo(x - 46 * u, y - 70 * u, x - 44 * u, y - 112 * u); g.stroke();
          g.beginPath(); g.moveTo(x, y - 95 * u); g.quadraticCurveTo(x + 40 * u, y - 95 * u, x + 38 * u, y - 128 * u); g.stroke();
          g.strokeStyle = mixA('#6EA8FF', '#E3F0C8', d, 0.22 + 0.3 * d); g.lineWidth = 2 * u; g.beginPath(); g.moveTo(x + 9 * u, y - 10 * u); g.lineTo(x + 9 * u, y - 150 * u); g.stroke();
        } }
    };

    this.drawMask = (g, W, H, m, open, dpr) => {
      if (m <= 0.001 || open >= 0.999) return;
      if (!this.mk) this.mk = document.createElement('canvas');
      const mk = this.mk; if (mk.width !== g.canvas.width || mk.height !== g.canvas.height) { mk.width = g.canvas.width; mk.height = g.canvas.height; }
      const q = mk.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0);
      const R0 = Math.min(0.43 * H, 0.25 * W), d0 = 0.62 * R0;
      const R = R0 * (1 + 3.2 * (1 - m) + 3.5 * open * open), d = d0 * (0.4 + 0.6 * m) * (1 + open);
      const c1 = [W / 2 - d, H / 2], c2 = [W / 2 + d, H / 2];
      q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, W, H);
      q.fillStyle = 'rgba(6,5,11,' + (0.985 * Math.min(1, m * 1.4) * (1 - open)).toFixed(3) + ')'; q.fillRect(0, 0, W, H);
      q.globalCompositeOperation = 'destination-out'; q.fillStyle = '#000';
      try { q.filter = 'blur(' + (R * 0.07).toFixed(1) + 'px)'; } catch (er) { }
      q.beginPath(); q.arc(c1[0], c1[1], R * 0.97, 0, 6.3); q.arc(c2[0], c2[1], R * 0.97, 0, 6.3); q.fill();
      try { q.filter = 'none'; } catch (er) { }
      q.globalCompositeOperation = 'source-over';
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(mk, 0, 0); g.restore();
    };


    this.drawBino = (g, W, H, u, t, dpr) => {
      if (!this.ov) this.ov = document.createElement('canvas');
      const ov = this.ov; if (ov.width !== g.canvas.width || ov.height !== g.canvas.height) { ov.width = g.canvas.width; ov.height = g.canvas.height; }
      const q = ov.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.globalCompositeOperation = 'source-over'; q.globalAlpha = 1; q.clearRect(0, 0, W, H);
      this.drawScene(q, { x: 0, y: 0, w: W, h: H, r: 0 }, { Z: 1, cx: WIDE_CX, cy: WIDE_CY, base: H / 1000 }, t, 0);
      const R0 = Math.min(0.43 * H, 0.25 * W), d0 = 0.62 * R0;
      const ue = io(u), k = lerp(0.36, 1, ue);
      const ri = R0 * k, d = k * lerp(1.55 * R0, d0, ss(cl((u - 0.6) / 0.4))), ro = ri * 1.42;
      const cxB = W / 2, cyB = lerp(H * 1.0, H / 2, ue) + (1 - u) * Math.sin(t * 1.6) * H * 0.006;
      const L = [cxB - d, cyB], Rr = [cxB + d, cyB];
      // strap
      q.strokeStyle = '#FF8A3D'; q.lineCap = 'round'; q.lineWidth = ri * 0.11;
      q.beginPath(); q.moveTo(L[0] - ro * 0.92, cyB - ro * 0.2); q.bezierCurveTo(L[0] - ro * 1.5, cyB + ro * 0.6, L[0] - ro * 0.6, cyB + ro * 2.2, cxB - d * 0.2, H + ro * 3); q.stroke();
      q.beginPath(); q.moveTo(Rr[0] + ro * 0.92, cyB - ro * 0.2); q.bezierCurveTo(Rr[0] + ro * 1.5, cyB + ro * 0.6, Rr[0] + ro * 0.6, cyB + ro * 2.2, cxB + d * 0.2, H + ro * 3); q.stroke();
      // bridge
      q.fillStyle = '#1C1826'; q.beginPath(); if (q.roundRect) q.roundRect(L[0], cyB - ri * 0.55, d * 2, ri * 1.1, ri * 0.3); else q.rect(L[0], cyB - ri * 0.55, d * 2, ri * 1.1); q.fill();
      // barrels
      [L, Rr].forEach(c => { q.fillStyle = '#1C1826'; q.beginPath(); q.arc(c[0], c[1], ro, 0, 6.3); q.fill();
        q.strokeStyle = '#3A3150'; q.lineWidth = ri * 0.045; q.beginPath(); q.arc(c[0], c[1], ro - ri * 0.03, Math.PI * 1.05, Math.PI * 1.75); q.stroke();
        q.fillStyle = '#2B2738'; q.beginPath(); q.arc(c[0], c[1], ri * 1.16, 0, 6.3); q.fill();
        q.strokeStyle = '#141019'; q.lineWidth = ri * 0.04; q.beginPath(); q.arc(c[0], c[1], ri * 1.02, 0, 6.3); q.stroke(); });
      // focus wheel
      const fw = ri * 0.62, fh = ri * 0.34, fx = cxB - fw / 2, fy = cyB - ri * 0.55 - fh * 0.6;
      q.fillStyle = '#FF8A3D'; q.beginPath(); if (q.roundRect) q.roundRect(fx, fy, fw, fh, fh * 0.35); else q.rect(fx, fy, fw, fh); q.fill();
      q.strokeStyle = '#E06F25'; q.lineWidth = Math.max(1, ri * 0.025);
      for (let i = 1; i < 7; i++) { const xx = fx + fw * i / 7 + ((t * 0.0) % 1); q.beginPath(); q.moveTo(xx, fy + fh * 0.18); q.lineTo(xx, fy + fh * 0.82); q.stroke(); }
      // darken the world around as the binoculars reach the eyes
      q.fillStyle = 'rgba(6,5,11,' + (0.985 * u * u * u).toFixed(3) + ')'; q.fillRect(0, 0, W, H);
      // cut the lenses open
      q.globalCompositeOperation = 'destination-out'; q.fillStyle = '#000';
      try { q.filter = 'blur(' + (ri * 0.07).toFixed(1) + 'px)'; } catch (er) { }
      q.beginPath(); q.arc(L[0], L[1], ri * 0.97, 0, 6.3); q.arc(Rr[0], Rr[1], ri * 0.97, 0, 6.3); q.fill();
      try { q.filter = 'none'; } catch (er) { }
      q.globalCompositeOperation = 'source-over';
      // glass reflection fades as we look through
      const gl = 1 - ss(cl((u - 0.25) / 0.55));
      if (gl > 0.01) [L, Rr].forEach(c => { const gr = q.createRadialGradient(c[0] - ri * 0.3, c[1] - ri * 0.35, ri * 0.1, c[0], c[1], ri);
        gr.addColorStop(0, 'rgba(110,168,255,' + (0.55 * gl).toFixed(3) + ')'); gr.addColorStop(0.6, 'rgba(22,30,60,' + (0.85 * gl).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(10,12,26,' + (0.95 * gl).toFixed(3) + ')');
        q.fillStyle = gr; q.beginPath(); q.arc(c[0], c[1], ri * 0.98, 0, 6.3); q.fill();
        q.strokeStyle = 'rgba(244,239,230,' + (0.7 * gl).toFixed(3) + ')'; q.lineWidth = ri * 0.06; q.lineCap = 'round';
        q.beginPath(); q.arc(c[0], c[1], ri * 0.7, Math.PI * 1.15, Math.PI * 1.42); q.stroke();
        q.beginPath(); q.arc(c[0] + ri * 0.35, c[1] + ri * 0.3, ri * 0.06, 0, 6.3); q.fillStyle = 'rgba(244,239,230,' + (0.5 * gl).toFixed(3) + ')'; q.fill(); });
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(ov, 0, 0); g.restore();
    };
    this.frame = (t) => {
      const cv = this.cvEl; if (!cv || !this.wrapEl) return;
      const r = this.wrapEl.getBoundingClientRect();
      const W = cv.clientWidth || 1, H = cv.clientHeight || 1;
      const dayT = document.documentElement.getAttribute('data-theme') === 'day' ? 1 : 0;
      this.day = this.day == null ? dayT : this.day + (dayT - this.day) * 0.07;
      if (Math.abs(dayT - this.day) < 0.002) this.day = dayT;
      if (r.bottom < -50 || r.top > H + 50) {
        // Film ekran dışında: menü görünür kalsın (ör. sayfa doğrudan #iletisim ile açıldıysa).
        if (this.navEl && r.bottom < -50) { this.navEl.style.opacity = '1'; this.navEl.style.pointerEvents = 'auto'; }
        return;
      }
      const sp = cl(-r.top / Math.max(1, r.height - H));
      const p = Math.max(sp, (this.props.progress ?? 0) / 100);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      // viewport: full screen -> hero card
      const e = io(cl((p - 0.86) / 0.11));
      let vp = { x: 0, y: 0, w: W, h: H, r: 0 };
      if (e > 0 && this.cardEl) { const cr = this.cardEl.getBoundingClientRect(), sr = cv.getBoundingClientRect();
        vp = { x: lerp(0, cr.left - sr.left, e), y: lerp(0, cr.top - sr.top, e), w: lerp(W, cr.width, e), h: lerp(H, cr.height, e), r: 48 * e }; }
      const cam = this.camAt(p, vp, t);
      const w = ss(cl((p - 0.77) / 0.07));
      g.save(); g.beginPath();
      if (g.roundRect) g.roundRect(vp.x, vp.y, vp.w, vp.h, vp.r); else g.rect(vp.x, vp.y, vp.w, vp.h);
      g.clip();
      this.drawScene(g, vp, cam, t, w);
      g.restore();
      const open = ss(cl((p - 0.72) / 0.06));
      if (p < 0.16) this.drawBino(g, W, H, ss(cl((p - 0.02) / 0.14)), t, dpr); else this.drawMask(g, W, H, 1, open, dpr);
      // overlays
      const set = (el, k, v) => { if (el && el.style[k] !== v) el.style[k] = v; };
      set(this.titleEl, 'opacity', (1 - cl((p - 0.03) / 0.04)).toFixed(3));
      set(this.hudEl, 'opacity', (cl((p - 0.15) / 0.03) * (1 - open)).toFixed(3));
      if (this.zoomEl) { const z = 8 * cam.Z / MAG0; const tx = '×' + (z < 20 ? z.toFixed(1) : Math.round(z)).toString().replace('.', ','); if (this.zoomEl.textContent !== tx) this.zoomEl.textContent = tx; }
      if (this.hudTxtEl) { const ln = this.hudLines.find(l => p >= l[0] && p < l[1]); const tx = ln ? ln[2] : ''; if (this.hudTxtEl.textContent !== tx) { this.hudTxtEl.textContent = tx; this.hudTxtEl.style.color = this.hudLines.indexOf(ln) >= 4 ? '#FF9C59' : '#9CC3FF'; } }
      this.caps.forEach((c, i) => { const el = this.capEls[i]; if (!el) return; const o = win(p, c.a, c.b, 0.02); set(el, 'opacity', o.toFixed(3)); set(el, 'transform', 'translateY(' + ((1 - o) * 12).toFixed(1) + 'px)'); });
      set(this.helloEl, 'opacity', win(p, 0.785, 0.875, 0.02).toFixed(3));
      const hero = cl((p - 0.9) / 0.07);
      set(this.heroEl, 'opacity', hero.toFixed(3)); set(this.heroEl, 'pointerEvents', hero > 0.5 ? 'auto' : 'none');
      const nav = cl((p - 0.93) / 0.05);
      set(this.navEl, 'opacity', nav.toFixed(3)); set(this.navEl, 'pointerEvents', nav > 0.5 ? 'auto' : 'none');
    };
    this.tick = (ts) => { this.loopId = requestAnimationFrame(this.tick); try { this.frame((ts || 0) / 1000); } catch (er) { if (!this.errOnce) { this.errOnce = 1; console.log('[LF] frame', er); } } };
  }

  function boot() {
    var $ = function (id) { return document.getElementById(id); };
    var f = new LFIntro();
    f.props = { progress: 0 };
    f.wrapEl = $('ust');
    f.cvEl = $('lf-canvas');
    f.titleEl = $('lf-title');
    f.hudEl = $('lf-hud');
    f.hudTxtEl = $('lf-hud-text');
    f.zoomEl = $('lf-zoom');
    f.heroEl = $('lf-hero');
    f.cardEl = $('lf-card');
    f.navEl = $('lf-nav');
    f.helloEl = $('lf-hello');
    f.capEls = Array.prototype.slice.call(document.querySelectorAll('[data-cap]'));
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      window.addEventListener('mousemove', function (e) { var r = f.cvEl.getBoundingClientRect(); f.mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; }, { passive: true });
      document.addEventListener('mouseleave', function () { f.mouse = null; });
    }
    if (!f.wrapEl || !f.cvEl || !f.cvEl.getContext) return;
    requestAnimationFrame(f.tick);

    // ---- Sahneden sahneye yumuşak geçiş: az kaydırınca bile bir sonraki sahneye kendiliğinden kayar ----
    var STOPS = [0, 0.16, 0.27, 0.38, 0.5, 0.6, 0.72, 0.84, 1];
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var root = document.documentElement, anim = null, animEnd = 0, lastWheel = 0, settleT = 0, ty = null;
    function range() {
      var r = f.wrapEl.getBoundingClientRect(), top = r.top + window.scrollY, len = Math.max(1, r.height - window.innerHeight);
      return { top: top, len: len, end: top + len };
    }
    function progress(g) { return Math.max(0, Math.min(1, (window.scrollY - g.top) / g.len)); }
    function inFilm(dir) {
      var g = range(), y = window.scrollY;
      return dir > 0 ? (y >= g.top - 2 && y < g.end - 2) : (y > g.top + 2 && y <= g.end + 2);
    }
    function target(dir) {
      var g = range(), p = progress(g), s = null, i;
      if (dir > 0) { for (i = 0; i < STOPS.length; i++) if (STOPS[i] > p + 0.01) { s = STOPS[i]; break; } }
      else { for (i = STOPS.length - 1; i >= 0; i--) if (STOPS[i] < p - 0.01) { s = STOPS[i]; break; } }
      return s === null ? null : g.top + s * g.len;
    }
    function jump(y) { root.style.scrollBehavior = 'auto'; window.scrollTo(0, y); }
    function go(y) {
      var from = window.scrollY, d = y - from;
      if (Math.abs(d) < 1) return;
      if (anim) cancelAnimationFrame(anim);
      if (reduce) { jump(y); root.style.scrollBehavior = ''; animEnd = performance.now(); return; }
      var dur = Math.min(1600, 750 + Math.abs(d) * 0.75), t0 = performance.now();
      var step = function (now) {
        var k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        jump(from + d * e);
        if (k < 1) anim = requestAnimationFrame(step);
        else { anim = null; animEnd = performance.now(); root.style.scrollBehavior = ''; }
      };
      anim = requestAnimationFrame(step);
    }
    function nudge(dir) { if (anim) return; var y = target(dir); if (y !== null) go(y); }

    // Site bölümleri: Hizmetler → Oyunlar → Süreç → Hakkımda → İletişim.
    // Ekrandan uzun bir bölümde önce normal kaydırılır, sonuna gelince bir sonrakine geçilir.
    var sections = Array.prototype.slice.call(document.querySelectorAll('.lf-site > .lf-section'));
    function siteStops() {
      var y = window.scrollY, navH = f.navEl ? f.navEl.offsetHeight : 0, maxY = root.scrollHeight - window.innerHeight;
      return [range().end].concat(sections.map(function (s) { return Math.min(maxY, Math.round(s.getBoundingClientRect().top + y - navH)); }));
    }
    // Sayı: gidilecek yer · 'native': tarayıcı normal kaydırsın
    function siteTarget(dir) {
      var y = window.scrollY, vh = window.innerHeight, st = siteStops(), i = 0, k;
      if (y < st[0] - 2) return 'native';
      for (k = 0; k < st.length; k++) if (st[k] <= y + 2) i = k;
      if (dir > 0) {
        var next = st[i + 1];
        if (next === undefined || next <= y + 2) return 'native';
        return (next - y > vh + 2) ? 'native' : next;
      }
      if (y > st[i] + 2) return (y - st[i] <= vh * 0.6) ? st[i] : 'native';
      var prev = st[i - 1];
      if (prev === undefined) return 'native';
      return (i - 1 > 0 && st[i] - prev > vh + 2) ? st[i] - vh : prev;
    }

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;
      var dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      if (!dir) return;
      var film = inFilm(dir), dest = film ? null : siteTarget(dir);
      if (!film && (dest === 'native' && !anim)) return;
      e.preventDefault();
      var now = performance.now(), gap = now - lastWheel; lastWheel = now;
      if (anim) return;
      // Touchpad'in kaydırma ataleti bir sonraki sahneyi de atlatmasın
      if (now - animEnd < 260 || (gap < 140 && now - animEnd < 1200)) return;
      if (film) nudge(dir); else if (dest !== 'native') go(dest);
    }, { passive: false });

    window.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (ty === null) return;
      var dy = ty - e.touches[0].clientY;
      if (Math.abs(dy) > 4 && inFilm(dy > 0 ? 1 : -1)) e.preventDefault();
    }, { passive: false });
    window.addEventListener('touchend', function (e) {
      if (ty === null) return;
      var t = e.changedTouches && e.changedTouches[0], dy = ty - (t ? t.clientY : ty); ty = null;
      if (Math.abs(dy) < 24) return;
      var dir = dy > 0 ? 1 : -1;
      if (inFilm(dir)) nudge(dir);
    }, { passive: true });

    window.addEventListener('keydown', function (e) {
      var el = e.target;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName))) return;
      var k = e.key, dir = (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) ? 1
        : (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) ? -1 : 0;
      if (!dir) return;
      if (inFilm(dir)) { e.preventDefault(); nudge(dir); return; }
      var dest = siteTarget(dir);
      if (dest !== 'native') { e.preventDefault(); if (!anim) go(dest); }
    });

    // Kaydırma çubuğuyla sürüklenip iki sahne arasında bırakılırsa en yakın sahneye otur
    window.addEventListener('scroll', function () {
      if (anim) return;
      clearTimeout(settleT);
      settleT = setTimeout(function () {
        if (anim) return;
        var g = range(), y = window.scrollY;
        if (y <= g.top + 1 || y >= g.end - 1) return;
        var p = progress(g), best = STOPS[0];
        STOPS.forEach(function (s) { if (Math.abs(s - p) < Math.abs(best - p)) best = s; });
        go(g.top + best * g.len);
      }, 220);
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
