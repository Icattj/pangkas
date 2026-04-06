/**
 * Pangkas — Utility Functions (utils.js)
 * 
 * Format angka, tanggal, waktu dalam format Indonesia.
 * Helper untuk WhatsApp, debounce, deep clone, dan lainnya.
 */

(function () {
  'use strict';

  // ─── Nama-nama Indonesia ────────────────────────────────────

  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const BULAN_PENDEK = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  // ─── Format Uang ────────────────────────────────────────────

  /**
   * Format angka ke Rupiah. 35000 → "Rp 35.000"
   * @param {number} num
   * @returns {string}
   */
  function rp(num) {
    if (num === null || num === undefined || isNaN(num)) return 'Rp 0';
    const abs = Math.abs(Math.round(num));
    const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (num < 0 ? '-' : '') + 'Rp ' + formatted;
  }

  // ─── Format Tanggal ─────────────────────────────────────────

  /**
   * Format tanggal ke format Indonesia.
   * "6 April 2026" atau "Sen, 6 Apr 2026" (short)
   * @param {Date|string|number} date
   * @param {boolean} [short=false]
   * @returns {string}
   */
  function formatDate(date, short) {
    const d = _toDate(date);
    if (!d) return '-';

    if (short) {
      return HARI[d.getDay()].slice(0, 3) + ', ' +
        d.getDate() + ' ' +
        BULAN_PENDEK[d.getMonth()] + ' ' +
        d.getFullYear();
    }

    return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  }

  /**
   * Format waktu ke HH:MM.
   * @param {Date|string|number} date
   * @returns {string}
   */
  function formatTime(date) {
    const d = _toDate(date);
    if (!d) return '--:--';
    return _pad(d.getHours()) + ':' + _pad(d.getMinutes());
  }

  /**
   * Format lengkap: "Sen, 6 Apr 2026 · 14:30"
   * @param {Date|string|number} date
   * @returns {string}
   */
  function formatDateTime(date) {
    return formatDate(date, true) + ' · ' + formatTime(date);
  }

  // ─── ID Generator ───────────────────────────────────────────

  /**
   * Generate unique ID: "prefix-timestamp-random"
   * @param {string} [prefix='id']
   * @returns {string}
   */
  function generateId(prefix) {
    prefix = prefix || 'id';
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 7);
    return prefix + '-' + ts + '-' + rnd;
  }

  // ─── WhatsApp ───────────────────────────────────────────────

  /**
   * Buat WhatsApp URL. Otomatis konversi 08xx → 628xx.
   * @param {string} phone — nomor telepon (08xx, +62xx, 62xx)
   * @param {string} [message='']
   * @returns {string} wa.me URL
   */
  function waLink(phone, message) {
    if (!phone) return '#';
    // Bersihkan: hapus spasi, strip, kurung
    let clean = phone.replace(/[\s\-\(\)\+]/g, '');
    // 08xx → 628xx
    if (clean.startsWith('08')) {
      clean = '62' + clean.slice(1);
    }
    // Pastikan dimulai 62
    if (!clean.startsWith('62')) {
      clean = '62' + clean;
    }
    let url = 'https://wa.me/' + clean;
    if (message) {
      url += '?text=' + encodeURIComponent(message);
    }
    return url;
  }

  // ─── Debounce & Clone ───────────────────────────────────────

  /**
   * Debounce — tunda eksekusi fungsi sampai idle.
   * @param {Function} fn
   * @param {number} [delay=300] ms
   * @returns {Function}
   */
  function debounce(fn, delay) {
    delay = delay || 300;
    let timer = null;
    return function () {
      const ctx = this;
      const args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  /**
   * Deep clone object (structured clone fallback ke JSON).
   * @param {*} obj
   * @returns {*}
   */
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    try {
      return structuredClone(obj);
    } catch (_) {
      return JSON.parse(JSON.stringify(obj));
    }
  }

  // ─── Time Ago ───────────────────────────────────────────────

  /**
   * Hitung waktu relatif dalam bahasa Indonesia.
   * "baru saja", "5 menit lalu", "2 jam lalu", "3 hari lalu", etc.
   * @param {Date|string|number} date
   * @returns {string}
   */
  function getTimeAgo(date) {
    const d = _toDate(date);
    if (!d) return '-';

    const now = Date.now();
    const diff = now - d.getTime(); // ms

    if (diff < 0) return 'baru saja';

    const detik = Math.floor(diff / 1000);
    const menit = Math.floor(detik / 60);
    const jam = Math.floor(menit / 60);
    const hari = Math.floor(jam / 24);
    const minggu = Math.floor(hari / 7);
    const bulan = Math.floor(hari / 30);

    if (detik < 60) return 'baru saja';
    if (menit < 60) return menit + ' menit lalu';
    if (jam < 24) return jam + ' jam lalu';
    if (hari < 7) return hari + ' hari lalu';
    if (minggu < 4) return minggu + ' minggu lalu';
    if (bulan < 12) return bulan + ' bulan lalu';
    return Math.floor(hari / 365) + ' tahun lalu';
  }

  // ─── Day Names ──────────────────────────────────────────────

  /**
   * Nama hari Indonesia.
   * @param {Date|string|number} date
   * @returns {string} "Senin", "Selasa", etc.
   */
  function getDayName(date) {
    const d = _toDate(date);
    if (!d) return '-';
    return HARI[d.getDay()];
  }

  // ─── Date Checks ────────────────────────────────────────────

  /**
   * Apakah tanggal = hari ini?
   * @param {Date|string|number} date
   * @returns {boolean}
   */
  function isToday(date) {
    const d = _toDate(date);
    if (!d) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
  }

  /**
   * Apakah tanggal masuk minggu ini? (Senin–Minggu)
   * @param {Date|string|number} date
   * @returns {boolean}
   */
  function isThisWeek(date) {
    const d = _toDate(date);
    if (!d) return false;
    const now = new Date();
    // Awal minggu = Senin
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1; // Senin = 0
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return d >= startOfWeek && d < endOfWeek;
  }

  /**
   * Apakah tanggal masuk bulan ini?
   * @param {Date|string|number} date
   * @returns {boolean}
   */
  function isThisMonth(date) {
    const d = _toDate(date);
    if (!d) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth();
  }

  // ─── Internal Helpers ───────────────────────────────────────

  /**
   * Konversi input ke Date object.
   * @param {Date|string|number} v
   * @returns {Date|null}
   */
  function _toDate(v) {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Pad angka jadi 2 digit: 5 → "05"
   * @param {number} n
   * @returns {string}
   */
  function _pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  // ─── Public API ─────────────────────────────────────────────

  window.Utils = {
    rp,
    formatDate,
    formatTime,
    formatDateTime,
    generateId,
    waLink,
    debounce,
    deepClone,
    getTimeAgo,
    getDayName,
    isToday,
    isThisWeek,
    isThisMonth,
    // Expose constants
    HARI,
    BULAN,
    BULAN_PENDEK,
  };

  console.log('[Utils] Module loaded ✓');
})();
