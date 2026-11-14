(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('site-menu');
  var toTop = document.querySelector('.to-top');
  var desktop = window.matchMedia('(min-width: 760px)');

  /* ---------- Mobile menu ---------- */
  function setOpen(open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', function () {
    setOpen(!header.classList.contains('is-open'));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', function (e) {
    if (header.classList.contains('is-open') && !header.contains(e.target)) setOpen(false);
  });
  var onWide = function () { if (desktop.matches) setOpen(false); };
  if (desktop.addEventListener) desktop.addEventListener('change', onWide);
  else desktop.addListener(onWide);

  /* ---------- Scroll progress + back-to-top visibility ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var y = window.pageYOffset || doc.scrollTop || 0;
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      header.style.setProperty('--progress', p.toFixed(4));
      if (toTop) toTop.classList.toggle('is-visible', y > 600);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Highlight the nav link of the section in view ---------- */
  var links = Array.prototype.slice.call(menu.querySelectorAll('a[href^="#"]'));
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = map[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(map).concat('top').forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* ---------- Projects: looping marquee ---------- */
  var marquee = document.querySelector('.marquee');
  var track = marquee && marquee.querySelector('.project-track');
  var pauseBtn = document.querySelector('.marquee-toggle');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var SPEED = 50; // pixels per second
  var cloned = false;

  function updateSpeed() {
    var half = track.getBoundingClientRect().width / 2;
    if (half > 0) track.style.setProperty('--marquee-duration', Math.max(20, half / SPEED).toFixed(1) + 's');
  }

  function setPaused(paused) {
    marquee.classList.toggle('is-paused', paused);
    pauseBtn.querySelector('use').setAttribute('href', paused ? '#i-play' : '#i-pause');
    pauseBtn.querySelector('.marquee-toggle__label').textContent = paused ? 'Play' : 'Pause';
  }

  function startMarquee() {
    if (!cloned) {
      Array.prototype.slice.call(track.children).forEach(function (li) {
        var copy = li.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        copy.setAttribute('inert', '');
        copy.setAttribute('data-clone', '');
        Array.prototype.forEach.call(copy.querySelectorAll('a, button'), function (el) {
          el.setAttribute('tabindex', '-1');
        });
        track.appendChild(copy);
      });
      cloned = true;
    }
    marquee.scrollLeft = 0;
    marquee.removeAttribute('tabindex');
    marquee.classList.add('is-running');
    pauseBtn.hidden = false;
    setPaused(false);
    updateSpeed();
  }

  function stopMarquee() {
    marquee.classList.remove('is-running', 'is-paused', 'is-held');
    Array.prototype.forEach.call(track.querySelectorAll('[data-clone]'), function (el) { el.remove(); });
    cloned = false;
    marquee.setAttribute('tabindex', '0');
    pauseBtn.hidden = true;
  }

  if (marquee && track && pauseBtn) {
    var sync = function () { if (reduce.matches) stopMarquee(); else startMarquee(); };
    if (reduce.addEventListener) reduce.addEventListener('change', sync);
    else reduce.addListener(sync);
    sync();

    pauseBtn.addEventListener('click', function () {
      setPaused(!marquee.classList.contains('is-paused'));
    });

    // Holding a finger on the row pauses it; letting go resumes
    marquee.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') marquee.classList.add('is-held');
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
      marquee.addEventListener(type, function () { marquee.classList.remove('is-held'); });
    });

    // Recompute speed when card width changes (rotation, resize)
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { if (cloned) updateSpeed(); }).observe(marquee);
    } else {
      window.addEventListener('resize', function () { if (cloned) updateSpeed(); });
    }

    // Don't animate while the row is off screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        marquee.classList.toggle('is-offscreen', !entries[0].isIntersecting);
      }).observe(marquee);
    }
  }
})();
