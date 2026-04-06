// ============================================================
// belanja.js — Expense Tracking Page (Pangkas POS)
// ============================================================

function renderBelanja(container) {
  const DEFAULT_CATEGORIES = [
    'Produk Rambut', 'Peralatan', 'Sewa', 'Listrik & Air',
    'Gaji', 'Konsumsi', 'Lain-lain'
  ];

  // --- helpers ------------------------------------------------
  function getExpenses() {
    return DB.get('expenses') || [];
  }
  function saveExpenses(list) {
    DB.set('expenses', list);
  }
  function getCategories() {
    const cats = DB.get('expense_categories');
    if (!cats || cats.length === 0) {
      DB.set('expense_categories', DEFAULT_CATEGORIES);
      return [...DEFAULT_CATEGORIES];
    }
    return cats;
  }
  function saveCategories(cats) {
    DB.set('expense_categories', cats);
  }
  function getAddons() {
    return DB.get('addons') || [];
  }
  function saveAddons(list) {
    DB.set('addons', list);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }
  function thisMonth() {
    return today().slice(0, 7); // "2026-04"
  }
  function monthLabel(ym) {
    const [y, m] = ym.split('-');
    const names = ['Januari','Februari','Maret','April','Mei','Juni',
      'Juli','Agustus','September','Oktober','November','Desember'];
    return names[parseInt(m, 10) - 1] + ' ' + y;
  }

  // --- stats --------------------------------------------------
  function calcStats() {
    const expenses = getExpenses();
    const ym = thisMonth();
    let totalAll = 0;
    let totalMonth = 0;
    const catBreakdown = {};

    expenses.forEach(e => {
      totalAll += e.amount || 0;
      if ((e.date || '').slice(0, 7) === ym) {
        totalMonth += e.amount || 0;
        catBreakdown[e.category] = (catBreakdown[e.category] || 0) + (e.amount || 0);
      }
    });
    return { totalAll, totalMonth, catBreakdown };
  }

  // --- category select HTML -----------------------------------
  function categoryOptions(selected) {
    const cats = getCategories();
    let html = '<option value="">-- Pilih Kategori --</option>';
    cats.forEach(c => {
      html += `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`;
    });
    html += '<option value="__new__">+ Kategori baru…</option>';
    return html;
  }

  // --- addon select HTML --------------------------------------
  function addonOptions(selectedId) {
    const addons = getAddons();
    let html = '<option value="">-- Tidak terhubung --</option>';
    addons.forEach(a => {
      html += `<option value="${a.id}" ${a.id === selectedId ? 'selected' : ''}>${a.name}</option>`;
    });
    html += '<option value="__new_addon__">+ Buat add-on baru dari belanja ini…</option>';
    return html;
  }

  // --- render main page ---------------------------------------
  function render() {
    const { totalAll, totalMonth, catBreakdown } = calcStats();
    const expenses = getExpenses().sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));

    let catRows = '';
    const cats = Object.keys(catBreakdown).sort((a, b) => catBreakdown[b] - catBreakdown[a]);
    if (cats.length === 0) {
      catRows = '<div style="color:var(--text-secondary);font-size:0.9rem;padding:8px 0;">Belum ada pengeluaran bulan ini</div>';
    } else {
      const maxVal = catBreakdown[cats[0]] || 1;
      cats.forEach(c => {
        const pct = Math.round((catBreakdown[c] / maxVal) * 100);
        catRows += `
          <div style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:2px;">
              <span>${c}</span><span style="font-weight:600;">${rp(catBreakdown[c])}</span>
            </div>
            <div style="background:var(--bg-secondary);border-radius:6px;height:8px;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:var(--primary);border-radius:6px;transition:width .3s;"></div>
            </div>
          </div>`;
      });
    }

    let tableRows = '';
    if (expenses.length === 0) {
      tableRows = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-secondary);">Belum ada data pengeluaran</td></tr>`;
    } else {
      expenses.forEach(e => {
        tableRows += `
          <tr>
            <td style="white-space:nowrap;">${e.date || '-'}</td>
            <td>
              <div style="font-weight:500;">${e.name}</div>
              ${e.note ? `<div style="font-size:0.8rem;color:var(--text-secondary);">${e.note}</div>` : ''}
            </td>
            <td><span style="background:var(--bg-secondary);padding:2px 8px;border-radius:12px;font-size:0.8rem;">${e.category || '-'}</span></td>
            <td style="text-align:right;font-weight:600;white-space:nowrap;">${rp(e.amount)}</td>
            <td style="text-align:right;white-space:nowrap;">
              <button class="btn-edit-expense" data-id="${e.id}" style="background:none;border:none;cursor:pointer;padding:4px 6px;font-size:1rem;" title="Edit">✏️</button>
              <button class="btn-delete-expense" data-id="${e.id}" style="background:none;border:none;cursor:pointer;padding:4px 6px;font-size:1rem;" title="Hapus">🗑️</button>
            </td>
          </tr>`;
      });
    }

    container.innerHTML = `
      <div style="max-width:900px;margin:0 auto;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
          <div>
            <h2 style="margin:0;font-size:1.4rem;">💰 Pengeluaran</h2>
            <p style="margin:4px 0 0;color:var(--text-secondary);font-size:0.9rem;">${monthLabel(thisMonth())}</p>
          </div>
          <button id="btnAddExpense" style="background:var(--primary);color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.95rem;">
            + Tambah Pengeluaran
          </button>
        </div>

        <!-- Summary Cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
          <div style="background:var(--bg-card,#fff);border-radius:12px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.08);">
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:4px;">Bulan Ini</div>
            <div style="font-size:1.5rem;font-weight:700;color:var(--danger,#e74c3c);">${rp(totalMonth)}</div>
          </div>
          <div style="background:var(--bg-card,#fff);border-radius:12px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.08);">
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:4px;">Total Semua</div>
            <div style="font-size:1.5rem;font-weight:700;">${rp(totalAll)}</div>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div style="background:var(--bg-card,#fff);border-radius:12px;padding:18px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,.08);">
          <h3 style="margin:0 0 12px;font-size:1rem;">📊 Kategori Bulan Ini</h3>
          ${catRows}
        </div>

        <!-- Expense Table -->
        <div style="background:var(--bg-card,#fff);border-radius:12px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow-x:auto;">
          <h3 style="margin:0 0 12px;font-size:1rem;">📋 Riwayat Pengeluaran</h3>
          <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
            <thead>
              <tr style="border-bottom:2px solid var(--bg-secondary);text-align:left;">
                <th style="padding:8px 6px;">Tanggal</th>
                <th style="padding:8px 6px;">Nama</th>
                <th style="padding:8px 6px;">Kategori</th>
                <th style="padding:8px 6px;text-align:right;">Jumlah</th>
                <th style="padding:8px 6px;text-align:right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // --- wire events ------------------------------------------
    document.getElementById('btnAddExpense').addEventListener('click', () => openExpenseModal());

    container.querySelectorAll('.btn-edit-expense').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const exp = getExpenses().find(e => e.id === id);
        if (exp) openExpenseModal(exp);
      });
    });

    container.querySelectorAll('.btn-delete-expense').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const ok = await UI.confirm('Yakin ingin menghapus pengeluaran ini?');
        if (!ok) return;
        let list = getExpenses().filter(e => e.id !== id);
        saveExpenses(list);
        UI.toast('Pengeluaran dihapus', 'success');
        render();
      });
    });
  }

  // --- expense modal (add / edit) -----------------------------
  function openExpenseModal(existing) {
    const isEdit = !!existing;
    const title = isEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran';
    const e = existing || {};

    const html = `
      <div style="max-width:480px;margin:0 auto;">
        <h3 style="margin:0 0 16px;">${title}</h3>
        <div style="display:flex;flex-direction:column;gap:12px;">

          <label style="font-size:0.85rem;font-weight:600;">Nama Item
            <input id="exName" type="text" value="${e.name || ''}" placeholder="Contoh: Pomade Gatsby"
              style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;" />
          </label>

          <label style="font-size:0.85rem;font-weight:600;">Kategori
            <select id="exCategory" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;">
              ${categoryOptions(e.category || '')}
            </select>
          </label>
          <div id="exNewCatWrap" style="display:none;">
            <input id="exNewCat" type="text" placeholder="Nama kategori baru"
              style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;box-sizing:border-box;" />
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <label style="font-size:0.85rem;font-weight:600;">Qty
              <input id="exQty" type="number" min="1" value="${e.qty || 1}"
                style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;" />
            </label>
            <label style="font-size:0.85rem;font-weight:600;">Harga Satuan
              <input id="exUnitPrice" type="number" min="0" value="${e.unitPrice || ''}" placeholder="0"
                style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;" />
            </label>
          </div>

          <div style="background:var(--bg-secondary);padding:10px 14px;border-radius:8px;font-size:0.95rem;">
            Total: <strong id="exTotal">${rp((e.qty || 1) * (e.unitPrice || 0))}</strong>
          </div>

          <label style="font-size:0.85rem;font-weight:600;">Tanggal
            <input id="exDate" type="date" value="${e.date || today()}"
              style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;" />
          </label>

          <label style="font-size:0.85rem;font-weight:600;">Catatan <span style="font-weight:400;color:var(--text-secondary);">(opsional)</span>
            <textarea id="exNote" rows="2" placeholder="Catatan…"
              style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;resize:vertical;">${e.note || ''}</textarea>
          </label>

          <hr style="border:none;border-top:1px solid var(--border);margin:4px 0;" />

          <label style="font-size:0.85rem;font-weight:600;">Hubungkan ke Add-on Produk <span style="font-weight:400;color:var(--text-secondary);">(opsional — tambah stok)</span>
            <select id="exAddon" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;">
              ${addonOptions(e.addonId || '')}
            </select>
          </label>
          <div id="exNewAddonWrap" style="display:none;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <input id="exNewAddonName" type="text" placeholder="Nama add-on"
                style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;box-sizing:border-box;" />
              <input id="exNewAddonPrice" type="number" min="0" placeholder="Harga jual"
                style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;box-sizing:border-box;" />
            </div>
          </div>

          <div style="display:flex;gap:10px;margin-top:6px;">
            <button id="exBtnSave" style="flex:1;background:var(--primary);color:#fff;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:600;">
              ${isEdit ? 'Simpan Perubahan' : 'Simpan'}
            </button>
            <button id="exBtnCancel" style="flex:0 0 auto;background:var(--bg-secondary);border:none;padding:10px 18px;border-radius:8px;cursor:pointer;">
              Batal
            </button>
          </div>
        </div>
      </div>
    `;

    UI.showModal(html);

    // --- modal DOM refs ----------------------------------------
    const elName = document.getElementById('exName');
    const elCategory = document.getElementById('exCategory');
    const elNewCatWrap = document.getElementById('exNewCatWrap');
    const elNewCat = document.getElementById('exNewCat');
    const elQty = document.getElementById('exQty');
    const elUnitPrice = document.getElementById('exUnitPrice');
    const elTotal = document.getElementById('exTotal');
    const elDate = document.getElementById('exDate');
    const elNote = document.getElementById('exNote');
    const elAddon = document.getElementById('exAddon');
    const elNewAddonWrap = document.getElementById('exNewAddonWrap');
    const elNewAddonName = document.getElementById('exNewAddonName');
    const elNewAddonPrice = document.getElementById('exNewAddonPrice');

    // auto-calc total
    function calcTotal() {
      const q = parseInt(elQty.value, 10) || 0;
      const p = parseInt(elUnitPrice.value, 10) || 0;
      elTotal.textContent = rp(q * p);
    }
    elQty.addEventListener('input', calcTotal);
    elUnitPrice.addEventListener('input', calcTotal);

    // category "new" toggle
    elCategory.addEventListener('change', () => {
      elNewCatWrap.style.display = elCategory.value === '__new__' ? 'block' : 'none';
    });

    // addon "new" toggle
    elAddon.addEventListener('change', () => {
      elNewAddonWrap.style.display = elAddon.value === '__new_addon__' ? 'block' : 'none';
    });

    // cancel
    document.getElementById('exBtnCancel').addEventListener('click', () => UI.closeModal());

    // save
    document.getElementById('exBtnSave').addEventListener('click', () => {
      const name = elName.value.trim();
      if (!name) { UI.toast('Nama item wajib diisi', 'error'); return; }

      // resolve category
      let category = elCategory.value;
      if (category === '__new__') {
        category = elNewCat.value.trim();
        if (!category) { UI.toast('Nama kategori baru wajib diisi', 'error'); return; }
        // persist new category
        const cats = getCategories();
        if (!cats.includes(category)) {
          cats.push(category);
          saveCategories(cats);
        }
      }
      if (!category) { UI.toast('Pilih kategori', 'error'); return; }

      const qty = parseInt(elQty.value, 10) || 1;
      const unitPrice = parseInt(elUnitPrice.value, 10) || 0;
      const amount = qty * unitPrice;
      const date = elDate.value || today();
      const note = elNote.value.trim();

      // resolve addon link
      let addonId = elAddon.value || '';
      if (addonId === '__new_addon__') {
        const addonName = elNewAddonName.value.trim();
        const addonPrice = parseInt(elNewAddonPrice.value, 10) || 0;
        if (!addonName) { UI.toast('Nama add-on wajib diisi', 'error'); return; }
        const newAddon = {
          id: generateId('a'),
          name: addonName,
          price: addonPrice,
          stock: qty,
          createdAt: new Date().toISOString()
        };
        const addons = getAddons();
        addons.push(newAddon);
        saveAddons(addons);
        addonId = newAddon.id;
        UI.toast(`Add-on "${addonName}" dibuat (stok: ${qty})`, 'success');
      } else if (addonId) {
        // add qty to existing addon stock
        const addons = getAddons();
        const addon = addons.find(a => a.id === addonId);
        if (addon) {
          // On edit: adjust stock difference
          if (isEdit && existing.addonId === addonId) {
            const oldQty = existing.qty || 0;
            addon.stock = (addon.stock || 0) + qty - oldQty;
          } else {
            addon.stock = (addon.stock || 0) + qty;
          }
          saveAddons(addons);
        }
      }

      // build expense object
      const expense = {
        id: isEdit ? existing.id : generateId('ex'),
        name,
        category,
        qty,
        unitPrice,
        amount,
        date,
        note,
        addonId: addonId || null,
        createdAt: isEdit ? existing.createdAt : new Date().toISOString()
      };

      let list = getExpenses();
      if (isEdit) {
        list = list.map(ex => ex.id === expense.id ? expense : ex);
      } else {
        list.push(expense);
      }
      saveExpenses(list);

      UI.closeModal();
      UI.toast(isEdit ? 'Pengeluaran diperbarui' : 'Pengeluaran ditambahkan', 'success');
      render();
    });
  }

  // --- initial render -----------------------------------------
  render();
}
