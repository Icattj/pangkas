// laporan.js — Reports
function renderLaporan(container) {
  const settings = DB.get('settings') || {};
  const commission = settings.commission || 40;
  let period = 'today'; // today | week | month | all

  function render() {
    const transactions = DB.get('transactions') || [];
    const expenses = DB.get('expenses') || [];
    const barbers = DB.get('barbers') || [];
    const today = new Date().toISOString().slice(0, 10);

    // Filter transactions by period
    const filtered = filterByPeriod(transactions, period);
    const filteredExpenses = filterByPeriod(expenses, period);

    // Stats
    const totalRevenue = filtered.reduce((s, t) => s + (t.total || 0), 0);
    const totalCommission = filtered.reduce((s, t) => s + (t.commission || 0), 0);
    const totalExpenses = filteredExpenses.reduce((s, e) => s + (e.total || 0), 0);
    const netRevenue = totalRevenue - totalCommission;
    const profit = netRevenue - totalExpenses;
    const txCount = filtered.length;

    // Hutang warning
    const unpaidTx = transactions.filter(t => t.paid === false);
    const totalHutang = unpaidTx.reduce((s, t) => s + (t.total || 0), 0);

    // Barber commission table
    const barberStats = {};
    barbers.forEach(b => {
      barberStats[b.id] = { name: b.name, txCount: 0, revenue: 0, commission: 0 };
    });
    filtered.forEach(t => {
      if (t.barberId && barberStats[t.barberId]) {
        barberStats[t.barberId].txCount++;
        barberStats[t.barberId].revenue += (t.total || 0);
        barberStats[t.barberId].commission += (t.commission || 0);
      }
    });

    // Bar chart data (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const dayTx = transactions.filter(t => t.date === ds);
      const dayRev = dayTx.reduce((s, t) => s + (t.total || 0), 0);
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
      chartData.push({ date: ds, label: dayLabel, revenue: dayRev });
    }
    const maxRev = Math.max(...chartData.map(d => d.revenue), 1);

    container.innerHTML = `
      <div class="page-laporan">
        <div class="page-header">
          <h2>📊 Laporan</h2>
        </div>

        <div class="period-tabs">
          <button class="tab ${period === 'today' ? 'active' : ''}" data-period="today">Hari Ini</button>
          <button class="tab ${period === 'week' ? 'active' : ''}" data-period="week">Minggu</button>
          <button class="tab ${period === 'month' ? 'active' : ''}" data-period="month">Bulan</button>
          <button class="tab ${period === 'all' ? 'active' : ''}" data-period="all">Semua</button>
        </div>

        <div class="stat-cards">
          <div class="stat-card stat-revenue">
            <div class="stat-value">${rp(totalRevenue)}</div>
            <div class="stat-label">Pendapatan</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${rp(netRevenue)}</div>
            <div class="stat-label">Net (- Komisi)</div>
          </div>
          <div class="stat-card ${profit >= 0 ? 'stat-success' : 'stat-danger'}">
            <div class="stat-value">${rp(profit)}</div>
            <div class="stat-label">Profit (- Belanja)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${txCount}</div>
            <div class="stat-label">Transaksi</div>
          </div>
        </div>

        ${totalHutang > 0 ? `
          <div class="card warning-card">
            ⚠️ Ada ${unpaidTx.length} hutang belum lunas: <strong>${rp(totalHutang)}</strong>
            <button class="btn btn-sm btn-outline" onclick="navigateTo('hutang')">Lihat →</button>
          </div>
        ` : ''}

        <div class="card">
          <h3>📊 Pendapatan 7 Hari Terakhir</h3>
          <div class="bar-chart">
            ${chartData.map(d => `
              <div class="bar-col">
                <div class="bar-value">${d.revenue > 0 ? rp(d.revenue) : ''}</div>
                <div class="bar" style="height: ${Math.max(4, (d.revenue / maxRev) * 150)}px;"></div>
                <div class="bar-label">${d.label}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <h3>💈 Komisi Barber</h3>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Barber</th><th>Transaksi</th><th>Pendapatan</th><th>Komisi (${commission}%)</th></tr>
              </thead>
              <tbody>
                ${Object.values(barberStats).map(b => `
                  <tr>
                    <td>${b.name}</td>
                    <td>${b.txCount}</td>
                    <td>${rp(b.revenue)}</td>
                    <td>${rp(b.commission)}</td>
                  </tr>
                `).join('')}
                ${Object.values(barberStats).length === 0 ? '<tr><td colspan="4">Belum ada data</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <h3>🧾 Riwayat Transaksi</h3>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Tanggal</th><th>Customer</th><th>Barber</th><th>Total</th><th>Bayar</th></tr>
              </thead>
              <tbody>
                ${filtered.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50).map(t => `
                  <tr>
                    <td>${t.date || ''}</td>
                    <td>${t.customerName || 'Walk-in'}</td>
                    <td>${t.barberName || ''}</td>
                    <td>${rp(t.total || 0)}</td>
                    <td><span class="badge badge-sm">${t.paymentMethod || ''}</span></td>
                  </tr>
                `).join('')}
                ${filtered.length === 0 ? '<tr><td colspan="5">Belum ada transaksi</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <h3>💾 Data & Export</h3>
          <div class="data-actions">
            <button class="btn btn-outline" id="btn-export-csv">📄 Export CSV</button>
            <button class="btn btn-outline" id="btn-backup-json">💾 Backup JSON</button>
            <div class="form-group">
              <label class="btn btn-outline" style="cursor:pointer;">
                📂 Import Backup
                <input type="file" id="btn-import-json" accept=".json" style="display:none;">
              </label>
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function filterByPeriod(data, p) {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    if (p === 'today') {
      return data.filter(d => (d.date || '').startsWith(today));
    } else if (p === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const ws = weekAgo.toISOString().slice(0, 10);
      return data.filter(d => (d.date || '') >= ws);
    } else if (p === 'month') {
      const monthStr = today.slice(0, 7);
      return data.filter(d => (d.date || '').startsWith(monthStr));
    }
    return data; // all
  }

  function bindEvents() {
    // Period tabs
    container.querySelectorAll('.period-tabs .tab').forEach(tab => {
      tab.addEventListener('click', function() {
        period = this.dataset.period;
        render();
      });
    });

    // Export CSV
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);

    // Backup JSON
    document.getElementById('btn-backup-json').addEventListener('click', backupJSON);

    // Import JSON
    document.getElementById('btn-import-json').addEventListener('change', importJSON);
  }

  function exportCSV() {
    const transactions = DB.get('transactions') || [];
    let csv = 'Tanggal,Jam,Customer,Barber,Items,Total,Metode Bayar,Status\n';
    transactions.forEach(t => {
      const items = (t.items || []).map(i => i.name).join('; ');
      csv += `"${t.date || ''}","${t.time || ''}","${t.customerName || ''}","${t.barberName || ''}","${items}","${t.total || 0}","${t.paymentMethod || ''}","${t.paid ? 'Lunas' : 'Hutang'}"\n`;
    });

    downloadFile(csv, `pangkas-laporan-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    UI.toast('CSV berhasil di-export! 📄', 'success');
  }

  function backupJSON() {
    const backup = {
      version: '1.0',
      date: new Date().toISOString(),
      settings: DB.get('settings'),
      barbers: DB.get('barbers'),
      services: DB.get('services'),
      addons: DB.get('addons'),
      members: DB.get('members'),
      transactions: DB.get('transactions'),
      queue: DB.get('queue'),
      appointments: DB.get('appointments'),
      expenses: DB.get('expenses')
    };

    const json = JSON.stringify(backup, null, 2);
    downloadFile(json, `pangkas-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    UI.toast('Backup berhasil! 💾', 'success');
  }

  function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version) {
          UI.toast('File tidak valid!', 'error');
          return;
        }

        if (data.settings) DB.set('settings', data.settings);
        if (data.barbers) DB.set('barbers', data.barbers);
        if (data.services) DB.set('services', data.services);
        if (data.addons) DB.set('addons', data.addons);
        if (data.members) DB.set('members', data.members);
        if (data.transactions) DB.set('transactions', data.transactions);
        if (data.queue) DB.set('queue', data.queue);
        if (data.appointments) DB.set('appointments', data.appointments);
        if (data.expenses) DB.set('expenses', data.expenses);

        UI.toast('Data berhasil di-import! 🎉', 'success');
        render();
      } catch (err) {
        UI.toast('Error membaca file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  render();
}
