// Click-to-enlarge lightbox for photos
(function () {
  function openLightbox(src) {
    var lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.innerHTML = '<button class="lb-close" aria-label="Close">×</button><img src="' + src + '" alt="Kitchen photo enlarged">';
    lb.addEventListener('click', function () { lb.remove(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(lb);
  }
  document.addEventListener('click', function (e) {
    var img = e.target.closest('.ba-shot');
    if (img) {
      var i = img.querySelector('img');
      if (i) { openLightbox(i.src); return; }
    }
    var tile = e.target.closest('.gallery-grid .tile, .work-grid .tile');
    if (tile) {
      var bg = getComputedStyle(tile).backgroundImage;
      var m = bg.match(/url\(["']?(.*?)["']?\)/);
      if (m) openLightbox(m[1]);
    }
  });
})();
