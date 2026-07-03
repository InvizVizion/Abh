/* ═══════════════════════════════════════════════════════════
   Инал Принц Тауэр — main.js
   Прелоадер · плавный скролл · анимации · планировки ·
   галерея · лайтбокс · карта · форма WhatsApp
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── НАСТРОЙКА ─────────────────────────────────────────────
     Номер WhatsApp отдела продаж в международном формате,
     без «+» и пробелов. Пример: '79991234567'.
     Пока пусто — WhatsApp предложит выбрать контакт вручную. */
  var WHATSAPP_PHONE = '';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE_POINTER = window.matchMedia('(pointer: fine)').matches;
  var DESKTOP = window.matchMedia('(min-width: 1025px)').matches;
  var hasGsap = typeof gsap !== 'undefined';

  if (REDUCED) document.documentElement.classList.add('reduced');
  if (!hasGsap) document.documentElement.classList.add('no-motion');
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ── ПЛАВНЫЙ СКРОЛЛ (Lenis) ──────────────────────────────── */
  var lenis = null;
  if (!REDUCED && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
  }

  function scrollToTarget(hash) {
    var el = document.querySelector(hash);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -60, duration: 1.4 });
    else el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  }

  document.querySelectorAll('[data-scroll]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var hash = link.getAttribute('href');
      if (!hash || hash.charAt(0) !== '#') return;
      event.preventDefault();
      closeMenu();
      scrollToTarget(hash);
    });
  });

  /* ── ПРЕЛОАДЕР ───────────────────────────────────────────── */
  var preloader = document.getElementById('preloader');
  var preBar = document.getElementById('preBar');
  var preNum = document.getElementById('preNum');
  var progress = 0;
  var preloaderDone = false;
  var preTimer = setInterval(function () {
    progress = Math.min(progress + Math.random() * 24, 96);
    renderProgress(progress);
  }, 130);

  function renderProgress(value) {
    preBar.style.transform = 'translateX(' + (value - 100) + '%)';
    preNum.textContent = Math.round(value) + '%';
  }

  function finishPreloader() {
    if (preloaderDone) return;
    preloaderDone = true;
    clearInterval(preTimer);
    renderProgress(100);
    setTimeout(function () {
      preloader.classList.add('done');
      playHeroIntro();
    }, 320);
  }

  var heroImg = document.querySelector('.hero-media img.day');
  if (heroImg.complete) setTimeout(finishPreloader, 650);
  else {
    heroImg.addEventListener('load', finishPreloader);
    heroImg.addEventListener('error', finishPreloader);
  }
  setTimeout(finishPreloader, 4000); // страховка на медленной сети

  /* ── СПЛИТ ЗАГОЛОВКОВ ────────────────────────────────────── */
  function splitLines(el) {
    el.innerHTML = el.innerHTML.trim().replace(/(<em>[^<]*<\/em>|[^\s<]+)/g, function (chunk) {
      return '<span class="split-line"><span>' + chunk + '</span></span>';
    });
    el.querySelectorAll('.split-line').forEach(function (line) {
      line.style.marginRight = '0.24em';
    });
  }

  var heroTitle = document.getElementById('heroTitle');
  if (!REDUCED && hasGsap) {
    splitLines(heroTitle);
    gsap.set('#heroTitle .split-line > span', { yPercent: 112 });
    gsap.set('[data-hero-fade]', { opacity: 0, y: 28 });
  }

  function playHeroIntro() {
    if (REDUCED || !hasGsap) { startCounters(); return; }
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('#heroTitle .split-line > span', { yPercent: 0, duration: 1.25, stagger: 0.09 }, 0.12)
      .to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1.05, stagger: 0.1 }, 0.45)
      .add(startCounters, 0.75);
  }

  /* ── СЧЁТЧИКИ ────────────────────────────────────────────── */
  var countersStarted = false;
  function startCounters() {
    if (countersStarted) return;
    countersStarted = true;
    document.querySelectorAll('[data-counter]').forEach(function (el) {
      var target = parseInt(el.dataset.counter, 10);
      if (REDUCED || !hasGsap) { el.textContent = target; return; }
      var obj = { value: 0 };
      gsap.to(obj, {
        value: target, duration: 1.6, ease: 'power2.out',
        onUpdate: function () { el.textContent = Math.round(obj.value); }
      });
    });
  }
  if (REDUCED || !hasGsap) startCounters();

  /* ── ШАПКА / МЕНЮ / ПРОГРЕСС ─────────────────────────────── */
  var topbar = document.getElementById('topbar');
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  var scrollBar = document.getElementById('scrollBar');

  function onScroll() {
    var y = window.scrollY || 0;
    topbar.classList.toggle('scrolled', y > 30);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scrollBar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    mobileMenu.classList.remove('open');
    if (lenis) lenis.start();
  }

  burger.addEventListener('click', function () {
    var open = !mobileMenu.classList.contains('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mobileMenu.classList.toggle('open', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  /* ── КАСТОМНЫЙ КУРСОР ────────────────────────────────────── */
  if (FINE_POINTER && !REDUCED) {
    document.body.classList.add('has-cursor');
    var dot = document.getElementById('cursorDot');
    var ring = document.getElementById('cursorRing');
    var label = document.getElementById('cursorLabel');
    var mouse = { x: -100, y: -100 };
    var ringPos = { x: -100, y: -100 };

    window.addEventListener('mousemove', function (event) {
      mouse.x = event.clientX; mouse.y = event.clientY;
      dot.style.transform = 'translate(' + mouse.x + 'px,' + mouse.y + 'px) translate(-50%,-50%)';
    }, { passive: true });

    (function loop() {
      ringPos.x += (mouse.x - ringPos.x) * 0.16;
      ringPos.y += (mouse.y - ringPos.y) * 0.16;
      ring.style.transform = 'translate(' + ringPos.x + 'px,' + ringPos.y + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', function (event) {
      var el = event.target.closest('a, button, [data-cursor], [data-lightbox]');
      if (el) {
        ring.classList.add('hovered');
        label.textContent = el.dataset ? (el.dataset.cursor || '') : '';
      } else {
        ring.classList.remove('hovered');
        label.textContent = '';
      }
    });
  }

  /* ── ДЕНЬ / ВЕЧЕР В HERO ─────────────────────────────────── */
  var hero = document.getElementById('hero');
  document.querySelectorAll('.daynight button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.daynight button').forEach(function (other) { other.classList.remove('active'); });
      btn.classList.add('active');
      hero.classList.toggle('night-mode', btn.dataset.mode === 'night');
    });
  });

  /* ── СКРОЛЛ-АНИМАЦИИ ─────────────────────────────────────── */
  if (!REDUCED && hasGsap) {
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%' }
      });
    });

    document.querySelectorAll('[data-split]').forEach(function (el) {
      splitLines(el);
      gsap.from(el.querySelectorAll('.split-line > span'), {
        yPercent: 112, duration: 1.1, ease: 'power4.out', stagger: 0.05,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    gsap.to('[data-hero-parallax]', {
      yPercent: 14, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    document.querySelectorAll('[data-parallax-img]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -7, scale: 1.14 }, {
        yPercent: 7, scale: 1.14, ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // Горизонтальная галерея с пином — только desktop
    if (DESKTOP) {
      var track = document.getElementById('galleryTrack');
      var pin = document.getElementById('galleryPin');
      var bar = document.getElementById('galleryBar');
      var getDistance = function () { return Math.max(track.scrollWidth - window.innerWidth, 0); };
      gsap.to(track, {
        x: function () { return -getDistance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top 15%',
          end: function () { return '+=' + (getDistance() + 200); },
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            bar.style.width = (20 + self.progress * 80) + '%';
          }
        }
      });
    }
  } else {
    // Fallback без GSAP: показать блоки через IntersectionObserver
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.transition = 'opacity .8s ease, transform .8s ease';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  }

  /* ── ПЛАНИРОВКИ ──────────────────────────────────────────── */
  var planImage = document.getElementById('planImage');
  var planTitle = document.getElementById('planTitle');
  var floorButtons = document.querySelectorAll('.floor-btn');
  var buildingFloors = document.querySelectorAll('.pb-floor');

  function selectFloor(floor) {
    var btn = document.querySelector('.floor-btn[data-floor="' + floor + '"]');
    if (!btn || btn.classList.contains('active')) return;
    floorButtons.forEach(function (other) { other.classList.remove('active'); });
    btn.classList.add('active');
    buildingFloors.forEach(function (rect) {
      rect.classList.toggle('active', rect.dataset.floor === String(floor));
    });
    planImage.classList.add('switching');
    setTimeout(function () {
      planImage.src = btn.dataset.plan;
      planImage.alt = btn.dataset.name;
      planImage.dataset.title = btn.dataset.name;
      planTitle.textContent = btn.dataset.name;
      if (planImage.complete) planImage.classList.remove('switching');
      else planImage.onload = function () { planImage.classList.remove('switching'); };
    }, 280);
  }

  floorButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { selectFloor(btn.dataset.floor); });
  });
  buildingFloors.forEach(function (rect) {
    rect.addEventListener('click', function () { selectFloor(rect.dataset.floor); });
    if (rect.dataset.floor === '2') rect.classList.add('active');
  });

  // Подгружаем остальные планы в фоне после загрузки страницы
  window.addEventListener('load', function () {
    floorButtons.forEach(function (btn) {
      var img = new Image();
      img.src = btn.dataset.plan;
    });
  });

  /* ── ЛАЙТБОКС ────────────────────────────────────────────── */
  var lightbox = document.getElementById('lightbox');
  var lightboxImage = document.getElementById('lightboxImage');
  var lightboxTitle = document.getElementById('lightboxTitle');
  var lightboxItems = [];
  var lightboxIndex = 0;

  function collectLightboxItems() {
    lightboxItems = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  }

  function showLightbox(index) {
    collectLightboxItems();
    if (!lightboxItems.length) return;
    lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
    var img = lightboxItems[lightboxIndex];
    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt;
    lightboxTitle.textContent = img.dataset.title || img.alt || '';
    if (!lightbox.classList.contains('open')) {
      lightbox.classList.add('open');
      if (lenis) lenis.stop();
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    if (lenis) lenis.start();
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function (event) {
    var img = event.target.closest('[data-lightbox]');
    if (!img) return;
    collectLightboxItems();
    showLightbox(lightboxItems.indexOf(img));
  });

  document.getElementById('planZoom').addEventListener('click', function () {
    collectLightboxItems();
    showLightbox(lightboxItems.indexOf(planImage));
  });
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', function () { showLightbox(lightboxIndex - 1); });
  document.getElementById('lightboxNext').addEventListener('click', function () { showLightbox(lightboxIndex + 1); });
  lightbox.addEventListener('click', function (event) { if (event.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { closeLightbox(); closeMenu(); }
    if (!lightbox.classList.contains('open')) return;
    if (event.key === 'ArrowLeft') showLightbox(lightboxIndex - 1);
    if (event.key === 'ArrowRight') showLightbox(lightboxIndex + 1);
  });

  /* ── КАРТА (ленивая загрузка) ────────────────────────────── */
  var mapEmbed = document.getElementById('mapEmbed');
  var mapLoaded = false;
  function loadMap() {
    if (mapLoaded) return;
    mapLoaded = true;
    var iframe = document.createElement('iframe');
    iframe.src = mapEmbed.dataset.src;
    iframe.title = 'Карта: Гагра, улица Абазгаа, 49';
    iframe.loading = 'lazy';
    iframe.allowFullscreen = true;
    iframe.addEventListener('load', function () {
      var loadBtn = document.getElementById('mapLoad');
      if (loadBtn) loadBtn.remove();
    });
    mapEmbed.appendChild(iframe);
  }
  document.getElementById('mapLoad').addEventListener('click', loadMap);
  new IntersectionObserver(function (entries, observer) {
    if (entries[0].isIntersecting) { loadMap(); observer.disconnect(); }
  }, { rootMargin: '200px' }).observe(mapEmbed);

  /* ── WHATSAPP ────────────────────────────────────────────── */
  function waLink(text) {
    var base = WHATSAPP_PHONE ? 'https://wa.me/' + WHATSAPP_PHONE : 'https://wa.me/';
    return base + '?text=' + encodeURIComponent(text);
  }
  function openWa(text) {
    window.open(waLink(text), '_blank', 'noopener,noreferrer');
  }

  document.getElementById('waFloat').href =
    waLink('Здравствуйте! Интересует ЖК «Инал Принц Тауэр» в Гагре (ул. Абазгаа, 49).');

  document.querySelectorAll('.chip[data-quick]').forEach(function (chip) {
    chip.addEventListener('click', function () { openWa(chip.dataset.quick); });
  });

  document.getElementById('leadForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var data = new FormData(event.currentTarget);
    var text = [
      'Здравствуйте! Заявка с сайта ЖК «Инал Принц Тауэр».',
      data.get('name') ? 'Имя: ' + data.get('name') : '',
      data.get('phone') ? 'Контакт: ' + data.get('phone') : '',
      data.get('message') ? 'Запрос: ' + data.get('message') : ''
    ].filter(Boolean).join('\n');
    openWa(text);
  });
})();
