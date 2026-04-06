// ============================================
// admin.js — Admin / Settings Page (Lainnya)
// Pangkas Barbershop POS
// ============================================

function renderAdmin(container) {
  const isAdmin = currentUser && currentUser.role === 'admin';

  if (!isAdmin) {
    renderAdminLimited(container);
    return;
  }

  container.innerHTML = `
    <div class="page-header">
      <h2>⚙️ Pengaturan</h2>
      <p style="color:var(--text-secondary);margin-top:4px;">Kelola toko, staff, layanan & data</p>
    </div>
    <div id="admin-content" class="admin-sections"></div>
  `;

  const content = container.querySelector('#admin-content');
  renderAdminMenu(content);
}

// ── Limited view for non-admin (barber) ──
function renderAdminLimited(container) {
  const settings = DB.get('settings') || {};
  const shop = settings.shop || {};

  container.innerHTML = `
    <div class="page-header">
      <h2>⚙️ Pengaturan</h2>
    </div>
    <div class="admin-sections">
      <div class="card" style="margin-bottom:16px;">
        <div class="card-header">
          <span>🏪 Info Toko</span>
        </div>
        <div class="card-body">
          <div class="info-row"><span class="info-label">Nama Toko</span><span>${shop.name || '-'}</span></div>
          <div class="info-row"><span class="info-label">Alamat</span><span>${shop.address || '-'}</span></div>
          <div class="info-row"><span class="info-label">Telepon</span><span>${shop.phone || '-'}</span></div>
          <div class="info-row"><span class="info-label">Tagline</span><span>${shop.tagline || '-'}</span></div>
        </div>
      </div>
      ${renderTentangCard()}
    </div>
  `;
}

// ── Main admin menu ──
function renderAdminMenu(content) {
  const menuItems = [
    { icon: '🏪', label: 'Info Toko', desc: 'Nama, alamat, telepon toko', action: 'info-toko' },
    { icon: '👥', label: 'Manajemen Staff & PIN', desc: 'Kelola barber dan PIN akses', action: 'staff' },
    { icon: '✂️', label: 'Layanan & Harga', desc: 'Jenis layanan dan tarif', action: 'services' },
    { icon: '🧴', label: 'Produk Add-on', desc: 'Pomade, serum, dan produk lainnya', action: 'addons' },
    { icon: '⚡', label: 'Pengaturan Umum', desc: 'Komisi, target, estimasi waktu', action: 'general' },
    { icon: '💾', label: 'Data & Backup', desc: 'Export, import, reset data', action: 'backup' },
    { icon: '💈', label: 'Tentang Pangkas', desc: 'Versi dan informasi aplikasi', action: 'about' },
  ];

  content.innerHTML = menuItems.map(item => `
    <div class="card admin-menu-item" data-action="${item.action}" onclick="adminNavigate('${item.action}')" style="margin-bottom:12px;cursor:pointer;">
      <div style="display:flex;align-items:center;padding:16px;gap:14px;">
        <span style="font-size:1.6rem;">${item.icon}</span>
        <div style="flex:1;">
          <div style="font-weight:600;">${item.label}</div>
          <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:2px;">${item.desc}</div>
        </div>
        <span style="color:var(--text-secondary);font-size:1.2rem;">›</span>
      </div>
    </div>
  `).join('');
}

// ── Navigation ──
function adminNavigate(section) {
  const content = document.querySelector('#admin-content');
  if (!content) return;

  const backBtn = `<button class="btn btn-sm" onclick="adminBack()" style="margin-bottom:16px;">← Kembali</button>`;

  switch (section) {
    case 'info-toko': renderInfoToko(content, backBtn); break;
    case 'staff': renderStaffSection(content, backBtn); break;
    case 'services': renderServicesSection(content, backBtn); break;
    case 'addons': renderAddonsSection(content, backBtn); break;
    case 'general': renderGeneralSettings(content, backBtn); break;
    case 'backup': renderBackupSection(content, backBtn); break;
    case 'about': renderAboutSection(content, backBtn); break;
    default: renderAdminMenu(content);
  }
}

function adminBack() {
  const content = document.querySelector('#admin-content');
  if (content) renderAdminMenu(content);
}


