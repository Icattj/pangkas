// hutang.js — Debt Tracking
function renderHutang(container) {
  let showPaid = false;

  function render() {
    const transactions = DB.get('transactions') || [];
    const settings = DB.get('settings') || {};
    const commission = settings.commission || 40;

    const unpaid = transactions.filter(t => t.paid === false).sort((a, b) => b.timestamp - a.timestamp);
    const paid = transactions.filter(t => t.paymentMethod === 'hutang' && t.paid === true).sort((a, b) => b.timestamp - a.timestamp);

    const totalUnpaid = unpaid.reduce((s, t) => s + (t.total || 0), 0);

    container.innerHTML = `
      <div class="page-hutang">
        <div class="page-header">
          <h2>📝 Hutang</h2>
        </div>

        <div class="card summary-card">
          <div class="hutang-summary">
            <div class="hutang-stat">
              <span class="hutang-count">${unpaid.length}</span>
              <span class="text-muted">Belum lunas</span>
            </div>
            <div class="hutang-stat">
              <span class="hutang-amount">${rp(totalUnpaid)}</span>
              <span class="text-muted">Total hutang</span>
            </div>
          </div>
        </div>

        ${unpaid.length === 0 ? `
          <div class="card empty-state">
            <p>Tidak ada hutang. Bersih! ✨</p>
          </div>
        ` : ''}

        <div class="hutang-list">
          ${unpaid.map(t => `
            <div class="hutang-card card">
              <div class="hutang-info">
                <div class="hutang-name-row">
                  <strong>${t.customerName || 'Walk-in'}</strong>
                  <span class="hutang-amount-badge">${rp(t.total || 0)}</span>
                </div>
                <span class="text-muted">Barber: ${t.barberName || '-'}</span>
                <span class="text-muted">📅 ${t.date || ''} ${t.time || ''}</span>
                ${t.hutangNote ? `<span class="text-muted">📝 ${t.hutangNote}</span>` : ''}
                <span class="text-sm text-muted">${(t.items || []).map(i => i.name).join(', ')}</span>
              </div>
              <div class="hutang-actions">
                <button class="btn btn-sm btn-success" data-action="lunas" data-id="${t.id}">✅ Lunas</button>
                ${currentUser && currentUser.role === 'admin' ? `
                  <button class="btn btn-sm btn-danger" data-action="delete" data-id="${t.id}">🗑️</button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="card" style="margin-top:1rem;">
          <div class="section-header" id="toggle-paid" style="cursor:pointer;">
            <h3>✅ Riwayat Lunas ${paid.length > 0 ? `(${paid.length})` : ''}</h3>
            <span>${showPaid ? '▲' : '▼'}</span>
          </div>
          ${showPaid ? `
            <div class="paid-list">
              ${paid.length === 0 ? '<p class="text-muted">Belum ada riwayat</p>' : ''}
              ${paid.map(t => `
                <div class="paid-item">
                  <div>
                    <strong>${t.customerName || 'Walk-in'}</strong>
                    <span class="text-muted">${t.date || ''}</span>
                  </div>
                  <span>${rp(t.total || 0)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Toggle paid section
    const toggleBtn = document.getElementById('toggle-paid');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        showPaid = !showPaid;
        render();
      });
    }

    // Actions
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', function() {
        const action = this.dataset.action;
        const id = this.dataset.id;

        if (action === 'lunas') {
          markPaid(id);
        } else if (action === 'delete') {
          deleteHutang(id);
        }
      });
    });
  }

  function markPaid(txId) {
    const transactions = DB.get('transactions') || [];
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    tx.paid = true;
    tx.paidDate = new Date().toISOString().slice(0, 10);

    // Recalculate commission since now it's paid
    const settings = DB.get('settings') || {};
    const commissionPct = settings.commission || 40;
    tx.commission = Math.round((tx.total || 0) * commissionPct / 100);

    DB.set('transactions', transactions);
    UI.toast(`${tx.customerName || 'Walk-in'} sudah lunas! ✅`, 'success');
    render();
  }

  function deleteHutang(txId) {
    UI.showModal(`
      <div class="confirm-modal">
        <h3>Hapus Hutang?</h3>
        <p>Transaksi ini akan dihapus permanen.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="del-cancel">Batal</button>
          <button class="btn btn-danger" id="del-confirm">Hapus</button>
        </div>
      </div>
    `);

    document.getElementById('del-cancel').addEventListener('click', () => UI.closeModal());
    document.getElementById('del-confirm').addEventListener('click', () => {
      const transactions = DB.get('transactions') || [];
      const idx = transactions.findIndex(t => t.id === txId);
      if (idx >= 0) {
        transactions.splice(idx, 1);
        DB.set('transactions', transactions);
      }
      UI.closeModal();
      UI.toast('Hutang dihapus', 'info');
      render();
    });
  }

  render();
}
