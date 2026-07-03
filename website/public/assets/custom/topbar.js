(function () {
  'use strict';

  var bar = document.getElementById('ttt-topbar');
  if (!bar) return;

  var lang = document.body.getAttribute('data-lang') || 'de';
  var pagePath = document.body.getAttribute('data-page-path') || '/';
  var toggle = document.getElementById('ttt-menu-toggle');
  var drawer = document.getElementById('ttt-mobile-drawer');
  var langSelect = document.getElementById('ttt-lang-select');

  function normalizePath(path) {
    if (!path || path === '/') return '/';
    if (path.indexOf('.') !== -1) return path;
    return path.endsWith('/') ? path : path + '/';
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('ttt-open');
    document.body.classList.remove('ttt-menu-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('ttt-open');
    document.body.classList.add('ttt-menu-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }

  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      if (drawer.classList.contains('ttt-open')) closeDrawer();
      else openDrawer();
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeDrawer();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  if (langSelect) {
    langSelect.value = lang;
    langSelect.addEventListener('change', function () {
      var targetLang = langSelect.value;
      try {
        localStorage.setItem('ttt-lang', targetLang);
      } catch (_) { }
      fetch('/assets/custom/nav.json')
        .then(function (r) {
          return r.json();
        })
        .then(function (nav) {
          var map = nav.pathMap || {};
          var key = normalizePath(pagePath);
          var entry = map[key];
          if (entry && entry[targetLang]) {
            window.location.href = entry[targetLang];
            return;
          }
          window.location.href = targetLang === 'en' ? '/en/' : '/de/';
        })
        .catch(function () {
          window.location.href = targetLang === 'en' ? '/en/' : '/de/';
        });
    });
  }
})();
