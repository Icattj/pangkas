/**
 * Pangkas — UI Helpers (ui.js)
 * 
 * Modal, toast, confirm dialog, loading overlay, animations,
 * dan bottom navigation. Semua dalam bahasa Indonesia.
 * 
 * Depends on: app.js (optional, for navigate)
 */

(function () {
  'use strict';

  // ─── Modal ──────────────────────────────────────────────────

  /**
   * Tampilkan modal dialog.
   * @param {string|HTMLElement} content — HTML string atau element
   * @param {Object} [options]
   * @param {boolean} [options.closable=true] — bisa ditutup klik backdrop
   * @param {string} [options.size='medium'] — 'small' | 'medium' | 'large' | 'full'
   * @param {Function} [options.onClose] — callback saat ditutup
   */
  function showModal(content, options) {
    options = options || {};
    var closable = options.closable !== false;
    var size = options.size || 'medium';
    var onClose = options.onClose || null;

    // Hapus modal lama kalau ada
    closeModal();

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.className = 'pk-modal-backdrop';
    backdrop.id = 'pk-modal-backdrop';
    if (closable) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeModal();
      });
    }

    // Modal container
    var modal = document.createElement('div');
    modal.className = 'pk-modal pk-modal--' + size;
    modal.id = 'pk-modal';

    if (typeof content === 'string') {
      modal.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      modal.appendChild(content);
    }

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Store onClose callback
    backdrop._onClose = onClose;

    // Animate in
    requestAnimationFrame(function () {
      backdrop.classList.add('pk-modal-backdrop--visible');
      modal.classList.add('pk-modal--visible');
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Close on Escape
    backdrop._escHandler = function (e) {
      if (e.key === 'Escape' && closable) closeModal();
    };
    document.addEventListener('keydown', backdrop._escHandler);
  }

  /**
   * Tutup modal yang sedang terbuka.
   */
  function closeModal() {
    var backdrop = document.getElementById('pk-modal-backdrop');
    if (!backdrop) return;

    var modal = document.getElementById('pk-modal');

    // Animate out
    if (modal) modal.classList.remove('pk-modal--visible');
    backdrop.classList.remove('pk-modal-backdrop--visible');

    // Cleanup setelah animasi
    setTimeout(function () {
      if (backdrop._escHandler) {
        document.removeEventListener('keydown', backdrop._escHandler);
      }
      if (backdrop._onClose) {
        backdrop._onClose();
      }
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
      document.body.style.overflow = '';
    }, 300);
  }

  // ─── Toast ──────────────────────────────────────────────────

  var _toastContainer = null;

  /**
   * Pastikan toast container ada.
   */
  function _ensureToastContainer() {
    if (!_toastContainer || !_toastContainer.parentNode) {
      _toastContainer = document.createElement('div');
      _toastContainer.className = 'pk-toast-container';
      _toastContainer.id = 'pk-toast-container';
      document.body.appendChild(_toastContainer);
    }
    return _toastContainer;
  }

  /**
   * Tampilkan toast notification.
   * @param {string} message
   * @param {string} [type='info'] — 'success' | 'error' | 'info' | 'warning'
   * @param {number} [duration=3000] — ms sebelum auto-dismiss
   */
  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;

    var container = _ensureToastContainer();

    var icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️',
    };

    var toast = document.createElement('div');
    toast.className = 'pk-toast pk-toast--' + type;
    toast.innerHTML =
      '<span class="pk-toast__icon">' + (icons[type] || 'ℹ️') + '</span>' +
      '<span class="pk-toast__message">' + message + '</span>';

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(function () {
      toast.classList.add('pk-toast--visible');
    });

    // Auto dismiss
    setTimeout(function () {
      _dismissToast(toast);
    }, duration);

    // Tap to dismiss
    toast.addEventListener('click', function () {
      _dismissToast(toast);
    });
  }

  /**
   * Dismiss satu toast.
   */
  function _dismissToast(toast) {
    toast.classList.remove('pk-toast--visible');
    toast.classList.add('pk-toast--exit');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  // ─── Confirm Dialog ─────────────────────────────────────────

  /**
   * Promise-based confirmation dialog.
   * @param {string} message
   * @param {Object} [options]
   * @param {string} [options.confirmText='Ya']
   * @param {string} [options.cancelText='Batal']
   * @param {string} [options.type='warning'] — 'warning' | 'danger' | 'info'
   * @returns {Promise<boolean>}
   */
  function confirm(message, options) {
    options = options || {};
    var confirmText = options.confirmText || 'Ya';
    var cancelText = options.cancelText || 'Batal';
    var type = options.type || 'warning';

    return new Promise(function (resolve) {
      var icons = { warning: '⚠️', danger: '🗑️', info: 'ℹ️' };

      var html =
        '<div class="pk-confirm">' +
        '<div class="pk-confirm__icon">' + (icons[type] || '⚠️') + '</div>' +
        '<p class="pk-confirm__message">' + message + '</p>' +
        '<div class="pk-confirm__actions">' +
        '<button class="pk-btn pk-btn--ghost" id="pk-confirm-cancel">' + cancelText + '</button>' +
        '<button class="pk-btn pk-btn--' + (type === 'danger' ? 'danger' : 'primary') + '" id="pk-confirm-ok">' + confirmText + '</button>' +
        '</div>' +
        '</div>';

      showModal(html, {
        closable: false,
        size: 'small',
        onClose: function () {
          resolve(false);
        },
      });

      // Wire buttons setelah DOM ready
      setTimeout(function () {
        var btnOk = document.getElementById('pk-confirm-ok');
        var btnCancel = document.getElementById('pk-confirm-cancel');

        if (btnOk) {
          btnOk.addEventListener('click', function () {
            closeModal();
            resolve(true);
          });
        }
        if (btnCancel) {
          btnCancel.addEventListener('click', function () {
            closeModal();
            resolve(false);
          });
        }
      }, 50);
    });
  }

  // ─── Loading Overlay ────────────────────────────────────────

  /**
   * Tampilkan loading overlay.
   * @param {string} [message='Memuat...']
   */
  function showLoading(message) {
    message = message || 'Memuat...';
    hideLoading(); // hapus dulu kalau ada

    var overlay = document.createElement('div');
    overlay.className = 'pk-loading-overlay';
    overlay.id = 'pk-loading-overlay';
    overlay.innerHTML =
      '<div class="pk-loading-spinner">' +
      '<div class="pk-spinner"></div>' +
      '<p>' + message + '</p>' +
      '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(function () {
      overlay.classList.add('pk-loading-overlay--visible');
    });
  }

  /**
   * Sembunyikan loading overlay.
   */
  function hideLoading() {
    var overlay = document.getElementById('pk-loading-overlay');
    if (!overlay) return;
    overlay.classList.remove('pk-loading-overlay--visible');
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 200);
  }

  // ─── Animations ─────────────────────────────────────────────

  /**
   * Animate element masuk (fade + slide up).
   * @param {HTMLElement} el
   * @param {number} [delay=0] — ms delay sebelum animasi
   * @returns {Promise}
   */
  function animateIn(el, delay) {
    delay = delay || 0;
    return new Promise(function (resolve) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

      setTimeout(function () {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        setTimeout(resolve, 300);
      }, delay);
    });
  }

  /**
   * Animate element keluar (fade + slide down).
   * @param {HTMLElement} el
   * @returns {Promise}
   */
  function animateOut(el) {
    return new Promise(function (resolve) {
      el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      setTimeout(resolve, 200);
    });
  }

  /**
   * Stagger animate list of elements (satu per satu masuk).
   * @param {NodeList|Array} elements
   * @param {number} [stagger=50] — ms antar elemen
   */
  function animateList(elements, stagger) {
    stagger = stagger || 50;
    Array.from(elements).forEach(function (el, i) {
      animateIn(el, i * stagger);
    });
  }

  // ─── Bottom Navigation ──────────────────────────────────────

  var TABS = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'kasir', icon: '💰', label: 'Kasir' },
    { id: 'antrian', icon: '📋', label: 'Antrian' },
    { id: 'member', icon: '👥', label: 'Member' },
    { id: 'lainnya', icon: '☰', label: 'Lainnya' },
  ];

  /**
   * Render bottom navigation bar.
   * @param {string} activeTab — ID tab yang aktif
   */
  function renderBottomNav(activeTab) {
    var nav = document.getElementById('bottom-nav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'bottom-nav';
      nav.className = 'pk-bottom-nav';
      document.body.appendChild(nav);
    }

    var html = '';
    TABS.forEach(function (tab) {
      var isActive = tab.id === activeTab;
      html +=
        '<button class="pk-nav-tab' + (isActive ? ' pk-nav-tab--active' : '') + '"' +
        ' onclick="App.navigate(\'' + tab.id + '\')"' +
        ' aria-label="' + tab.label + '"' +
        ' role="tab"' +
        ' aria-selected="' + isActive + '">' +
        '<span class="pk-nav-tab__icon">' + tab.icon + '</span>' +
        '<span class="pk-nav-tab__label">' + tab.label + '</span>' +
        '</button>';
    });

    nav.innerHTML = html;

    // Sembunyikan nav di halaman login/onboarding
    var hidePages = ['login', 'onboarding'];
    nav.style.display = hidePages.indexOf(activeTab) >= 0 ? 'none' : 'flex';
  }

  // ─── Helper: Render Empty State ─────────────────────────────

  /**
   * Render empty state placeholder.
   * @param {string} icon — emoji
   * @param {string} title
   * @param {string} [subtitle]
   * @returns {string} HTML
   */
  function emptyState(icon, title, subtitle) {
    return '<div class="pk-empty">' +
      '<div class="pk-empty__icon">' + icon + '</div>' +
      '<h3 class="pk-empty__title">' + title + '</h3>' +
      (subtitle ? '<p class="pk-empty__subtitle">' + subtitle + '</p>' : '') +
      '</div>';
  }

  // ─── Helper: Create styled button HTML ──────────────────────

  /**
   * Generate button HTML string.
   * @param {string} label
   * @param {Object} [opts]
   * @param {string} [opts.type='primary'] — primary | ghost | danger | outline
   * @param {string} [opts.icon]
   * @param {string} [opts.onclick]
   * @param {string} [opts.id]
   * @param {boolean} [opts.disabled]
   * @param {boolean} [opts.block] — full width
   * @returns {string} HTML
   */
  function button(label, opts) {
    opts = opts || {};
    var type = opts.type || 'primary';
    var cls = 'pk-btn pk-btn--' + type;
    if (opts.block) cls += ' pk-btn--block';

    var attrs = '';
    if (opts.id) attrs += ' id="' + opts.id + '"';
    if (opts.onclick) attrs += ' onclick="' + opts.onclick + '"';
    if (opts.disabled) attrs += ' disabled';

    return '<button class="' + cls + '"' + attrs + '>' +
      (opts.icon ? '<span class="pk-btn__icon">' + opts.icon + '</span> ' : '') +
      label + '</button>';
  }

  // ─── Inject Base CSS ────────────────────────────────────────
  // Inject minimal CSS for UI components (modal, toast, loading, nav).
  // Full styling goes in css/style.css — this is just structural CSS
  // so components work even before the main stylesheet loads.

  function _injectCSS() {
    if (document.getElementById('pk-ui-css')) return;

    var css = document.createElement('style');
    css.id = 'pk-ui-css';
    css.textContent = [
      /* ── Variables ── */
      ':root {',
      '  --pk-primary: #0ABFBC;',
      '  --pk-primary-dark: #089C9A;',
      '  --pk-bg: #0a0a0f;',
      '  --pk-bg-card: #1a1a2e;',
      '  --pk-bg-surface: #16162a;',
      '  --pk-text: #f0f0f0;',
      '  --pk-text-dim: #888;',
      '  --pk-danger: #ff4757;',
      '  --pk-success: #2ed573;',
      '  --pk-warning: #ffa502;',
      '  --pk-radius: 12px;',
      '  --pk-nav-height: 64px;',
      '}',

      /* ── Modal ── */
      '.pk-modal-backdrop {',
      '  position:fixed;inset:0;z-index:1000;',
      '  background:rgba(0,0,0,0.6);',
      '  display:flex;align-items:flex-end;justify-content:center;',
      '  opacity:0;transition:opacity .3s ease;',
      '  -webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);',
      '}',
      '.pk-modal-backdrop--visible { opacity:1; }',
      '.pk-modal {',
      '  background:var(--pk-bg-card);color:var(--pk-text);',
      '  border-radius:20px 20px 0 0;padding:24px;',
      '  width:100%;max-height:85vh;overflow-y:auto;',
      '  transform:translateY(100%);transition:transform .3s ease;',
      '}',
      '.pk-modal--visible { transform:translateY(0); }',
      '.pk-modal--small { max-width:360px;border-radius:var(--pk-radius);margin:auto; }',
      '.pk-modal--medium { max-width:480px; }',
      '.pk-modal--large { max-width:640px; }',
      '.pk-modal--full { max-width:100%;max-height:100%;border-radius:0;height:100%; }',

      /* ── Toast ── */
      '.pk-toast-container {',
      '  position:fixed;top:16px;left:50%;transform:translateX(-50%);',
      '  z-index:2000;display:flex;flex-direction:column;gap:8px;',
      '  width:calc(100% - 32px);max-width:400px;pointer-events:none;',
      '}',
      '.pk-toast {',
      '  display:flex;align-items:center;gap:10px;',
      '  padding:14px 18px;border-radius:var(--pk-radius);',
      '  background:var(--pk-bg-card);color:var(--pk-text);',
      '  box-shadow:0 4px 20px rgba(0,0,0,0.4);',
      '  opacity:0;transform:translateY(-20px);',
      '  transition:all .3s ease;pointer-events:auto;cursor:pointer;',
      '  font-size:14px;',
      '}',
      '.pk-toast--visible { opacity:1;transform:translateY(0); }',
      '.pk-toast--exit { opacity:0;transform:translateY(-20px); }',
      '.pk-toast--success { border-left:3px solid var(--pk-success); }',
      '.pk-toast--error { border-left:3px solid var(--pk-danger); }',
      '.pk-toast--warning { border-left:3px solid var(--pk-warning); }',
      '.pk-toast--info { border-left:3px solid var(--pk-primary); }',
      '.pk-toast__icon { font-size:18px;flex-shrink:0; }',
      '.pk-toast__message { flex:1; }',

      /* ── Confirm ── */
      '.pk-confirm { text-align:center;padding:8px 0; }',
      '.pk-confirm__icon { font-size:48px;margin-bottom:16px; }',
      '.pk-confirm__message { color:var(--pk-text);font-size:16px;line-height:1.5;margin-bottom:24px; }',
      '.pk-confirm__actions { display:flex;gap:12px; }',
      '.pk-confirm__actions .pk-btn { flex:1; }',

      /* ── Loading ── */
      '.pk-loading-overlay {',
      '  position:fixed;inset:0;z-index:3000;',
      '  background:rgba(10,10,15,0.85);',
      '  display:flex;align-items:center;justify-content:center;',
      '  opacity:0;transition:opacity .2s ease;',
      '}',
      '.pk-loading-overlay--visible { opacity:1; }',
      '.pk-loading-spinner { text-align:center;color:var(--pk-text); }',
      '.pk-loading-spinner p { margin-top:16px;font-size:14px;color:var(--pk-text-dim); }',
      '.pk-spinner {',
      '  width:40px;height:40px;margin:0 auto;',
      '  border:3px solid rgba(255,255,255,0.1);',
      '  border-top-color:var(--pk-primary);',
      '  border-radius:50%;animation:pk-spin 0.8s linear infinite;',
      '}',
      '@keyframes pk-spin { to { transform:rotate(360deg); } }',

      /* ── Bottom Nav ── */
      '.pk-bottom-nav {',
      '  position:fixed;bottom:0;left:0;right:0;z-index:900;',
      '  height:var(--pk-nav-height);',
      '  background:var(--pk-bg-surface);',
      '  border-top:1px solid rgba(255,255,255,0.06);',
      '  display:flex;align-items:stretch;',
      '  padding-bottom:env(safe-area-inset-bottom, 0);',
      '}',
      '.pk-nav-tab {',
      '  flex:1;display:flex;flex-direction:column;',
      '  align-items:center;justify-content:center;gap:2px;',
      '  background:none;border:none;color:var(--pk-text-dim);',
      '  font-size:10px;cursor:pointer;transition:color .2s;',
      '  -webkit-tap-highlight-color:transparent;',
      '  padding:6px 0;',
      '}',
      '.pk-nav-tab__icon { font-size:22px;line-height:1; }',
      '.pk-nav-tab__label { font-weight:500; }',
      '.pk-nav-tab--active { color:var(--pk-primary); }',
      '.pk-nav-tab--active .pk-nav-tab__icon { transform:scale(1.15); }',

      /* ── Buttons ── */
      '.pk-btn {',
      '  display:inline-flex;align-items:center;justify-content:center;gap:8px;',
      '  padding:12px 24px;border-radius:var(--pk-radius);',
      '  font-size:14px;font-weight:600;cursor:pointer;',
      '  border:none;transition:all .2s;',
      '  -webkit-tap-highlight-color:transparent;',
      '}',
      '.pk-btn:active { transform:scale(0.96); }',
      '.pk-btn--block { width:100%; }',
      '.pk-btn--primary { background:var(--pk-primary);color:#000; }',
      '.pk-btn--primary:hover { background:var(--pk-primary-dark); }',
      '.pk-btn--danger { background:var(--pk-danger);color:#fff; }',
      '.pk-btn--ghost { background:transparent;color:var(--pk-text-dim);border:1px solid rgba(255,255,255,0.1); }',
      '.pk-btn--outline { background:transparent;color:var(--pk-primary);border:1px solid var(--pk-primary); }',
      '.pk-btn:disabled { opacity:0.4;cursor:not-allowed;transform:none; }',

      /* ── Empty State ── */
      '.pk-empty { text-align:center;padding:48px 24px; }',
      '.pk-empty__icon { font-size:56px;margin-bottom:16px; }',
      '.pk-empty__title { color:var(--pk-text);font-size:18px;margin-bottom:8px; }',
      '.pk-empty__subtitle { color:var(--pk-text-dim);font-size:14px; }',
    ].join('\n');

    document.head.appendChild(css);
  }

  // Inject CSS saat module load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _injectCSS);
  } else {
    _injectCSS();
  }

  // ─── Public API ─────────────────────────────────────────────

  window.UI = {
    showModal,
    closeModal,
    showToast,
    confirm,
    showLoading,
    hideLoading,
    animateIn,
    animateOut,
    animateList,
    renderBottomNav,
    emptyState,
    button,
    TABS,
  };

  console.log('[UI] Module loaded ✓');
})();
