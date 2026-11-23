/* Lazy Fennec · genel site davranışları:
   arka plan yıldızları ve paralaks, kaydırınca beliren bölümler, logo ile başa dönüş, iletişim formu. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rootEl = document.documentElement;
  var T = window.LF_I18N || {}, TF = T.form || {}, TT = T.theme || {};

  // ---- Sayfa her açılışta en baştan (dürbünden) başlasın ----
  // Tarayıcı son kaydırma yerini ya da adresteki #iletisim gibi bir bölümü hatırlamasın.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!document.querySelector('.lf-jump')) {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    var toTop = function () { rootEl.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); };
    toTop();
    window.addEventListener('load', function () { toTop(); setTimeout(function () { toTop(); rootEl.style.scrollBehavior = ''; }, 30); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) toTop(); });
  }

  // ---- Her bölüm tam bir ekran olsun ve ortada dursun ----
  // Menünün altında kalan alanı doldurur; içerik sığmıyorsa bölümü biraz küçültür (en fazla %28).
  var navEl = document.getElementById('lf-nav');
  var fitSecs = Array.prototype.slice.call(document.querySelectorAll('.lf-site > .lf-section'));
  function fitSections() {
    var navH = navEl ? navEl.offsetHeight : 0, avail = window.innerHeight - navH, phone = window.innerWidth < 761;
    rootEl.style.setProperty('--nav-h', navH + 'px');
    fitSecs.forEach(function (s) {
      s.style.zoom = ''; s.style.minHeight = '0px';
      var h = s.offsetHeight, z = Math.max(phone ? 0.8 : 0.72, Math.min(1, avail / h));
      if (z < 0.995) s.style.zoom = z.toFixed(3); else z = 1;
      s.style.minHeight = (avail / z) + 'px';
    });
  }
  fitSections();
  var fitT = 0;
  window.addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(fitSections, 120); });
  window.addEventListener('load', fitSections);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSections);

  // ---- Menü bağlantıları: adrese #bölüm eklemeden yumuşakça kaydır ----
  document.querySelectorAll('a[href^="#"]:not([data-top])').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // ---- Yıldızlar (sabit arka plan) ----
  var far = document.getElementById('lf-far'), mid = document.getElementById('lf-mid');
  if (far) {
    var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 130; i++) {
      var s = document.createElement('span'), sz = rnd() < 0.85 ? 1 + rnd() * 1.6 : 2.6 + rnd() * 1.2;
      s.className = 'lf-star';
      s.style.cssText = 'left:' + (rnd() * 100).toFixed(2) + '%;top:' + (rnd() * 100).toFixed(2) + '%;width:' + sz.toFixed(1) + 'px;height:' + sz.toFixed(1) +
        'px;background:' + (rnd() < 0.22 ? '#9CC3FF' : '#F4EFE6') + ';animation-duration:' + (2 + rnd() * 4).toFixed(1) + 's;animation-delay:' + (rnd() * 5).toFixed(1) + 's';
      frag.appendChild(s);
    }
    far.appendChild(frag);
  }

  // ---- Gündüz (gün batımı) arka planı: bulutlar ve kum tepeleri, katman katman ----
  var bg = document.querySelector('.lf-bg'), dayLayers = [];
  if (bg) {
    var day = document.createElement('div');
    day.className = 'lf-bg__day';
    var cloud = function (cls, x, y, w, dur, delay) {
      return '<svg class="lf-day__cloud ' + cls + '" style="left:' + x + '%;top:' + y + '%;width:' + w + 'px;animation-duration:' + dur + 's;animation-delay:-' + delay + 's" viewBox="0 0 200 70" aria-hidden="true">' +
        '<path d="M22 62 Q4 62 6 46 Q8 32 26 34 Q30 14 54 16 Q66 2 88 8 Q104 -2 122 12 Q148 6 156 28 Q182 24 190 44 Q196 62 176 62 Z"/></svg>';
    };
    day.innerHTML =
      '<div class="lf-day__layer" data-d="0.3">' + cloud('lf-day__cloud--far', 12, 12, 150, 70, 10) + cloud('lf-day__cloud--far', 58, 7, 120, 80, 40) + cloud('lf-day__cloud--far', 84, 30, 110, 75, 25) + '</div>' +
      '<div class="lf-day__layer" data-d="0.8">' + cloud('', 30, 22, 220, 55, 5) + cloud('', 70, 16, 190, 60, 30) + cloud('', 4, 42, 170, 65, 50) + '</div>' +
      '<div class="lf-day__layer lf-day__layer--dunes" data-d="0.5"><svg class="lf-day__dune lf-day__dune--far" viewBox="0 0 1440 240" preserveAspectRatio="none" aria-hidden="true"><path d="M0 130 C 200 70 420 80 640 118 S 1060 160 1440 86 L1440 240 L0 240 Z"/></svg></div>' +
      '<div class="lf-day__layer lf-day__layer--dunes" data-d="1.2"><svg class="lf-day__dune lf-day__dune--near" viewBox="0 0 1440 240" preserveAspectRatio="none" aria-hidden="true"><path d="M0 170 C 280 112 520 160 780 148 S 1220 104 1440 156 L1440 240 L0 240 Z"/></svg></div>';
    bg.insertBefore(day, bg.firstChild);
    dayLayers = Array.prototype.slice.call(day.querySelectorAll('.lf-day__layer'));
  }

  // ---- Paralaks (fare + kaydırma) ----
  var mx = 0, my = 0, raf = 0;
  function apply() {
    raf = 0;
    if (reduce) return;
    var sy = window.scrollY || 0;
    if (far) far.style.transform = 'translate(' + (mx * -14) + 'px,' + (my * -14 - sy * 0.02) + 'px)';
    if (mid) mid.style.transform = 'translate(' + (mx * -38) + 'px,' + (my * -30 - sy * 0.06) + 'px)';
    dayLayers.forEach(function (l) {
      var d = parseFloat(l.getAttribute('data-d')) || 0.5;
      l.style.transform = 'translate(' + (mx * -22 * d) + 'px,' + (my * -12 * d - sy * 0.012 * d) + 'px)';
    });
  }
  function queue() { if (!raf) raf = requestAnimationFrame(apply); }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('mousemove', function (e) {
    mx = e.clientX / (window.innerWidth || 1) - 0.5; my = e.clientY / (window.innerHeight || 1) - 0.5; queue();
  });

  // ---- Kaydırınca beliren bölümler ----
  var revs = document.querySelectorAll('.lf-rev');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revs.forEach(function (el) { io.observe(el); });
  } else {
    revs.forEach(function (el) { el.classList.add('in'); });
  }

  // ---- Logo: en başa dön ----
  document.querySelectorAll('[data-top]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  });

  // ---- Form gönderildiyse iletişim bölümüne in ----
  var jump = document.querySelector('.lf-jump');
  if (jump) { jump.classList.add('in'); setTimeout(function () { jump.scrollIntoView({ block: 'start' }); }, 60); }

  // ---- Başlıklar: fare harflerin üstünden geçince harfler hafifçe zıplar ve renk değiştirir ----
  // Farsçada harfler birbirine bağlı olduğu için harf yerine bütün kelime hareket eder.
  var wordMode = rootEl.lang === 'fa';
  if (window.matchMedia && window.matchMedia('(hover: hover)').matches && !reduce) {
    document.querySelectorAll('.lf-h2, .lf-hero__title').forEach(function (h) {
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var word = document.createElement('span'); word.className = wordMode ? 'lf-word lf-wordfx' : 'lf-word'; word.setAttribute('aria-hidden', 'true');
              if (wordMode) word.textContent = part;
              else Array.from(part).forEach(function (ch) { var c = document.createElement('span'); c.className = 'lf-ch'; c.textContent = ch; word.appendChild(c); });
              frag.appendChild(word);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
        });
      };
      walk(h);
    });
  }

  // ---- Gece / gündüz modu ----
  var themeBtn = document.getElementById('lf-theme');
  function syncThemeBtn() {
    var day = rootEl.getAttribute('data-theme') === 'day', label = day ? (TT.toNight || 'Gece moduna geç') : (TT.toDay || 'Gündüz moduna geç');
    if (themeBtn) { themeBtn.setAttribute('aria-label', label); themeBtn.title = label; }
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = day ? '#FFF5EA' : '#0F0D17';
  }
  if (themeBtn) {
    syncThemeBtn();
    themeBtn.addEventListener('click', function () {
      var next = rootEl.getAttribute('data-theme') === 'day' ? 'night' : 'day';
      rootEl.classList.add('lf-theming');
      rootEl.setAttribute('data-theme', next);
      try { localStorage.setItem('lf-theme', next); } catch (e) { }
      syncThemeBtn();
      setTimeout(function () { rootEl.classList.remove('lf-theming'); }, 700);
    });
  }

  // ---- Çalışmalar: kategori filtresi ----
  var filterBtns = document.querySelectorAll('.lf-filter__btn');
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      filterBtns.forEach(function (x) { x.classList.toggle('is-on', x === b); });
      document.querySelectorAll('.lf-game[data-cat]').forEach(function (card) {
        card.hidden = !(f === '*' || card.getAttribute('data-cat') === f);
      });
      window.dispatchEvent(new Event('resize'));
    });
  });

  // ---- Dar ekranda kart şeritleri: yana kaydırma, noktalar ve kendiliğinden ilerleme ----
  (function () {
    var mq = window.matchMedia('(max-width: 900px)');
    var tracks = Array.prototype.slice.call(document.querySelectorAll('.lf-grid--services, .lf-grid--games, .lf-steps'));
    var AUTO_MS = 4500, IDLE_MS = 7000;
    tracks.forEach(function (track) {
      track.classList.add('lf-carousel');
      var dots = document.createElement('div');
      dots.className = 'lf-dots';
      track.parentNode.insertBefore(dots, track.nextSibling);
      var lastTouch = 0, inView = false;

      function cards() { return Array.prototype.slice.call(track.children).filter(function (c) { return !c.hidden; }); }
      function active() {
        var r = track.getBoundingClientRect(), mid = r.left + r.width / 2, best = 0, bestD = 1e9;
        cards().forEach(function (c, i) { var cr = c.getBoundingClientRect(), d = Math.abs(cr.left + cr.width / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
        return best;
      }
      function goTo(i) {
        var list = cards(); if (!list.length) return;
        var c = list[(i + list.length) % list.length], r = track.getBoundingClientRect(), cr = c.getBoundingClientRect();
        track.scrollBy({ left: (cr.left + cr.width / 2) - (r.left + r.width / 2), behavior: reduce ? 'auto' : 'smooth' });
      }
      function paint() {
        var n = cards().length, a = active();
        if (dots.children.length !== n) {
          dots.innerHTML = '';
          for (var i = 0; i < n; i++) {
            var b = document.createElement('button');
            b.type = 'button'; b.setAttribute('aria-label', (i + 1) + ' / ' + n);
            (function (k) { b.addEventListener('click', function () { lastTouch = Date.now(); goTo(k); }); })(i);
            dots.appendChild(b);
          }
        }
        Array.prototype.forEach.call(dots.children, function (b, i) { b.classList.toggle('is-on', i === a); });
      }
      var t = 0;
      track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(paint, 60); }, { passive: true });
      ['pointerdown', 'touchstart', 'wheel', 'mouseenter'].forEach(function (ev) {
        track.addEventListener(ev, function () { lastTouch = Date.now(); }, { passive: true });
      });
      window.addEventListener('resize', paint);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { inView = es[0].isIntersecting && es[0].intersectionRatio > 0.6; }, { threshold: [0, 0.6, 1] }).observe(track);
      }
      // Kullanıcı dokunmazsa birkaç saniyede bir sonraki karta geçer; dokunursa bir süre bekler.
      if (!reduce) setInterval(function () {
        if (!mq.matches || !inView || document.hidden || Date.now() - lastTouch < IDLE_MS) return;
        if (cards().length < 2) return;
        goTo(active() + 1);
      }, AUTO_MS);
      paint();
    });
  })();

  // ---- Yıl ----
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // ---- İletişim formu (sayfa yenilenmeden gönderir; JS yoksa normal form olarak çalışır) ----
  var form = document.getElementById('lf-form');
  if (!form || !window.fetch) return;
  var btn = document.getElementById('lf-send'), status = document.getElementById('lf-form-status');
  var label = btn ? btn.textContent : '';

  function say(text, ok) {
    status.innerHTML = '';
    if (!text) return;
    var span = document.createElement('span');
    span.className = ok ? 'lf-ok' : 'lf-bad';
    span.textContent = text;
    status.appendChild(span);
  }
  function clearErrors() {
    form.querySelectorAll('[data-err]').forEach(function (el) { el.textContent = ''; });
    form.querySelectorAll('.is-bad').forEach(function (el) { el.classList.remove('is-bad'); });
  }
  function showErrors(errors) {
    var first = null;
    Object.keys(errors || {}).forEach(function (k) {
      var el = form.querySelector('[data-err="' + k + '"]');
      if (el) el.textContent = errors[k];
      var input = form.querySelector('[name="Form.' + k + '"]');
      if (input && input.type !== 'radio' && input.type !== 'checkbox') { input.classList.add('is-bad'); if (!first) first = input; }
    });
    if (first) first.focus();
  }

  // GitHub Pages sürümü: sunucu yok. Form servisi adresi varsa oraya, yoksa e-posta uygulamasına.
  var ST = window.LF_STATIC;
  if (ST) {
    document.querySelectorAll('[data-lang]').forEach(function (a) {
      a.addEventListener('click', function () { try { localStorage.setItem('lf-lang', a.getAttribute('data-lang')); } catch (e) { } });
    });
  }
  function staticSend() {
    var get = function (n) { var el = form.querySelector('[name="Form.' + n + '"]'); return el ? el : null; };
    var name = get('Name'), email = get('Email'), msg = get('Message'), consent = get('Consent'), hp = get('Website');
    var bad = {}, E = ST.errors || {}, ev = email.value.trim(), mv = msg.value.trim();
    if (!name.value.trim()) bad.Name = E.name || ' ';
    if (!ev) bad.Email = E.email || ' ';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ev)) bad.Email = E.emailInvalid || ' ';
    if (!mv) bad.Message = E.message || ' ';
    else if (mv.length < 10 || mv.length > 3000) bad.Message = E.messageLength || ' ';
    if (consent && !consent.checked) bad.Consent = E.consent || ' ';
    if (Object.keys(bad).length) { showErrors(bad); say(TF.fix, false); return; }
    if (hp && hp.value) { form.reset(); say(TF.ok, true); return; }
    if (ST.formEndpoint) {
      btn.disabled = true; btn.textContent = TF.sending || '…';
      var fd = new FormData();
      fd.append('name', name.value.trim()); fd.append('email', email.value.trim());
      fd.append('message', msg.value.trim()); fd.append('_subject', 'Lazy Fennec · ' + name.value.trim()); fd.append('lang', ST.lang || '');
      fetch(ST.formEndpoint, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
        .then(function (res) { if (res.ok) { form.reset(); say(TF.ok, true); } else say(TF.fail, false); })
        .catch(function () { say(TF.network, false); })
        .then(function () { btn.disabled = false; btn.textContent = label; });
      return;
    }
    var body = msg.value.trim() + '\n\n— ' + name.value.trim() + ' <' + email.value.trim() + '>';
    location.href = 'mailto:' + (ST.email || '') + '?subject=' + encodeURIComponent('Lazy Fennec · ' + name.value.trim()) + '&body=' + encodeURIComponent(body);
    say(ST.mailOpened, true);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (ST) { clearErrors(); say(''); staticSend(); return; }
    clearErrors(); say('');
    btn.disabled = true; btn.textContent = TF.sending || '…';
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'X-Requested-With': 'fetch' } })
      .then(function (res) { return res.json().catch(function () { return { ok: false }; }); })
      .then(function (data) {
        if (data.ok) {
          form.reset();
          say(TF.ok, true);
        } else if (data.errors) {
          showErrors(data.errors);
          say(TF.fix, false);
        } else {
          say(data.message || TF.fail, false);
        }
      })
      .catch(function () { say(TF.network, false); })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  });
})();
