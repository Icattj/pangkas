// integration.js — Bridges the HTML screens with the JS routing system
// This runs AFTER all other scripts, before App.init()

(function() {
  'use strict';

  var loginScreen = document.getElementById('login-screen');
  var onboardingScreen = document.getElementById('onboarding-screen');
  var appShell = document.getElementById('app');
  var pageContainer = document.getElementById('page-container');

  // Hide all screens
  function hideAll() {
    if (loginScreen) loginScreen.style.display = 'none';
    if (onboardingScreen) onboardingScreen.style.display = 'none';
    if (appShell) appShell.style.display = 'none';
  }

  function showLogin() {
    hideAll();
    if (loginScreen) loginScreen.style.display = 'flex';
    // Render login into the login-screen container
    if (typeof renderLogin === 'function') {
      renderLogin(loginScreen);
    }
  }

  function showOnboarding() {
    hideAll();
    if (onboardingScreen) onboardingScreen.style.display = 'flex';
    if (typeof renderOnboarding === 'function') {
      renderOnboarding(onboardingScreen);
    }
  }

  function showApp(page) {
    hideAll();
    if (appShell) appShell.style.display = 'flex';
    // Render the requested page into page-container
    if (pageContainer && page) {
      var renderFn = {
        'home': typeof renderHome === 'function' ? renderHome : null,
        'kasir': typeof renderKasir === 'function' ? renderKasir : null,
        'antrian': typeof renderAntrian === 'function' ? renderAntrian : null,
        'member': typeof renderMember === 'function' ? renderMember : null,
        'janji': typeof renderJanji === 'function' ? renderJanji : null,
        'laporan': typeof renderLaporan === 'function' ? renderLaporan : null,
        'hutang': typeof renderHutang === 'function' ? renderHutang : null,
        'belanja': typeof renderBelanja === 'function' ? renderBelanja : null,
        'admin': typeof renderAdmin === 'function' ? renderAdmin : null,
      };
      if (renderFn[page]) {
        renderFn[page](pageContainer);
      }
    }
    // Update bottom nav highlight
    updateBottomNav(page);
  }

  function updateBottomNav(activePage) {
    var navItems = document.querySelectorAll('#bottom-nav .nav-item, .bottom-nav .nav-item');
    navItems.forEach(function(item) {
      var target = item.getAttribute('data-page') || item.getAttribute('onclick');
      item.classList.remove('active');
      if (target && target.indexOf(activePage) !== -1) {
        item.classList.add('active');
      }
    });
  }

  // ── Seed a default admin user if barbers is empty ──
  function ensureDefaultUser() {
    var barbers = DB.get('barbers') || [];
    if (barbers.length === 0) {
      // Also check old key 'users' for backward compat
      var users = DB.get('users') || [];
      if (users.length === 0) {
        barbers = [{
          id: 'admin-default',
          name: 'Admin',
          pin: '1234',
          role: 'admin'
        }];
        DB.set('barbers', barbers);
        DB.set('users', barbers); // backwards compat
      }
    }
  }

  // ── Main init ──
  function init() {
    ensureDefaultUser();

    var isFirstRun = DB.get('firstRun');
    var settings = DB.get('settings') || {};
    var hasShopName = settings.shop && settings.shop.name && settings.shop.name.trim() !== '';

    if (isFirstRun === true && !hasShopName) {
      // First run — onboarding
      showOnboarding();
    } else {
      // Check for existing session
      var savedUser = DB.get('currentUser');
      if (savedUser) {
        window.currentUser = savedUser;
        showApp('home');
      } else {
        showLogin();
      }
    }
  }

  // ── Expose globals ──
  window.PangkasApp = {
    showLogin: showLogin,
    showOnboarding: showOnboarding,
    showApp: showApp,
    navigate: function(page) {
      if (page === 'login') { showLogin(); return; }
      if (page === 'onboarding') { showOnboarding(); return; }
      showApp(page);
    },
    logout: function() {
      window.currentUser = null;
      DB.set('currentUser', null);
      showLogin();
    },
    init: init
  };

  // ── Wire up bottom nav clicks ──
  document.addEventListener('click', function(e) {
    var navItem = e.target.closest('[data-page]');
    if (navItem) {
      e.preventDefault();
      var page = navItem.getAttribute('data-page');
      if (page === 'lainnya') {
        // Show the "more" menu — render admin/settings list
        showApp('admin');
      } else {
        PangkasApp.navigate(page);
      }
    }
  });

  // ── Auto-init on DOM ready ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
