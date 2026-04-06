// janji.js — Appointments
function renderJanji(container) {
  const appointments = DB.get('appointments') || [];
  const services = (DB.get('services') || []).filter(s => s.active !== false);
  const barbers = (DB.get('barbers') || []).filter(b => b.active !== false);
  const settings = DB.get('settings') || {};
  const shopName = (settings.shop && settings.shop.name) || 'Pangkas';

  const now = new Date();
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth();
  let selectedDate = now.toISOString().slice(0, 10);

  function render() {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    // Find days with appointments
    const apptDates = {};
    appointments.forEach(a => {
      if (a.date && a.date.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`)) {
        apptDates[a.date] = (apptDates[a.date] || 0) + 1;
      }
    });

    // Calendar grid
    let calendarHTML = '';
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    calendarHTML += '<div class="cal-header-row">';
    dayNames.forEach(d => { calendarHTML += `<div class="cal-day-name">${d}</div>`; });
    calendarHTML += '</div>';

    calendarHTML += '<div class="cal-grid">';
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      calendarHTML += '<div class="cal-cell empty"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === now.toISOString().slice(0, 10);
      const isSelected = dateStr === selectedDate;
      const hasAppt = apptDates[dateStr] > 0;

      calendarHTML += `
        <div class="cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasAppt ? 'has-appt' : ''}" 
             data-date="${dateStr}">
          <span class="cal-date">${d}</span>
          ${hasAppt ? `<span class="cal-dot"></span>` : ''}
        </div>
      `;
    }
    calendarHTML += '</div>';

    // Selected date appointments
    const dayAppts = appointments
      .filter(a => a.date === selectedDate && a.status !== 'batal')
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    container.innerHTML = `
      <div class="page-janji">
        <div class="page-header">
          <h2>📅 Jadwal & Janji</h2>
          <button class="btn btn-primary" id="btn-add-appt">+ Buat Janji</button>
        </div>

        <div class="calendar-card card">
          <div class="cal-nav">
            <button class="btn btn-sm btn-outline" id="cal-prev">◀</button>
            <h3>${months[viewMonth]} ${viewYear}</h3>
            <button class="btn btn-sm btn-outline" id="cal-next">▶</button>
          </div>
          ${calendarHTML}
        </div>

        <div class="day-appointments">
          <h3>${formatDateIndo(selectedDate)}</h3>
          ${dayAppts.length === 0 ? `
            <div class="empty-state"><p>Tidak ada janji di tanggal ini</p></div>
          ` : ''}
          ${dayAppts.map(a => `
            <div class="appt-card card">
              <div class="appt-header">
                <span class="appt-time">${a.time || '--:--'}</span>
                <span class="badge badge-${getStatusColor(a.status)}">${getStatusLabel(a.status)}</span>
              </div>
              <div class="appt-body">
                <strong>${a.name}</strong>
                ${a.phone ? `<span class="text-muted">📱 ${a.phone}</span>` : ''}
                <span>${a.service || ''} ${a.barberName ? '— ' + a.barberName : ''}</span>
                ${a.notes ? `<span class="text-muted">📝 ${a.notes}</span>` : ''}
              </div>
              <div class="appt-actions">
                ${a.status === 'menunggu' ? `
                  <button class="btn btn-sm btn-primary" data-action="confirm" data-id="${a.id}">✅ Konfirmasi</button>
                ` : ''}
                ${a.status === 'dikonfirmasi' ? `
                  <button class="btn btn-sm btn-success" data-action="done" data-id="${a.id}">✅ Selesai</button>
                ` : ''}
                ${a.phone ? `
                  <button class="btn btn-sm btn-outline" data-action="wa-remind" data-id="${a.id}">📱 WA Reminder</button>
                ` : ''}
                <button class="btn btn-sm btn-danger" data-action="cancel" data-id="${a.id}">Batal</button>
                <button class="btn btn-sm btn-outline" data-action="delete" data-id="${a.id}">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    bindEvents();
  }

  function getStatusColor(s) {
    switch (s) {
      case 'menunggu': return 'warning';
      case 'dikonfirmasi': return 'info';
      case 'selesai': return 'success';
      case 'batal': return 'danger';
      default: return 'default';
    }
  }

  function getStatusLabel(s) {
    switch (s) {
      case 'menunggu': return 'Menunggu';
      case 'dikonfirmasi': return 'Dikonfirmasi';
      case 'selesai': return 'Selesai';
      case 'batal': return 'Batal';
      default: return s;
    }
  }

  function bindEvents() {
    // Calendar navigation
    document.getElementById('cal-prev').addEventListener('click', () => {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      render();
    });
    document.getElementById('cal-next').addEventListener('click', () => {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      render();
    });

    // Calendar date click
    container.querySelectorAll('.cal-cell:not(.empty)').forEach(cell => {
      cell.addEventListener('click', function() {
        selectedDate = this.dataset.date;
        render();
      });
    });

    // Add appointment
    document.getElementById('btn-add-appt').addEventListener('click', showAddApptModal);

    // Appointment actions
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', function() {
        const action = this.dataset.action;
        const id = this.dataset.id;
        handleApptAction(action, id);
      });
    });
  }

  function showAddApptModal() {
    const html = `
      <div class="add-appt-modal">
        <h2>Buat Janji Baru</h2>
        <div class="form-group">
          <label>Nama *</label>
          <input type="text" id="appt-name" class="input" placeholder="Nama customer">
        </div>
        <div class="form-group">
          <label>No HP</label>
          <input type="tel" id="appt-phone" class="input" placeholder="08xx...">
        </div>
        <div class="form-group">
          <label>Tanggal *</label>
          <input type="date" id="appt-date" class="input" value="${selectedDate}">
        </div>
        <div class="form-group">
          <label>Jam *</label>
          <input type="time" id="appt-time" class="input" value="10:00">
        </div>
        <div class="form-group">
          <label>Barber</label>
          <select id="appt-barber" class="input">
            <option value="">Belum ditentukan</option>
            ${barbers.map(b => `<option value="${b.id}" data-name="${b.name}">${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Layanan</label>
          <select id="appt-service" class="input">
            <option value="">Belum ditentukan</option>
            ${services.map(s => `<option value="${s.name}">${s.name} — ${rp(s.price)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Catatan</label>
          <input type="text" id="appt-notes" class="input" placeholder="Catatan tambahan...">
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="appt-cancel">Batal</button>
          <button class="btn btn-primary" id="appt-save">Simpan</button>
        </div>
      </div>
    `;

    UI.showModal(html);

    document.getElementById('appt-cancel').addEventListener('click', () => UI.closeModal());
    document.getElementById('appt-save').addEventListener('click', () => {
      const name = document.getElementById('appt-name').value.trim();
      const phone = document.getElementById('appt-phone').value.trim();
      const date = document.getElementById('appt-date').value;
      const time = document.getElementById('appt-time').value;
      const barberSelect = document.getElementById('appt-barber');
      const barberId = barberSelect.value;
      const barberName = barberId ? barberSelect.options[barberSelect.selectedIndex].dataset.name : '';
      const service = document.getElementById('appt-service').value;
      const notes = document.getElementById('appt-notes').value.trim();

      if (!name) { UI.toast('Nama wajib diisi!', 'error'); return; }
      if (!date) { UI.toast('Tanggal wajib diisi!', 'error'); return; }
      if (!time) { UI.toast('Jam wajib diisi!', 'error'); return; }

      const allAppts = DB.get('appointments') || [];
      allAppts.push({
        id: generateId('appt'),
        name,
        phone,
        date,
        time,
        barberId,
        barberName,
        service,
        notes,
        status: 'menunggu',
        timestamp: Date.now()
      });
      DB.set('appointments', allAppts);

      UI.closeModal();
      UI.toast('Janji berhasil dibuat! 📅', 'success');

      // Refresh appointments array
      appointments.length = 0;
      allAppts.forEach(a => appointments.push(a));
      selectedDate = date;
      render();
    });
  }

  function handleApptAction(action, id) {
    const allAppts = DB.get('appointments') || [];
    const appt = allAppts.find(a => a.id === id);
    if (!appt) return;

    if (action === 'confirm') {
      appt.status = 'dikonfirmasi';
      DB.set('appointments', allAppts);
      UI.toast('Janji dikonfirmasi! ✅', 'success');
    } else if (action === 'done') {
      appt.status = 'selesai';
      DB.set('appointments', allAppts);
      UI.toast('Janji selesai! ✅', 'success');
    } else if (action === 'cancel') {
      appt.status = 'batal';
      DB.set('appointments', allAppts);
      UI.toast('Janji dibatalkan', 'info');
    } else if (action === 'delete') {
      const idx = allAppts.findIndex(a => a.id === id);
      if (idx >= 0) {
        allAppts.splice(idx, 1);
        DB.set('appointments', allAppts);
        UI.toast('Janji dihapus', 'info');
      }
    } else if (action === 'wa-remind') {
      const msg = `Halo ${appt.name}! Pengingat: jadwal potong kamu di ${shopName} hari ini jam ${appt.time}. Ditunggu ya! 💈`;
      const link = waLink(appt.phone, msg);
      window.open(link, '_blank');
      return;
    }

    // Refresh
    appointments.length = 0;
    allAppts.forEach(a => appointments.push(a));
    render();
  }

  // Use formatDateIndo from home.js or define locally
  if (typeof formatDateIndo === 'undefined') {
    window.formatDateIndo = function(dateStr) {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const d = new Date(dateStr + 'T00:00:00');
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };
  }

  render();
}
