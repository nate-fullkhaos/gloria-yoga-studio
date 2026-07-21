(function () {
  'use strict';

  function initTabs(root, opts) {
    var btnSel = opts.btnSel;
    var targetAttr = opts.targetAttr;
    var buttons = Array.prototype.slice.call(root.querySelectorAll(btnSel));
    if (!buttons.length) return;

    function activate(btn) {
      var targetId = btn.getAttribute(targetAttr);
      if (!targetId) return;
      buttons.forEach(function (b) {
        var id = b.getAttribute(targetAttr);
        var panel = document.getElementById(id);
        var isActive = b === btn;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        b.setAttribute('tabindex', isActive ? '0' : '-1');
        if (panel) {
          panel.classList.toggle('is-active', isActive);
          if (isActive) {
            panel.removeAttribute('hidden');
          } else {
            panel.setAttribute('hidden', '');
          }
        }
      });
      if (opts.onChange) opts.onChange(btn, buttons.indexOf(btn));
    }

    buttons.forEach(function (btn, idx) {
      btn.addEventListener('click', function () {
        activate(btn);
      });
      btn.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
        e.preventDefault();
        var next;
        if (e.key === 'ArrowRight') next = buttons[(idx + 1) % buttons.length];
        else if (e.key === 'ArrowLeft') next = buttons[(idx - 1 + buttons.length) % buttons.length];
        else if (e.key === 'Home') next = buttons[0];
        else next = buttons[buttons.length - 1];
        activate(next);
        next.focus();
      });
    });

    var initial = buttons.filter(function (b) { return b.classList.contains('is-active'); })[0] || buttons[0];
    if (opts.onChange) opts.onChange(initial, buttons.indexOf(initial));
  }

  function moveSegmentThumb(control, activeBtn) {
    var thumb = control.querySelector('.studio-segments__thumb');
    if (!thumb || !activeBtn) return;
    var rect = activeBtn.getBoundingClientRect();
    var parentRect = control.getBoundingClientRect();
    thumb.style.width = rect.width + 'px';
    thumb.style.transform = 'translateX(' + (rect.left - parentRect.left) + 'px)';
  }

  function initPracticeCarousel(root) {
    var track = root.querySelector('.studio-chip-grid');
    var dotsEl = root.querySelector('.studio-practice-carousel__dots');
    if (!track || !dotsEl) return;

    var slides = Array.prototype.slice.call(track.querySelectorAll('.studio-chip'));
    if (!slides.length) return;

    var dots = slides.map(function (slide, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'studio-practice-carousel__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Go to practice highlight ' + (i + 1) + ' of ' + slides.length);
      dot.addEventListener('click', function () {
        slide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
      dotsEl.appendChild(dot);
      return dot;
    });

    function setActive(index) {
      slides.forEach(function (slide, i) {
        var isActive = i === index;
        slide.classList.toggle('is-active', isActive);
        dots[i].classList.toggle('is-active', isActive);
        dots[i].setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    setActive(0);

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
              setActive(slides.indexOf(entry.target));
            }
          });
        },
        { root: track, threshold: [0, 0.6, 1] }
      );
      slides.forEach(function (slide) {
        observer.observe(slide);
      });
    } else {
      track.addEventListener(
        'scroll',
        function () {
          var trackRect = track.getBoundingClientRect();
          var center = trackRect.left + trackRect.width / 2;
          var closest = 0;
          var closestDist = Infinity;
          slides.forEach(function (slide, i) {
            var rect = slide.getBoundingClientRect();
            var dist = Math.abs(rect.left + rect.width / 2 - center);
            if (dist < closestDist) {
              closestDist = dist;
              closest = i;
            }
          });
          setActive(closest);
        },
        { passive: true }
      );
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Practice tabs
    var tabRoots = document.querySelectorAll('[data-tabs]');
    tabRoots.forEach(function (root) {
      initTabs(root, {
        btnSel: '.studio-tabs__btn',
        targetAttr: 'data-tab-target'
      });
    });

    // Practice carousel (mobile)
    var carouselRoots = document.querySelectorAll('[data-practice-carousel]');
    carouselRoots.forEach(initPracticeCarousel);

    // Timetable segmented control
    var segRoots = document.querySelectorAll('[data-segments]');
    segRoots.forEach(function (root) {
      var control = root.querySelector('.studio-segments__control');
      initTabs(root, {
        btnSel: '.studio-segments__btn',
        targetAttr: 'data-seg-target',
        onChange: function (btn) {
          if (control) moveSegmentThumb(control, btn);
        }
      });
      if (control) {
        window.addEventListener('resize', function () {
          var active = control.querySelector('.studio-segments__btn.is-active');
          if (active) moveSegmentThumb(control, active);
        });
      }
    });
  });
})();
