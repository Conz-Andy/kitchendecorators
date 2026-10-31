// Click-to-enlarge lightbox for photos.
// Before/after pairs open with a Before | After switch so visitors can flip between the two.
(function () {
  var lastFocus = null;

  function closeLightbox() {
    var lb = document.getElementById('lightbox');
    if (lb) lb.remove();
    document.documentElement.classList.remove('lb-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // shots: [{src, alt, label}], start: index of the shot to show first, caption: optional text
  function openLightbox(shots, start, caption) {
    closeLightbox();
    lastFocus = document.activeElement;
    var isPair = shots.length === 2;
    var current = start || 0;

    var lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', caption || 'Kitchen photo');

    var html = '<button class="lb-close" type="button" aria-label="Close">&times;</button>' +
      '<figure class="lb-figure"><div class="lb-stage"><img alt=""><span class="lb-tag"></span></div>';
    if (isPair) {
      html += '<figcaption class="lb-bar">' +
        (caption ? '<span class="lb-caption"></span>' : '') +
        '<span class="lb-toggle" role="group" aria-label="Show before or after">' +
        '<button type="button" data-i="0"></button><button type="button" data-i="1"></button>' +
        '</span>' +
        '<span class="lb-hint"></span>' +
        '</figcaption>';
    }
    html += '</figure>';
    lb.innerHTML = html;

    var img = lb.querySelector('.lb-stage img');
    var tag = lb.querySelector('.lb-tag');
    var buttons = lb.querySelectorAll('.lb-toggle button');
    var hint = lb.querySelector('.lb-hint');
    if (caption && lb.querySelector('.lb-caption')) lb.querySelector('.lb-caption').textContent = caption;
    buttons.forEach(function (b, i) { b.textContent = shots[i].label; });

    function show(i) {
      current = i;
      var s = shots[i];
      img.classList.add('lb-fade');
      var swap = function () {
        img.src = s.src;
        img.alt = s.alt || 'Kitchen photo enlarged';
        img.classList.remove('lb-fade');
      };
      // Small crossfade when flipping; instant on first open
      if (img.getAttribute('src')) setTimeout(swap, 120); else swap();
      if (isPair) {
        tag.textContent = s.label;
        tag.className = 'lb-tag' + (i === 1 ? ' after' : '');
        buttons.forEach(function (b, j) {
          b.classList.toggle('active', j === i);
          b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
        });
        hint.textContent = 'Tap the photo or use the switch to see the ' + shots[1 - i].label.toLowerCase();
      } else {
        tag.remove();
      }
    }

    function flip() { if (isPair) show(1 - current); }

    lb.addEventListener('click', function (e) {
      var btn = e.target.closest('.lb-toggle button');
      if (btn) { show(+btn.dataset.i); return; }
      if (e.target.closest('.lb-close')) { closeLightbox(); return; }
      if (isPair && e.target.closest('.lb-stage')) { flip(); return; }
      if (!e.target.closest('.lb-bar')) closeLightbox(); // click on the dark backdrop closes
    });

    // Swipe left/right on phones to flip
    var touchX = null;
    lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (isPair && Math.abs(dx) > 40) { show(dx < 0 ? 1 : 0); }
    });

    function onKey(e) {
      if (!document.getElementById('lightbox')) { document.removeEventListener('keydown', onKey); return; }
      if (e.key === 'Escape') { closeLightbox(); document.removeEventListener('keydown', onKey); }
      else if (isPair && e.key === 'ArrowRight') show(1);
      else if (isPair && e.key === 'ArrowLeft') show(0);
      else if (isPair && (e.key === ' ' || e.key === 'Enter') && !e.target.closest('#lightbox button')) { e.preventDefault(); flip(); }
    }
    document.addEventListener('keydown', onKey);

    // Preload the other half of the pair so the flip is instant
    if (isPair) { var pre = new Image(); pre.src = shots[1 - current].src; }

    document.body.appendChild(lb);
    document.documentElement.classList.add('lb-open');
    show(current);
    var focusTarget = isPair ? buttons[1 - current] : lb.querySelector('.lb-close');
    if (focusTarget) focusTarget.focus();
  }

  function shotFrom(el, fallbackLabel) {
    var i = el.querySelector('img');
    if (!i) return null;
    var t = el.querySelector('.tag');
    return { src: i.dataset.full || i.currentSrc || i.src, alt: i.alt, label: t ? t.textContent.trim() : fallbackLabel };
  }

  // Make before/after photos keyboard-reachable and announce what a click does
  document.querySelectorAll('.ba-pair .ba-shot').forEach(function (el) {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    var t = el.querySelector('.tag');
    el.setAttribute('aria-label', 'Enlarge ' + (t ? t.textContent.trim().toLowerCase() : '') + ' photo and compare before and after');
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.ba-pair .ba-shot')) {
      e.preventDefault();
      e.target.click();
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('#lightbox')) return;
    var reelImg = e.target.closest('.reel img');
    if (reelImg) { openLightbox([{ src: reelImg.dataset.full || reelImg.src, alt: reelImg.alt }], 0); return; }
    var shot = e.target.closest('.ba-shot');
    if (shot) {
      var pair = shot.closest('.ba-pair');
      var els = pair ? pair.querySelectorAll('.ba-shot') : [];
      if (els.length === 2) {
        var shots = [shotFrom(els[0], 'Before'), shotFrom(els[1], 'After')];
        if (shots[0] && shots[1]) {
          var capEl = pair.parentElement && pair.parentElement.querySelector('.ba-caption');
          var cap = capEl ? capEl.textContent.replace(/\s+/g, ' ').trim() : '';
          openLightbox(shots, els[1] === shot ? 1 : 0, cap);
          return;
        }
      }
      var single = shotFrom(shot, '');
      if (single) { openLightbox([single], 0); return; }
    }
    var tile = e.target.closest('.gallery-grid .tile, .work-grid .tile');
    if (tile) {
      var bg = getComputedStyle(tile).backgroundImage;
      var m = bg.match(/url\(["']?(.*?)["']?\)/);
      if (m) openLightbox([{ src: m[1], alt: 'Kitchen photo enlarged' }], 0);
    }
  });
})();

// Forms: live on the real domain, preview-only on GitHub Pages
(function () {
  var isPreview = /github\.io$/.test(location.hostname) || location.protocol === 'file:';
  document.querySelectorAll('form[data-live-form]').forEach(function (form) {
    var note = form.querySelector('[data-preview-note]');
    if (isPreview) {
      if (note) note.hidden = false;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (note) { note.style.fontWeight = '600'; note.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      });
    }
  });
})();
