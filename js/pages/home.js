// home.js — Dashboard
function renderHome(container) {
  const today = new Date().toISOString().slice(0, 10);
  const transactions = DB.get('transactions') || [];
  const queue = DB.get('queue') || [];
  const members = DB.get('members') || [];
  const appointments = DB.get('appointments') || [];
  const barbers = DB.get('barbers') || [];
  const settings = DB.get('settings') || {};
  const shopName = (settings.shop && settings.shop.name) || 'Pangkas';

  // Today's stats
  const todayTx = transactions.filter(t => t.date && t.date.startsWith(today));
  const todayRevenue = todayTx.reduce((sum, t) => sum + (t.total || 0), 0);
  const activeQueue = queue.filter(q => q.date === today && (q.status === 'menunggu' || q.status === 'dilayani'));
  const memberCount = members.length;

  // Next appointment
  const now = new Date();
  const upcoming = appointments
    .filter(a => a.status !== 'batal' && a.status !== 'selesai')
    .filter(a => {
      const dt = new Date(a.date + 'T' + (a.time || '00:00'));
      return dt >= now;
    })
    .sort((a, b) => {
      const da = new Date(a.date + 'T' + (a.time || '00:00'));
      const db = new Date(b.date + 'T' + (b.time || '00:00'));
      return da - db;
    });
  const nextAppt = upcoming[0] || null;

  // Barbers on duty (barbers who have transactions today or are active)
  const activeBarbers = barbers.filter(b => b.active !== false);

  // Recent transactions (last 5)
  const recent = transactions.slice(-5).reverse();

  container.innerHTML = `
    <div class="page-home">
      <div class="home-greeting">
        <h1>Halo, ${currentUser ? currentUser.name : 'Boss'}! 👋</h1>
        <p class="text-muted">${shopName} — ${formatDateIndo(today)}</p>
      </div>

      <div class="stat-cards">
        <div class="stat-card stat-revenue">
          <div class="stat-icon">💰</div>
          <div class="stat-value">${rp(todayRevenue)}</div>
          <div class="stat-label">Pendapatan Hari Ini</div>
        </div>
        <div class="stat-card stat-tx">
          <div class="stat-icon">🧾</div>
          <div class="stat-value">${todayTx.length}</div>
          <div class="stat-label">Transaksi</div>
        </div>
        <div class="stat-card stat-queue">
          <div class="stat-icon">📋</div>
          <div class="stat-value">${activeQueue.length}</div>
          <div class="stat-label">Antrian Aktif</div>
        </div>
        <div class="stat-card stat-member">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${memberCount}</div>
          <div class="stat-label">Member</div>
        </div>
      </div>

      ${nextAppt ? `
        <div class="card next-appt-card">
          <h3>📅 Janji Berikutnya</h3>
          <div class="appt-preview">
            <strong>${nextAppt.name}</strong>
            <span>${nextAppt.date} ${nextAppt.time || ''}</span>
            <span class="badge">${nextAppt.service || ''}</span>
          </div>
        </div>
      ` : ''}

      <div class="quick-actions">
        <button class="btn btn-primary btn-lg" onclick="PangkasApp.navigate('kasir')">
          💰 Transaksi Baru
        </button>
        <button class="btn btn-secondary btn-lg" onclick="PangkasApp.navigate('antrian')">
          📋 Tambah Antrian
        </button>
        <button class="btn btn-outline btn-lg" onclick="PangkasApp.navigate('janji')">
          📅 Buat Janji
        </button>
      </div>

      ${activeBarbers.length > 0 ? `
        <div class="card">
          <h3>💈 Barber On Duty</h3>
          <div class="barber-chips">
            ${activeBarbers.map(b => `
              <span class="chip barber-chip">
                <span class="chip-dot"></span>
                ${b.name}
                <span class="badge badge-sm">${b.role || 'barber'}</span>
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${recent.length > 0 ? `
        <div class="card">
          <h3>🧾 Transaksi Terakhir</h3>
          <div class="tx-list">
            ${recent.map(t => `
              <div class="tx-item">
                <div class="tx-info">
                  <strong>${t.customerName || 'Walk-in'}</strong>
                  <span class="text-muted">${t.barberName || ''} • ${t.paymentMethod || 'cash'}</span>
                </div>
                <div class="tx-amount">${rp(t.total || 0)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="card empty-state">
          <p>Belum ada transaksi hari ini. Yuk mulai! 🚀</p>
        </div>
      `}
    </div>
  `;
}

function formatDateIndo(dateStr) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const d = new Date(dateStr + 'T00:00:00');
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