// ============================================
// 1. INFO TOKO
// ============================================
function renderInfoToko(content, backBtn) {
  const settings = DB.get('settings') || {};
  const shop = settings.shop || {};

  content.innerHTML = `
    ${backBtn}
    <div class="card">
      <div class="card-header"><span>🏪 Info Toko</span></div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Nama Toko</label>
          <input type="text" id="shop-name" class="form-input" value="${escHtml(shop.name || '')}" placeholder="Contoh: Pangkas Jaya">
        </div>
        <div class="form-group">
          <label class="form-label">Alamat</label>
          <input type="text" id="shop-address" class="form-input" value="${escHtml(shop.address || '')}" placeholder="Alamat lengkap toko">
        </div>
        <div class="form-group">
          <label class="form-label">Telepon</label>
          <input type="text" id="shop-phone" class="form-input" value="${escHtml(shop.phone || '')}" placeholder="08xxxxxxxxxx">
        </div>
        <div class="form-group">
          <label class="form-label">Tagline</label>
          <input type="text" id="shop-tagline" class="form-input" value="${escHtml(shop.tagline || '')}" placeholder="Contoh: Potong rapi, harga pasti!">
        </div>
        <button class="btn btn-primary btn-block" onclick="saveInfoToko()">💾 Simpan</button>
      </div>
    </div>
  `;
}

function saveInfoToko() {
  const name = document.getElementById('shop-name').value.trim();
  const address = document.getElementById('shop-address').value.trim();
  const phone = document.getElementById('shop-phone').value.trim();
  const tagline = document.getElementById('shop-tagline').value.trim();

  if (!name) {
    UI.toast('Nama toko wajib diisi', 'error');
    return;
  }

  const settings = DB.get('settings') || {};
  settings.shop = { name, address, phone, tagline };
  DB.set('settings', settings);
  UI.toast('Info toko berhasil disimpan ✅', 'success');
}


// ============================================
// 2. MANAJEMEN STAFF & PIN
// ============================================
function renderStaffSection(content, backBtn) {
  const users = DB.get('users') || [];

  content.innerHTML = `
    ${backBtn}
    <div class="card">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
        <span>👥 Manajemen Staff & PIN</span>
        <button class="btn btn-sm btn-primary" onclick="showAddStaffModal()">+ Tambah</button>
      </div>
      <div class="card-body" style="padding:0;">
        ${users.length === 0 ? '<p style="padding:16px;color:var(--text-secondary);text-align:center;">Belum ada staff</p>' :
          users.map(u => `
            <div class="list-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border);">
              <div>
                <div style="font-weight:600;">${escHtml(u.name)}</div>
                <div style="font-size:0.8rem;margin-top:2px;">
                  <span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">${u.role === 'admin' ? '👑 Admin' : '✂️ Barber'}</span>
                  <span style="color:var(--text-secondary);margin-left:8px;">PIN: ${u.pin}</span>
                </div>
              </div>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-sm" onclick="showEditPinModal('${u.id}')">🔑</button>
                <button class="btn btn-sm btn-danger" onclick="deleteStaff('${u.id}')">🗑️</button>
              </div>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
}

function showAddStaffModal() {
  UI.showModal(`
    <div class="modal-header"><h3>➕ Tambah Staff</h3></div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Nama</label>
        <input type="text" id="staff-name" class="form-input" placeholder="Nama barber">
      </div>
      <div class="form-group">
        <label class="form-label">PIN (4 digit)</label>
        <input type="text" id="staff-pin" class="form-input" maxlength="4" placeholder="Contoh: 1234" inputmode="numeric">
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <select id="staff-role" class="form-input">
          <option value="barber">Barber</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="UI.closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="addStaff()">Simpan</button>
    </div>
  `);
}

function addStaff() {
  const name = document.getElementById('staff-name').value.trim();
  const pin = document.getElementById('staff-pin').value.trim();
  const role = document.getElementById('staff-role').value;

  if (!name) { UI.toast('Nama wajib diisi', 'error'); return; }
  if (!/^\d{4}$/.test(pin)) { UI.toast('PIN harus 4 digit angka', 'error'); return; }

  const users = DB.get('users') || [];

  // Check duplicate PIN
  if (users.some(u => u.pin === pin)) {
    UI.toast('PIN sudah dipakai staff lain', 'error');
    return;
  }

  users.push({ id: generateId('USR'), name, pin, role });
  DB.set('users', users);
  UI.closeModal();
  UI.toast('Staff berhasil ditambahkan ✅', 'success');
  adminNavigate('staff');
}

