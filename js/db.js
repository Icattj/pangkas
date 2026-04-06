/**
 * Pangkas — Data Layer (db.js)
 * 
 * localStorage wrapper with prefixed keys, auto-backup,
 * export/import, and default seed data for an Indonesian barbershop.
 * 
 * Usage:
 *   DB.get('services')        → parsed value or null
 *   DB.set('services', [...]) → stores with 'pk_' prefix
 *   DB.def('services', [...]) → set only if key doesn't exist yet
 */

(function () {
  'use strict';

  const PREFIX = 'pk_';
  let _writeCount = 0;
  const BACKUP_EVERY = 10;

  // ─── Core CRUD ──────────────────────────────────────────────

  /**
   * Get a value from localStorage (auto JSON-parsed).
   * @param {string} key — logical key (prefix added automatically)
   * @returns {*} parsed value, or null if missing / corrupt
   */
  function get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? null : JSON.parse(raw);
    } catch (e) {
      console.warn('[DB] Gagal parse key:', key, e);
      return null;
    }
  }

  /**
   * Set a value in localStorage (auto JSON-stringified).
   * Triggers auto-backup every BACKUP_EVERY writes.
   * @param {string} key
   * @param {*} value
   */
  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      _writeCount++;
      if (_writeCount >= BACKUP_EVERY) {
        _autoBackup();
        _writeCount = 0;
      }
    } catch (e) {
      console.error('[DB] Gagal simpan key:', key, e);
      // Kemungkinan quota exceeded
      if (e.name === 'QuotaExceededError') {
        alert('Penyimpanan penuh! Hapus data lama atau ekspor backup.');
      }
    }
  }

  /**
   * Set default — only writes if the key does NOT already exist.
   * @param {string} key
   * @param {*} defaultValue
   */
  function def(key, defaultValue) {
    if (get(key) === null) {
      set(key, defaultValue);
    }
  }

  /**
   * Remove a key from storage.
   * @param {string} key
   */
  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  /**
   * Check if a key exists.
   * @param {string} key
   * @returns {boolean}
   */
  function has(key) {
    return localStorage.getItem(PREFIX + key) !== null;
  }

  // ─── Auto-backup ────────────────────────────────────────────

  /**
   * Snapshot semua data pk_* ke pk_backup_latest.
   * Dipanggil otomatis setiap BACKUP_EVERY writes.
   */
  function _autoBackup() {
    try {
      const snapshot = _collectAll();
      snapshot._backupTime = new Date().toISOString();
      snapshot._version = 1;
      localStorage.setItem(PREFIX + 'backup_latest', JSON.stringify(snapshot));
      console.log('[DB] Auto-backup selesai —', Object.keys(snapshot).length, 'keys');
    } catch (e) {
      console.warn('[DB] Auto-backup gagal:', e);
    }
  }

  /**
   * Kumpulkan semua data pk_* (kecuali backup itu sendiri).
   * @returns {Object}
   */
  function _collectAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (fullKey.startsWith(PREFIX) && fullKey !== PREFIX + 'backup_latest') {
        const logicalKey = fullKey.slice(PREFIX.length);
        try {
          data[logicalKey] = JSON.parse(localStorage.getItem(fullKey));
        } catch (_) {
          data[logicalKey] = localStorage.getItem(fullKey);
        }
      }
    }
    return data;
  }

  // ─── Export / Import ────────────────────────────────────────

  /**
   * Ekspor semua data sebagai JSON string (untuk download/share).
   * @returns {string} JSON
   */
  function exportData() {
    const snapshot = _collectAll();
    snapshot._exportTime = new Date().toISOString();
    snapshot._version = 1;
    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Download ekspor sebagai file .json.
   */
  function downloadExport() {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pangkas-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Impor data dari JSON string. Merge — keys yang ada akan ditimpa.
   * @param {string} jsonString
   * @returns {boolean} true jika berhasil
   */
  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      // Abaikan metadata keys
      const skipKeys = ['_exportTime', '_backupTime', '_version'];
      let count = 0;
      for (const [key, value] of Object.entries(data)) {
        if (!skipKeys.includes(key)) {
          localStorage.setItem(PREFIX + key, JSON.stringify(value));
          count++;
        }
      }
      console.log('[DB] Import berhasil —', count, 'keys');
      return true;
    } catch (e) {
      console.error('[DB] Import gagal:', e);
      return false;
    }
  }

  /**
   * Restore dari backup terakhir.
   * @returns {boolean}
   */
  function restoreBackup() {
    const raw = localStorage.getItem(PREFIX + 'backup_latest');
    if (!raw) {
      console.warn('[DB] Tidak ada backup untuk di-restore');
      return false;
    }
    return importData(raw);
  }

  /**
   * Hapus SEMUA data pk_* (termasuk backup). Hati-hati!
   */
  function clearAll() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(PREFIX)) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    console.log('[DB] Semua data dihapus —', keysToRemove.length, 'keys');
  }

  // ─── Seed Data ──────────────────────────────────────────────

  const DEFAULT_SERVICES = [
    { id: 'svc-001', name: 'Potong Rambut', price: 35000, category: 'potong', active: true, duration: 30 },
    { id: 'svc-002', name: 'Cukur Jenggot', price: 20000, category: 'cukur', active: true, duration: 15 },
    { id: 'svc-003', name: 'Cuci Rambut', price: 15000, category: 'cuci', active: true, duration: 10 },
    { id: 'svc-004', name: 'Potong + Cuci', price: 45000, category: 'potong', active: true, duration: 40 },
    { id: 'svc-005', name: 'Warna Rambut', price: 100000, category: 'warna', active: true, duration: 60 },
    { id: 'svc-006', name: 'Hair Tonic', price: 25000, category: 'treatment', active: true, duration: 15 },
    { id: 'svc-007', name: 'Creambath', price: 50000, category: 'treatment', active: true, duration: 30 },
  ];

  const DEFAULT_CATEGORIES = [
    { id: 'cat-potong', name: 'Potong', icon: '✂️' },
    { id: 'cat-cukur', name: 'Cukur', icon: '🪒' },
    { id: 'cat-cuci', name: 'Cuci', icon: '🧴' },
    { id: 'cat-warna', name: 'Warna', icon: '🎨' },
    { id: 'cat-treatment', name: 'Treatment', icon: '💆' },
  ];

  const DEFAULT_SETTINGS = {
    shop: {
      name: '',
      address: '',
      phone: '',
      logo: null,
      tagline: '',
    },
    commission: 40,           // persen komisi tukang cukur
    memberVisits: 10,         // kunjungan untuk jadi member
    memberReward: '1x Potong Gratis',
    sessionTimeout: 15,       // menit idle → auto logout
    queueEstimate: 20,        // estimasi menit per antrian
  };

  const DEFAULT_PRODUCTS = [
    { id: 'prod-001', name: 'Pomade Gatsby', price: 45000, stock: 10, category: 'styling', active: true },
    { id: 'prod-002', name: 'Shampo Makarizo', price: 25000, stock: 15, category: 'shampo', active: true },
    { id: 'prod-003', name: 'Hair Tonic NR', price: 30000, stock: 8, category: 'treatment', active: true },
    { id: 'prod-004', name: 'Wax Rambut', price: 50000, stock: 5, category: 'styling', active: true },
  ];

  /**
   * Seed default data — hanya tulis jika belum ada (def).
   * Dipanggil saat pertama kali buka app.
   */
  function seed() {
    def('services', DEFAULT_SERVICES);
    def('categories', DEFAULT_CATEGORIES);
    def('settings', DEFAULT_SETTINGS);
    def('products', DEFAULT_PRODUCTS);
    def('barbers', []);         // daftar tukang cukur
    def('members', []);         // daftar member
    def('transactions', []);    // riwayat transaksi
    def('queue', []);           // antrian aktif
    def('expenses', []);        // pengeluaran operasional
    def('firstRun', true);      // flag pertama kali
    console.log('[DB] Seed data siap');
  }

  // ─── Public API ─────────────────────────────────────────────

  window.DB = {
    get,
    set,
    def,
    remove,
    has,
    seed,
    exportData,
    downloadExport,
    importData,
    restoreBackup,
    clearAll,
    // Expose defaults for reference
    DEFAULTS: {
      services: DEFAULT_SERVICES,
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      products: DEFAULT_PRODUCTS,
    },
  };

  console.log('[DB] Module loaded ✓');
})();
