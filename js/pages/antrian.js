// antrian.js — Queue Management
function renderAntrian(container) {
  const today = new Date().toISOString().slice(0, 10);
  const services = (DB.get('services') || []).filter(s => s.active !== false);
  const barbers = (DB.get('barbers') || []).filter(b => b.active !== false);
  const settings = DB.get('settings') || {};
  const estimateMin = settings.queueEstimate || 20;

  // Auto-reset: clear completed items from previous days
  let queue = DB.get('queue') || [];
  const prevDayCompleted = queue.filter(q => q.date !== today && (q.status === 'selesai' || q.status === 'batal'));
  if (prevDayCompleted.length > 0) {
    queue = queue.filter(q => !(q.date !== today && (q.status === 'selesai' || q.status === 'batal')));
    DB.set('queue', queue);
  }

  // Today's queue
  const todayQueue = queue.filter(q => q.date === today);
  const activeQueue = todayQueue.filter(q => q.status === 'menunggu' || q.status === 'dilayani');
  const completedQueue = todayQueue.filter(q => q.status === 'selesai' || q.status === 'batal');

  // Next queue number for today
  const maxNum = todayQueue.reduce((max, q) => Math.max(max, q.number || 0), 0);

  function render() {
    const q = DB.get('queue') || [];
    const tq = q.filter(qi => qi.date === today);
    const active = tq.filter(qi => qi.status === 'menunggu' || qi.status === 'dilayani');
    const completed = tq.filter(qi => qi.status === 'selesai' || qi.status === 'batal');
    const currentMax = tq.reduce((max, qi) => Math.max(max, qi.number || 0), 0);

    container.innerHTML = `
      <div class="page-antrian">
        <div class="page-header">
          <h2>📋 Antrian</h2>
          <button class="btn btn-primary" id="btn-add-queue">+ Tambah</button>
        </div>

        ${active.length === 0 ? `
          <div class="empty-state card">
            <p>Belum ada antrian. Tap "Tambah" untuk menambahkan. 📋</p>
          </div>
        ` : ''}

        <div class="queue-list">
          ${active.sort((a, b) => a.number - b.number).map((item, idx) => {
            const waitPos = active.filter(a => a.status === 'menunggu').indexOf(item);
            const estWait = item.status === 'menunggu' ? (waitPos >= 0 ? (waitPos) * estimateMin : 0) : 0;
            return `
              <div class="queue-card ${item.status === 'dilayani' ? 'queue-serving' : ''}">
                <div class="queue-number">${String(item.number).padStart(2, '0')}</div>
                <div class="queue-info">
                  <strong>${item.customerName || 'Walk-in'}</strong>
                  <span class="text-muted">${item.serviceName || ''}</span>
                  <span class="text-muted">Barber: ${item.barberName || 'Auto'}</span>
                  ${item.status === 'menunggu' && estWait > 0 ? `<span class="queue-wait">⏱️ ~${estWait} menit</span>` : ''}
                </div>
                <div class="queue-status">
                  <span class="badge badge-${item.status === 'dilayani' ? 'success' : 'warning'}">
                    ${item.status === 'menunggu' ? 'Menunggu' : 'Dilayani'}
                  </span>
                </div>
                <div class="queue-actions">
                  ${item.status === 'menunggu' ? `
                    <button class="btn btn-sm btn-primary" data-action="mulai" data-id="${item.id}">▶ Mulai</button>
                  ` : ''}
                  ${item.status === 'dilayani' ? `
                    <button class="btn btn-sm btn-success" data-action="selesai" data-id="${item.id}">✅ Selesai</button>
                  ` : ''}
                  <button class="btn btn-sm btn-danger" data-action="batal" data-id="${item.id}">✕</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${completed.length > 0 ? `
          <div class="card" style="margin-top:1rem;">
            <h3>Riwayat Hari Ini</h3>
            <div class="completed-queue">
              ${completed.map(item => `
                <div class="queue-completed-item">
                  <span class="queue-number-sm">${String(item.number).padStart(2, '0')}</span>
                  <span>${item.customerName || 'Walk-in'} — ${item.serviceName || ''}</span>
                  <span class="badge badge-${item.status === 'selesai' ? 'success' : 'danger'}">
                    ${item.status === 'selesai' ? 'Selesai' : 'Batal'}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Add queue button
    document.getElementById('btn-add-queue').addEventListener('click', showAddQueueModal);

    // Queue action buttons
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', function() {
        const action = this.dataset.action;
        const id = this.dataset.id;
        handleQueueAction(action, id);
      });
    });
  }

  function showAddQueueModal() {
    const html = `
      <div class="add-queue-modal">
        <h2>Tambah Antrian</h2>
        <div class="form-group">
          <label>Nama Customer</label>
          <input type="text" id="q-name" class="input" placeholder="Nama...">
        </div>
        <div class="form-group">
          <label>Layanan</label>
          <select id="q-service" class="input">
            ${services.map(s => `<option value="${s.id}" data-name="${s.name}">${s.name} — ${rp(s.price)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Barber</label>
          <select id="q-barber" class="input">
            <option value="">Auto-assign</option>
            ${barbers.map(b => `<option value="${b.id}" data-name="${b.name}">${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="q-cancel">Batal</button>
          <button class="btn btn-primary" id="q-save">Tambah</button>
        </div>
      </div>
    `;

    UI.showModal(html);

    document.getElementById('q-cancel').addEventListener('click', () => UI.closeModal());
    document.getElementById('q-save').addEventListener('click', () => {
      const name = document.getElementById('q-name').value.trim();
      const serviceSelect = document.getElementById('q-service');
      const serviceId = serviceSelect.value;
      const serviceName = serviceSelect.options[serviceSelect.selectedIndex].dataset.name || '';
      const barberSelect = document.getElementById('q-barber');
      const barberId = barberSelect.value;
      const barberName = barberId ? (barberSelect.options[barberSelect.selectedIndex].dataset.name || '') : autoAssignBarber();

      // Get current queue for numbering
      const allQueue = DB.get('queue') || [];
      const todayItems = allQueue.filter(qi => qi.date === today);
      const nextNum = todayItems.reduce((max, qi) => Math.max(max, qi.number || 0), 0) + 1;

      const newItem = {
        id: generateId('q'),
        date: today,
        number: nextNum,
        customerName: name || 'Walk-in',
        serviceId: serviceId,
        serviceName: serviceName,
        barberId: barberId || '',
        barberName: barberName,
        status: 'menunggu',
        timestamp: Date.now()
      };

      allQueue.push(newItem);
      DB.set('queue', allQueue);
      UI.closeModal();
      UI.toast(`Antrian #${String(nextNum).padStart(2, '0')} ditambahkan!`, 'success');
      render();
    });
  }

  function autoAssignBarber() {
    // Find barber with least active queue items
    const allQueue = DB.get('queue') || [];
    const activeItems = allQueue.filter(q => q.date === today && (q.status === 'menunggu' || q.status === 'dilayani'));
    
    let minCount = Infinity;
    let assignedBarber = barbers[0] || null;

    barbers.forEach(b => {
      const count = activeItems.filter(q => q.barberId === b.id).length;
      if (count < minCount) {
        minCount = count;
        assignedBarber = b;
      }
    });

    return assignedBarber ? assignedBarber.name : '';
  }

  function handleQueueAction(action, id) {
    const allQueue = DB.get('queue') || [];
    const item = allQueue.find(q => q.id === id);
    if (!item) return;

    if (action === 'mulai') {
      item.status = 'dilayani';
      item.startTime = Date.now();
      DB.set('queue', allQueue);
      UI.toast(`Melayani ${item.customerName}...`, 'info');
      render();
    } else if (action === 'selesai') {
      item.status = 'selesai';
      item.endTime = Date.now();
      DB.set('queue', allQueue);
      UI.toast(`${item.customerName} selesai! ✅`, 'success');
      
      // Ask if want to go to Kasir
      UI.showModal(`
        <div class="confirm-modal">
          <h3>Lanjut ke Kasir?</h3>
          <p>Buat transaksi untuk ${item.customerName}?</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="q-skip-kasir">Tidak</button>
            <button class="btn btn-primary" id="q-goto-kasir">Ya, ke Kasir</button>
          </div>
        </div>
      `);

      document.getElementById('q-skip-kasir').addEventListener('click', () => {
        UI.closeModal();
        render();
      });
      document.getElementById('q-goto-kasir').addEventListener('click', () => {
        UI.closeModal();
        window._kasirPrefill = {
          customerName: item.customerName,
          barberId: item.barberId,
          serviceId: item.serviceId
        };
        PangkasApp.navigate('kasir');
      });
    } else if (action === 'batal') {
      item.status = 'batal';
      DB.set('queue', allQueue);
      UI.toast('Antrian dibatalkan', 'info');
      render();
    }
  }

  render();
}