function showEditPinModal(userId) {
  const users = DB.get('users') || [];
  const user = users.find(u => u.id === userId);
  if (!user) return;

  UI.showModal(`
    <div class="modal-header"><h3>🔑 Edit PIN — ${escHtml(user.name)}</h3></div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">PIN Baru (4 digit)</label>
        <input type="text" id="edit-pin" class="form-input" maxlength="4" value="${user.pin}" inputmode="numeric">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="UI.closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="saveEditPin('${userId}')">Simpan</button>
    </div>
  `);
}

function saveEditPin(userId) {
  const pin = document.getElementById('edit-pin').value.trim();
  if (!/^\d{4}$/.test(pin)) { UI.toast('PIN harus 4 digit angka', 'error'); return; }

  const users = DB.get('users') || [];

  // Check duplicate PIN (exclude self)
  if (users.some(u => u.id !== userId && u.pin === pin)) {
    UI.toast('PIN sudah dipakai staff lain', 'error');
    return;
  }

  const user = users.find(u => u.id === userId);
  if (user) {
    user.pin = pin;
    DB.set('users', users);
    UI.closeModal();
    UI.toast('PIN berhasil diubah ✅', 'success');
    adminNavigate('staff');
  }
}

function deleteStaff(userId) {
  const users = DB.get('users') || [];
  const user = users.find(u => u.id === userId);
  if (!user) return;

  // Can't delete self
  if (currentUser && currentUser.id === userId) {
    UI.toast('Tidak bisa menghapus akun sendiri', 'error');
    return;
  }

  // Can't delete last admin
  if (user.role === 'admin') {
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      UI.toast('Tidak bisa menghapus admin terakhir', 'error');
      return;
    }
  }

  UI.confirm(`Hapus staff "${user.name}"?`).then(yes => {
    if (!yes) return;
    const updated = users.filter(u => u.id !== userId);
    DB.set('users', updated);
    UI.toast('Staff berhasil dihapus', 'success');
    adminNavigate('staff');
  });
}


