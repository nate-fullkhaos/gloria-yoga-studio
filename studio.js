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

  document.addEventListener('DOMContentLoaded', function () {
    // Practice tabs
    var tabRoots = document.querySelectorAll('[data-tabs]');
    tabRoots.forEach(function (root) {
      initTabs(root, {
        btnSel: '.studio-tabs__btn',
        targetAttr: 'data-tab-target'
      });
    });

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
