/* SalmanCart storefront interactions */
(function () {
  'use strict';

  /* flash toast auto-dismiss */
  var toast = document.getElementById('flash-toast');
  if (toast) {
    setTimeout(function () {
      toast.style.transition = 'opacity .4s, transform .4s';
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%,-12px)';
      setTimeout(function () { toast.remove(); }, 420);
    }, 3200);
  }

  /* carousels */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('.carousel-track');
    var prev = root.querySelector('.carousel-btn.prev');
    var next = root.querySelector('.carousel-btn.next');
    if (!track) return;
    var step = function () {
      var card = track.querySelector('.product-card');
      return card ? card.getBoundingClientRect().width + 16 : 240;
    };
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step() * 2, behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step() * 2, behavior: 'smooth' }); });
  });

  /* quantity steppers */
  document.querySelectorAll('.qty-stepper button[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement.querySelector('input');
      var val = parseInt(input.value, 10) || 1;
      var nextVal = val + parseInt(btn.dataset.step, 10);
      var max = parseInt(input.getAttribute('max'), 10);
      if (nextVal < 1) nextVal = 1;
      if (!isNaN(max) && nextVal > max) nextVal = max;
      input.value = nextVal;
    });
  });

  /* add-to-cart without full reload (progressive enhancement) */
  document.querySelectorAll('.add-cart-form').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      if (!window.fetch) return; // fall back to normal POST
      ev.preventDefault();
      var data = new FormData(form);
      fetch('/cart/add', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new URLSearchParams(data)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res.ok) {
          showMiniToast('Added to cart');
          var badge = document.querySelector('.cart-badge');
          if (badge) badge.textContent = res.cartCount;
          else {
            var link = document.querySelector('.cart-link');
            if (link) {
              var b = document.createElement('span');
              b.className = 'cart-badge';
              b.textContent = res.cartCount;
              link.appendChild(b);
            }
          }
        } else {
          showMiniToast(res.error || 'Could not add to cart', true);
        }
      }).catch(function () { form.submit(); });
    });
  });

  function showMiniToast(text, warn) {
    var t = document.createElement('div');
    t.className = 'toast ' + (warn ? 'toast-warn' : 'toast-ok');
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .4s';
      t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 420);
    }, 1800);
  }
})();