// ============================================
// 3. LAYANAN & HARGA
// ============================================
function renderServicesSection(content, backBtn) {
  const services = DB.get('services') || [];

  content.innerHTML = `
    ${backBtn}
    <div class="card">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
        <span>✂️ Layanan & Harga</span>
        <button class="btn btn-sm btn-primary" onclick="showAddServiceModal()">+ Tambah</button>
      </div>
      <div class="card-body" style="padding:0;">
        ${services.length === 0 ? '<p style="padding:16px;color:var(--text-secondary);text-align:center;">Belum ada layanan</p>' :
          `<table class="data-table" style="width:100%;">
            <thead>
              <tr><th>Layanan</th><th>Harga</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              ${services.map(s => `
                <tr>
                  <td style="font-weight:500;">${escHtml(s.name)}</td>
                  <td>${rp(s.price)}</td>
                  <td>
                    <span class="badge ${s.active !== false ? 'badge-success' : 'badge-secondary'}">${s.active !== false ? 'Aktif' : 'Nonaktif'}</span>
                  </td>
                  <td style="white-space:nowrap;">
                    <button class="btn btn-sm" onclick="showEditServiceModal('${s.id}')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteService('${s.id}')">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
        }
      </div>
    </div>
  `;
}

function showAddServiceModal() {
  UI.showModal(`
    <div class="modal-header"><h3>➕ Tambah Layanan</h3></div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Nama Layanan</label>
        <input type="text" id="svc-name" class="form-input" placeholder="Contoh: Potong Rambut">
      </div>
      <div class="form-group">
        <label class="form-label">Harga (Rp)</label>
        <input type="number" id="svc-price" class="form-input" placeholder="25000" min="0" inputmode="numeric">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="UI.closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="addService()">Simpan</button>
    </div>
  `);
}

function addService() {
  const name = document.getElementById('svc-name').value.trim();
  const price = parseInt(document.getElementById('svc-price').value) || 0;

  if (!name) { UI.toast('Nama layanan wajib diisi', 'error'); return; }
  if (price <= 0) { UI.toast('Harga harus lebih dari 0', 'error'); return; }

  const services = DB.get('services') || [];
  services.push({ id: generateId('SVC'), name, price, active: true });
  DB.set('services', services);
  UI.closeModal();
  UI.toast('Layanan berhasil ditambahkan ✅', 'success');
  adminNavigate('services');
}

function showEditServiceModal(serviceId) {
  const services = DB.get('services') || [];
  const svc = services.find(s => s.id === serviceId);
  if (!svc) return;

  UI.showModal(`
    <div class="modal-header"><h3>✏️ Edit Layanan</h3></div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Nama Layanan</label>
        <input type="text" id="edit-svc-name" class="form-input" value="${escHtml(svc.name)}">
      </div>
      <div class="form-group">
        <label class="form-label">Harga (Rp)</label>
        <input type="number" id="edit-svc-price" class="form-input" value="${svc.price}" min="0" inputmode="numeric">
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select id="edit-svc-status" class="form-input">
          <option value="true" ${svc.active !== false ? 'selected' : ''}>Aktif</option>
          <option value="false" ${svc.active === false ? 'selected' : ''}>Nonaktif</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="UI.closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="saveEditService('${serviceId}')">Simpan</button>
    </div>
  `);
}

function saveEditService(serviceId) {
  const name = document.getElementById('edit-svc-name').value.trim();
  const price = parseInt(document.getElementById('edit-svc-price').value) || 0;
  const active = document.getElementById('edit-svc-status').value === 'true';

  if (!name) { UI.toast('Nama layanan wajib diisi', 'error'); return; }
  if (price <= 0) { UI.toast('Harga harus lebih dari 0', 'error'); return; }

  const services = DB.get('services') || [];
  const svc = services.find(s => s.id === serviceId);
  if (svc) {
    svc.name = name;
    svc.price = price;
    svc.active = active;
    DB.set('services', services);
    UI.closeModal();
    UI.toast('Layanan berhasil diubah ✅', 'success');
    adminNavigate('services');
  }
}

function deleteService(serviceId) {
  const services = DB.get('services') || [];
  const svc = services.find(s => s.id === serviceId);
  if (!svc) return;

  UI.confirm(`Hapus layanan "${svc.name}"?`).then(yes => {
    if (!yes) return;
    const updated = services.filter(s => s.id !== serviceId);
    DB.set('services', updated);
    UI.toast('Layanan berhasil dihapus', 'success');
    adminNavigate('services');
  });
}


// ============================================
// 4. PRODUK ADD-ON
// ============================================
function renderAddonsSection(content, backBtn) {
  const addons = DB.get('addons') || [];

  content.innerHTML = `
    ${backBtn}
    <div class="card">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
        <span>🧴 Produk Add-on</span>
        <button class="btn btn-sm btn-primary" onclick="showAddAddonModal()">+ Tambah</button>
      </div>
      <div class="card-body" style="padding:0;">
        ${addons.length === 0 ? '<p style="padding:16px;color:var(--text-secondary);text-align:center;">Belum ada produk add-on</p>' :
          `<table class="data-table" style="width:100%;">
            <thead>
              <tr><th>Produk</th><th>Harga</th><th>Stok</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              ${addons.map(a => `
                <tr>
                  <td style="font-weight:500;">${escHtml(a.name)}</td>
                  <td>${rp(a.price)}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <button class="btn btn-sm" onclick="adjStock('${a.id}', -1)" ${a.stock <= 0 ? 'disabled' : ''}>−</button>
                      <span style="min-width:28px;text-align:center;font-weight:600;">${a.stock}</span>
                      <button class="btn btn-sm" onclick="adjStock('${a.id}', 1)">+</button>
                    </div>
                  </td>
                  <td>
                    <span class="badge ${a.active !== false ? 'badge-success' : 'badge-secondary'}">${a.active !== false ? 'Aktif' : 'Nonaktif'}</span>
                  </td>
                  <td style="white-space:nowrap;">
                    <button class="btn btn-sm" onclick="showEditAddonModal('${a.id}')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAddon('${a.id}')">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
        }
      </div>
    </div>
  `;
}

function adjStock(addonId, delta) {
  const addons = DB.get('addons') || [];
  const addon = addons.find(a => a.id === addonId);
  if (!addon) return;

  const newStock = addon.stock + delta;
  if (newStock < 0) {
    UI.toast('Stok tidak bisa kurang dari 0', 'error');
    return;
  }

  addon.stock = newStock;
  DB.set('addons', addons);
  adminNavigate('addons');
}

function showAddAddonModal() {
  UI.showModal(`
    <div class="modal-header"><h3>➕ Tambah Produk Add-on</h3></div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Nama Produk</label>
        <input type="text" id="addon-name" class="form-input" placeholder="Contoh: Pomade Gatsby">
      </div>
      <div class="form-group">
        <label class="form-label">Harga Jual (Rp)</label>
        <input type="number" id="addon-price" class="form-input" placeholder="35000" min="0" inputmode="numeric">
      </div>
      <div class="form-group">
        <label class="form-label">Stok</label>
        <input type="number" id="addon-stock" class="form-input" placeholder="10" min="0" inputmode="numeric">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="UI.closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="addAddon()">Simpan</button>
    </div>
  `);
}

function addAddon() {
  const name = document.getElementById('addon-name').value.trim();
  const price = parseInt(document.getElementById('addon-price').value) || 0;
  const stock = parseInt(document.getElementById('addon-stock').value) || 0;

  if (!name) { UI.toast('Nama produk wajib diisi', 'error'); return; }
  if (price <= 0) { UI.toast('Harga harus lebih dari 0', 'error'); return; }
  if (stock < 0) { UI.toast('Stok tidak boleh negatif', 'error'); return; }

  const addons = DB.get('addons') || [];
  addons.push({ id: generateId('ADD'), name, price, stock, active: true });
  DB.set('addons', addons);
  UI.closeModal();
  UI.toast('Produk add-on berhasil ditambahkan ✅', 'success');
  adminNavigate('addons');
}

function showEditAddonModal(addonId) {
  const addons = DB.get('addons') || [];
  const addon = addons.find(a => a.id === addonId);
  if (!addon) return;

  UI.showModal(`
    <div class="modal-header"><h3>✏️ Edit Produk Add-on</h3></div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Nama Produk</label>
        <input type="text" id="edit-addon-name" class="form-input" value="${escHtml(addon.name)}">
      </div>
      <div class="form-group">
        <label class="form-label">Harga Jual (Rp)</label>
        <input type="number" id="edit-addon-price" class="form-input" value="${addon.price}" min="0" inputmode="numeric">
      </div>
      <div class="form-group">
        <label class="form-label">Stok</label>
        <input type="number" id="edit-addon-stock" class="form-input" value="${addon.stock}" min="0" inputmode="numeric">
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select id="edit-addon-status" class="form-input">
          <option value="true" ${addon.active !== false ? 'selected' : ''}>Aktif</option>
          <option value="false" ${addon.active === false ? 'selected' : ''}>Nonaktif</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="UI.closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="saveEditAddon('${addonId}')">Simpan</button>
    </div>
  `);
}

function saveEditAddon(addonId) {
  const name = document.getElementById('edit-addon-name').value.trim();
  const price = parseInt(document.getElementById('edit-addon-price').value) || 0;
  const stock = parseInt(document.getElementById('edit-addon-stock').value) || 0;
  const active = document.getElementById('edit-addon-status').value === 'true';

  if (!name) { UI.toast('Nama produk wajib diisi', 'error'); return; }
  if (price <= 0) { UI.toast('Harga harus lebih dari 0', 'error'); return; }
  if (stock < 0) { UI.toast('Stok tidak boleh negatif', 'error'); return; }

  const addons = DB.get('addons') || [];
  const addon = addons.find(a => a.id === addonId);
  if (addon) {
    addon.name = name;
    addon.price = price;
    addon.stock = stock;
    addon.active = active;
    DB.set('addons', addons);
    UI.closeModal();
    UI.toast('Produk add-on berhasil diubah ✅', 'success');
    adminNavigate('addons');
  }
}

function deleteAddon(addonId) {
  const addons = DB.get('addons') || [];
  const addon = addons.find(a => a.id === addonId);
  if (!addon) return;

  UI.confirm(`Hapus produk "${addon.name}"?`).then(yes => {
    if (!yes) return;
    const updated = addons.filter(a => a.id !== addonId);
    DB.set('addons', updated);
    UI.toast('Produk add-on berhasil dihapus', 'success');
    adminNavigate('addons');
  });
}


// ============================================
// 5. PENGATURAN UMUM
// ============================================
function renderGeneralSettings(content, backBtn) {
  const settings = DB.get('settings') || {};
  const general = settings.general || {};

  content.innerHTML = `
    ${backBtn}
    <div class="card">
      <div class="card-header"><span>⚡ Pengaturan Umum</span></div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Komisi Barber (%)</label>
          <input type="number" id="set-commission" class="form-input" value="${general.commission ?? 30}" min="0" max="100" inputmode="numeric">
          <small style="color:var(--text-secondary);">Persentase komisi untuk setiap layanan</small>
        </div>
        <div class="form-group">
          <label class="form-label">Target Kunjungan Member</label>
          <input type="number" id="set-member-target" class="form-input" value="${general.memberTarget ?? 10}" min="1" inputmode="numeric">
          <small style="color:var(--text-secondary);">Jumlah kunjungan untuk mendapat reward</small>
        </div>
        <div class="form-group">
          <label class="form-label">Reward Member</label>
          <input type="text" id="set-member-reward" class="form-input" value="${escHtml(general.memberReward || 'Gratis 1x potong rambut')}" placeholder="Contoh: Gratis 1x potong rambut">
          <small style="color:var(--text-secondary);">Reward yang didapat setelah target tercapai</small>
        </div>
        <div class="form-group">
          <label class="form-label">Estimasi Waktu per Antrian (menit)</label>
          <input type="number" id="set-queue-time" class="form-input" value="${general.queueTime ?? 20}" min="1" inputmode="numeric">
          <small style="color:var(--text-secondary);">Digunakan untuk estimasi waktu tunggu</small>
        </div>
        <div class="form-group">
          <label class="form-label">Session Timeout (menit)</label>
          <input type="number" id="set-session-timeout" class="form-input" value="${general.sessionTimeout ?? 30}" min="1" inputmode="numeric">
          <small style="color:var(--text-secondary);">Otomatis logout jika tidak aktif</small>
        </div>
        <button class="btn btn-primary btn-block" onclick="saveGeneralSettings()">💾 Simpan</button>
      </div>
    </div>
  `;
}

function saveGeneralSettings() {
  const commission = parseInt(document.getElementById('set-commission').value) || 0;
  const memberTarget = parseInt(document.getElementById('set-member-target').value) || 10;
  const memberReward = document.getElementById('set-member-reward').value.trim();
  const queueTime = parseInt(document.getElementById('set-queue-time').value) || 20;
  const sessionTimeout = parseInt(document.getElementById('set-session-timeout').value) || 30;

  if (commission < 0 || commission > 100) {
    UI.toast('Komisi harus antara 0-100%', 'error');
    return;
  }

  const settings = DB.get('settings') || {};
  settings.general = { commission, memberTarget, memberReward, queueTime, sessionTimeout };
  DB.set('settings', settings);
  UI.toast('Pengaturan umum berhasil disimpan ✅', 'success');
}


// ============================================
// 6. DATA & BACKUP
// ============================================
function renderBackupSection(content, backBtn) {
  content.innerHTML = `
    ${backBtn}
    <div class="card" style="margin-bottom:12px;">
      <div class="card-header"><span>💾 Data & Backup</span></div>
      <div class="card-body">
        <div style="display:flex;flex-direction:column;gap:12px;">
          <button class="btn btn-primary btn-block" onclick="exportBackup()">📤 Export Backup (JSON)</button>

          <div style="position:relative;">
            <button class="btn btn-block" onclick="document.getElementById('import-file').click()">📥 Import Backup (JSON)</button>
            <input type="file" id="import-file" accept=".json,application/json" style="display:none;" onchange="importBackup(event)">
          </div>

          <hr style="border-color:var(--border);margin:8px 0;">

          <button class="btn btn-danger btn-block" onclick="clearAllData()">🗑️ Hapus Semua Data</button>
          <small style="color:var(--text-secondary);text-align:center;">⚠️ Tindakan ini tidak bisa dibatalkan</small>
        </div>
      </div>
    </div>
  `;
}

function exportBackup() {
  const allKeys = ['settings', 'users', 'services', 'addons', 'transactions', 'queue', 'members'];
  const backup = {};

  allKeys.forEach(key => {
    const val = DB.get(key);
    if (val !== null && val !== undefined) {
      backup[key] = val;
    }
  });

  backup._meta = {
    app: 'Pangkas',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser ? currentUser.name : 'unknown'
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pangkas-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  UI.toast('Backup berhasil di-export 📤', 'success');
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      if (!data || typeof data !== 'object') {
        UI.toast('File backup tidak valid', 'error');
        return;
      }

      UI.confirm('Import akan MENGGABUNGKAN data backup dengan data yang ada. Lanjutkan?').then(yes => {
        if (!yes) return;

        // Merge strategy: combine arrays, merge objects
        const mergeableArrays = ['users', 'services', 'addons', 'transactions', 'queue', 'members'];

        mergeableArrays.forEach(key => {
          if (data[key] && Array.isArray(data[key])) {
            const existing = DB.get(key) || [];
            const existingIds = new Set(existing.map(item => item.id));

            // Add only items with IDs that don't already exist
            const newItems = data[key].filter(item => !existingIds.has(item.id));
            if (newItems.length > 0) {
              DB.set(key, [...existing, ...newItems]);
            }
          }
        });

        // For settings, deep merge
        if (data.settings && typeof data.settings === 'object') {
          const existingSettings = DB.get('settings') || {};
          const mergedSettings = { ...existingSettings };

          Object.keys(data.settings).forEach(key => {
            if (typeof data.settings[key] === 'object' && !Array.isArray(data.settings[key])) {
              mergedSettings[key] = { ...(existingSettings[key] || {}), ...data.settings[key] };
            } else {
              mergedSettings[key] = data.settings[key];
            }
          });

          DB.set('settings', mergedSettings);
        }

        UI.toast('Data backup berhasil di-import ✅', 'success');
        adminNavigate('backup');
      });
    } catch (err) {
      UI.toast('Gagal membaca file backup: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);

  // Reset input so same file can be selected again
  event.target.value = '';
}

function clearAllData() {
  UI.confirm('⚠️ Apakah kamu yakin ingin menghapus SEMUA data?\nTindakan ini tidak bisa dibatalkan!').then(yes1 => {
    if (!yes1) return;

    UI.confirm('🚨 KONFIRMASI TERAKHIR: Semua transaksi, antrian, member, layanan, dan pengaturan akan HILANG. Yakin?').then(yes2 => {
      if (!yes2) return;

      const keysToDelete = ['settings', 'services', 'addons', 'transactions', 'queue', 'members'];
      keysToDelete.forEach(key => DB.set(key, key === 'settings' ? {} : []));

      // Keep users (don't lock everyone out)
      UI.toast('Semua data berhasil dihapus 🗑️', 'success');
      adminNavigate('backup');
    });
  });
}


// ============================================
// 7. TENTANG PANGKAS
// ============================================
function renderAboutSection(content, backBtn) {
  content.innerHTML = `
    ${backBtn}
    ${renderTentangCard()}
  `;
}

function renderTentangCard() {
  return `
    <div class="card">
      <div class="card-header"><span>💈 Tentang Pangkas</span></div>
      <div class="card-body" style="text-align:center;">
        <div style="font-size:3rem;margin-bottom:12px;">💈</div>
        <h3 style="margin-bottom:4px;">Pangkas v1.0</h3>
        <p style="color:var(--text-secondary);margin-bottom:16px;">Aplikasi manajemen barbershop</p>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:center;">
          <a href="https://github.com/nicepkg/pangkas" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:none;">
            🔗 GitHub Repository
          </a>
          <p style="margin-top:16px;color:var(--text-secondary);font-size:0.9rem;">
            Made with 💈 by <strong>Sentra Technology</strong>
          </p>
        </div>
      </div>
    </div>
  `;
}


// ============================================
// UTILITIES
// ============================================
function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
