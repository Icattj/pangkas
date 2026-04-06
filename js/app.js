/**
 * Pangkas — App Core & Router (app.js)
 * 
 * State management, hash-based routing, session timeout,
 * event bus, and app initialization.
 * 
 * Depends on: db.js, utils.js, ui.js
 */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────

  const state = {
    currentUser: null,       // { id, name, role, pin }
    currentPage: 'home',     // active route
    previousPage: null,      // for back navigation
    cart: [],                // [ { item, qty, type:'service'|'product' } ]
    queue: [],               // synced from DB
    isLoading: false,
    lastActivity: Date.now(),
    sessionTimer: null,
  };

  // ─── Event Bus ──────────────────────────────────────────────
  // Simple pub/sub for cross-component communication.

  const _listeners = {};

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  function on(event, callback) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(callback);
    return function () {
      off(event, callback);
    };
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event
   * @param {Function} callback
   */
  function off(event, callback) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(function (fn) {
      return fn !== callback;
    });
  }

  /**
   * Emit an event ke semua subscribers.
   * @param {string} event
   * @param {*} [data]
   */
  function emit(event, data) {
    if (!_listeners[event]) return;
    _listeners[event].forEach(function (fn) {
      try {
        fn(data);
      } catch (e) {
        console.error('[App] Event handler error:', event, e);
      }
    });
  }

  // ─── Router ─────────────────────────────────────────────────
  // Hash-based: #kasir, #antrian, #member, #laporan, #pengaturan, etc.

  const routes = {};

  /**
   * Register a page route.
   * @param {string} name — route name (tanpa #)
   * @param {Object} handler — { init(), teardown(), title }
   */
  function registerRoute(name, handler) {
    routes[name] = handler;
  }

  /**
   * Navigate ke halaman.
   * @param {string} page — route name (tanpa #)
   * @param {Object} [params] — optional params
   */
  function navigate(page, params) {
    // Teardown halaman sebelumnya
    if (state.currentPage && routes[state.currentPage] && routes[state.currentPage].teardown) {
      try {
        routes[state.currentPage].teardown();
      } catch (e) {
        console.warn('[Router] Teardown error:', state.currentPage, e);
      }
    }

    state.previousPage = state.currentPage;
    state.currentPage = page;

    // Update hash (tanpa trigger hashchange lagi)
    const newHash = '#' + page;
    if (window.location.hash !== newHash) {
      history.pushState(null, '', newHash);
    }

    // Init halaman baru
    if (routes[page]) {
      try {
        if (routes[page].title) {
          document.title = routes[page].title + ' — Pangkas';
        }
        routes[page].init(params);
      } catch (e) {
        console.error('[Router] Init error:', page, e);
      }
    } else {
      console.warn('[Router] Route tidak ditemukan:', page);
      _renderNotFound(page);
    }

    // Update bottom nav
    if (window.UI && UI.renderBottomNav) {
      UI.renderBottomNav(page);
    }

    emit('navigate', { page: page, params: params, previous: state.previousPage });
    _touchActivity();
  }

  /**
   * Go back ke halaman sebelumnya.
   */
  function goBack() {
    if (state.previousPage) {
      navigate(state.previousPage);
    } else {
      navigate('home');
    }
  }

  /**
   * Handle hashchange event.
   */
  function _onHashChange() {
    const hash = window.location.hash.slice(1) || 'home';
    // Jangan navigate kalau sudah di halaman yang sama
    if (hash !== state.currentPage) {
      navigate(hash);
    }
  }

  /**
   * Render 404 page.
   */
  function _renderNotFound(page) {
    var content = document.getElementById('app-content');
    if (content) {
      content.innerHTML =
        '<div style="text-align:center;padding:60px 20px;">' +
        '<div style="font-size:64px;margin-bottom:16px;">🤷</div>' +
        '<h2 style="color:#fff;margin-bottom:8px;">Halaman Tidak Ditemukan</h2>' +
        '<p style="color:#888;">Route "' + page + '" tidak ada.</p>' +
        '<button onclick="App.navigate(\'home\')" style="margin-top:20px;padding:12px 24px;' +
        'background:#0ABFBC;color:#000;border:none;border-radius:8px;font-weight:600;cursor:pointer;">' +
        'Kembali ke Home</button></div>';
    }
  }

  // ─── Session Timeout ────────────────────────────────────────

  /**
   * Reset activity timestamp.
   */
  function _touchActivity() {
    state.lastActivity = Date.now();
  }

  /**
   * Mulai session timer — cek idle setiap menit.
   */
  function _startSessionTimer() {
    // Bersihkan timer lama
    if (state.sessionTimer) clearInterval(state.sessionTimer);

    state.sessionTimer = setInterval(function () {
      if (!state.currentUser) return; // belum login

      var settings = DB.get('settings') || {};
      var timeoutMs = (settings.sessionTimeout || 15) * 60 * 1000;
      var idle = Date.now() - state.lastActivity;

      if (idle >= timeoutMs) {
        console.log('[App] Session timeout — auto logout');
        logout();
        if (window.UI) {
          UI.showToast('Sesi berakhir — silakan login kembali', 'info');
        }
      }
    }, 60 * 1000); // cek setiap menit
  }

  /**
   * Track user activity (touch, click, key).
   */
  function _setupActivityTracking() {
    var events = ['touchstart', 'click', 'keydown', 'scroll'];
    events.forEach(function (evt) {
      document.addEventListener(evt, _touchActivity, { passive: true });
    });
  }

  // ─── Auth ───────────────────────────────────────────────────

  /**
   * Login user.
   * @param {Object} user — { id, name, role, pin }
   */
  function login(user) {
    state.currentUser = user;
    state.lastActivity = Date.now();
    DB.set('currentSession', {
      userId: user.id,
      loginTime: new Date().toISOString(),
    });
    emit('login', user);
    console.log('[App] Login:', user.name, '(' + user.role + ')');
  }

  /**
   * Logout user.
   */
  function logout() {
    var user = state.currentUser;
    state.currentUser = null;
    state.cart = [];
    DB.remove('currentSession');
    emit('logout', user);
    navigate('login');
    console.log('[App] Logout');
  }

  /**
   * Cek apakah user sudah login.
   * @returns {boolean}
   */
  function isLoggedIn() {
    return state.currentUser !== null;
  }

  // ─── Cart ───────────────────────────────────────────────────

  /**
   * Tambah item ke cart.
   * @param {Object} item — service atau product
   * @param {string} type — 'service' | 'product'
   */
  function addToCart(item, type) {
    type = type || 'service';
    // Cek apakah sudah ada di cart
    var existing = state.cart.find(function (c) {
      return c.item.id === item.id && c.type === type;
    });
    if (existing) {
      existing.qty++;
    } else {
      state.cart.push({ item: item, qty: 1, type: type });
    }
    emit('cartUpdate', state.cart);
  }

  /**
   * Hapus item dari cart.
   * @param {string} itemId
   */
  function removeFromCart(itemId) {
    state.cart = state.cart.filter(function (c) {
      return c.item.id !== itemId;
    });
    emit('cartUpdate', state.cart);
  }

  /**
   * Kosongkan cart.
   */
  function clearCart() {
    state.cart = [];
    emit('cartUpdate', state.cart);
  }

  /**
   * Total harga cart.
   * @returns {number}
   */
  function getCartTotal() {
    return state.cart.reduce(function (sum, c) {
      return sum + (c.item.price * c.qty);
    }, 0);
  }

  // ─── Initialization ─────────────────────────────────────────

  /**
   * Inisialisasi app.
   * Seed data → cek first run → route ke onboarding atau login.
   */
  function init() {
    console.log('[App] Initializing Pangkas...');

    // 1. Seed default data
    DB.seed();

    // 2. Setup activity tracking & session timer
    _setupActivityTracking();
    _startSessionTimer();

    // 3. Listen hash changes
    window.addEventListener('hashchange', _onHashChange);

    // 4. Handle browser back/forward
    window.addEventListener('popstate', function () {
      var hash = window.location.hash.slice(1) || 'home';
      if (hash !== state.currentPage) {
        navigate(hash);
      }
    });

    // 5. Cek first run
    var isFirstRun = DB.get('firstRun');
    var settings = DB.get('settings') || {};

    if (isFirstRun && !settings.shop.name) {
      // Pertama kali — tampilkan onboarding
      console.log('[App] First run — onboarding');
      navigate('onboarding');
    } else {
      // Sudah pernah setup — cek session
      var session = DB.get('currentSession');
      if (session) {
        // Restore session — cari user
        var barbers = DB.get('barbers') || [];
        var user = barbers.find(function (b) { return b.id === session.userId; });
        if (user) {
          state.currentUser = user;
          emit('login', user);
        }
      }

      // Route ke hash saat ini, atau home
      var hash = window.location.hash.slice(1);
      if (hash && routes[hash]) {
        navigate(hash);
      } else {
        navigate(state.currentUser ? 'home' : 'login');
      }
    }

    // 6. Sync queue dari DB
    state.queue = DB.get('queue') || [];

    // 7. Register service worker
    _registerSW();

    emit('appReady');
    console.log('[App] Ready ✓');
  }

  /**
   * Register service worker untuk PWA.
   */
  function _registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(function (reg) {
        console.log('[App] Service worker registered:', reg.scope);
      }).catch(function (e) {
        console.warn('[App] Service worker gagal:', e);
      });
    }
  }

  // ─── Public API ─────────────────────────────────────────────

  window.App = {
    // State (read-only access)
    get state() { return state; },

    // Router
    navigate,
    goBack,
    registerRoute,

    // Auth
    login,
    logout,
    isLoggedIn,

    // Cart
    addToCart,
    removeFromCart,
    clearCart,
    getCartTotal,

    // Event bus
    on,
    off,
    emit,

    // Lifecycle
    init,
  };

  console.log('[App] Module loaded ✓');
})();
