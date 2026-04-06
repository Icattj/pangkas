// member.js — Membership management
function renderMember(container) {
  const settings = DB.get('settings') || {};
  const shopName = (settings.shop && settings.shop.name) || 'Pangkas';
  const visitTarget = settings.memberVisits || 10;
  const reward = settings.memberReward || '1x Potong Gratis';

  let searchQuery = '';
  let viewMode = 'list'; // list | detail
  let selectedMemberId = null;

  function render() {
    const members = DB.get('members') || [];
    const today = new Date().toISOString().slice(0, 10);
    const todayMD = today.slice(5); // MM-DD

    // Filter by search
    let filtered = members;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = members.filter(m =>
        m.name.toLowerCase().includes(q) || (m.phone && m.phone.includes(q))
      );
    }

    // Birthday members
    const todayBirthdays = members.filter(m => m.birthday && m.birthday.slice(5) === todayMD);
    const next7 = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const md = d.toISOString().slice(5, 10);
      members.filter(m => m.birthday && m.birthday.slice(5) === md).forEach(m => next7.push(m));
    }

    if (viewMode === 'detail' && selectedMemberId) {
      renderDetail(container, selectedMemberId);
      return;
    }

    container.innerHTML = `
      <div class="page-member">
        <div class="page-header">
          <h2>👥 Member</h2>
          <button class="btn btn-primary" id="btn-add-member">+ Tambah</button>
        </div>

        <div class="search-bar">
          <input type="text" id="member-search" class="input" placeholder="🔍 Cari nama atau no HP..." value="${searchQuery}">
        </div>

        ${todayBirthdays.length > 0 ? `
          <div class="card birthday-card">
            <h3>🎂 Ulang Tahun Hari Ini!</h3>
            ${todayBirthdays.map(m => `
              <div class="birthday-item">
                <span><strong>${m.name}</strong> — Selamat Ulang Tahun! 🎉</span>
                ${m.phone ? `
                  <button class="btn btn-sm btn-outline" data-action="wa-birthday" data-id="${m.id}">📱 Kirim Ucapan</button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${next7.length > 0 ? `
          <div class="card">
            <h3>🎂 Ulang Tahun 7 Hari ke Depan</h3>
            ${next7.map(m => `
              <div class="birthday-item">
                <span>${m.name} — ${m.birthday ? m.birthday.slice(5) : ''}</span>
                ${m.phone ? `
                  <button class="btn btn-sm btn-outline" data-action="wa-birthday" data-id="${m.id}">📱 Ucapan</button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="member-list">
          ${filtered.length === 0 ? `
            <div class="empty-state"><p>Belum ada member. Tap "Tambah" untuk menambahkan.</p></div>
          ` : ''}
          ${filtered.map(m => {
            const visits = m.visits || 0;
            const progress = Math.min(visits, visitTarget);
            const isBirthday = m.birthday && m.birthday.slice(5) === todayMD;
            const canClaim = visits >= visitTarget;

            return `
              <div class="member-card card" data-id="${m.id}">
                <div class="member-main" data-action="view-detail" data-id="${m.id}">
                  <div class="member-name-row">
                    <strong>${m.name}</strong>
                    ${isBirthday ? '<span class="birthday-badge">🎂</span>' : ''}
                    ${canClaim ? '<span class="badge badge-success">🎁 Reward!</span>' : ''}
                  </div>
                  <span class="text-muted">${m.phone || 'No HP -'}</span>
                  <div class="visit-dots">
                    ${Array.from({length: visitTarget}, (_, i) => `
                      <span class="visit-dot ${i < progress ? 'filled' : ''}"></span>
                    `).join('')}
                    <span class="visit-count">${visits}/${visitTarget}</span>
                  </div>
                  <span class="text-muted text-sm">Kunjungan terakhir: ${m.lastVisit || '-'}</span>
                </div>
                <div class="member-actions">
                  <button class="btn btn-sm btn-outline" data-action="edit" data-id="${m.id}">✏️</button>
                  ${canClaim ? `<button class="btn btn-sm btn-success" data-action="claim" data-id="${m.id}">🎁 Klaim</button>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    bindEvents();
  }

  function renderDetail(container, memberId) {
    const members = DB.get('members') || [];
    const member = members.find(m => m.id === memberId);
    if (!member) { viewMode = 'list'; render(); return; }

    const transactions = DB.get('transactions') || [];
    const memberTx = transactions.filter(t => t.memberId === memberId).sort((a, b) => b.timestamp - a.timestamp);
    const totalSpent = memberTx.reduce((s, t) => s + (t.total || 0), 0);

    container.innerHTML = `
      <div class="page-member-detail">
        <div class="page-header">
          <button class="btn btn-outline" id="btn-back-member">← Kembali</button>
          <h2>${member.name}</h2>
        </div>

        <div class="card">
          <div class="detail-info">
            <p><strong>📱 No HP:</strong> ${member.phone || '-'}</p>
            <p><strong>🎂 Tanggal Lahir:</strong> ${member.birthday || '-'}</p>
            <p><strong>📊 Total Kunjungan:</strong> ${member.visits || 0}</p>
            <p><strong>💰 Total Belanja:</strong> ${rp(totalSpent)}</p>
            <p><strong>📅 Kunjungan Terakhir:</strong> ${member.lastVisit || '-'}</p>
          </div>
        </div>

        <div class="card">
          <h3>Riwayat Transaksi</h3>
          ${memberTx.length === 0 ? '<p class="text-muted">Belum ada transaksi</p>' : ''}
          ${memberTx.map(t => `
            <div class="tx-item">
              <div class="tx-info">
                <span>${t.date} ${t.time || ''}</span>
                <span class="text-muted">${t.barberName || ''} • ${t.paymentMethod || ''}</span>
                <span class="text-sm">${(t.items || []).map(i => i.name).join(', ')}</span>
              </div>
              <div class="tx-amount">${rp(t.total || 0)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('btn-back-member').addEventListener('click', () => {
      viewMode = 'list';
      selectedMemberId = null;
      render();
    });
  }

  function bindEvents() {
    // Search
    document.getElementById('member-search').addEventListener('input', function() {
      searchQuery = this.value;
      render();
    });

    // Add member
    document.getElementById('btn-add-member').addEventListener('click', () => showMemberModal());

    // Actions
    container.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        const action = this.dataset.action;
        const id = this.dataset.id;

        if (action === 'view-detail') {
          viewMode = 'detail';
          selectedMemberId = id;
          render();
        } else if (action === 'edit') {
          showMemberModal(id);
        } else if (action === 'claim') {
          claimReward(id);
        } else if (action === 'wa-birthday') {
          sendBirthdayWA(id);
        }
      });
    });
  }

  function showMemberModal(editId) {
    const members = DB.get('members') || [];
    const editing = editId ? members.find(m => m.id === editId) : null;

    const html = `
      <div class="member-modal">
        <h2>${editing ? 'Edit' : 'Tambah'} Member</h2>
        <div class="form-group">
          <label>Nama *</label>
          <input type="text" id="mem-name" class="input" placeholder="Nama member" value="${editing ? editing.name : ''}">
        </div>
        <div class="form-group">
          <label>No HP</label>
          <input type="tel" id="mem-phone" class="input" placeholder="08xx..." value="${editing ? (editing.phone || '') : ''}">
        </div>
        <div class="form-group">
          <label>Tanggal Lahir</label>
          <input type="date" id="mem-birthday" class="input" value="${editing ? (editing.birthday || '') : ''}">
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="mem-cancel">Batal</button>
          <button class="btn btn-primary" id="mem-save">Simpan</button>
        </div>
      </div>
    `;

    UI.showModal(html);

    document.getElementById('mem-cancel').addEventListener('click', () => UI.closeModal());
    document.getElementById('mem-save').addEventListener('click', () => {
      const name = document.getElementById('mem-name').value.trim();
      const phone = document.getElementById('mem-phone').value.trim();
      const birthday = document.getElementById('mem-birthday').value;

      if (!name) { UI.toast('Nama wajib diisi!', 'error'); return; }

      const allMembers = DB.get('members') || [];

      if (editing) {
        const mem = allMembers.find(m => m.id === editId);
        if (mem) {
          mem.name = name;
          mem.phone = phone;
          mem.birthday = birthday;
        }
      } else {
        allMembers.push({
          id: generateId('mem'),
          name,
          phone,
          birthday,
          visits: 0,
          totalSpent: 0,
          lastVisit: null,
          createdAt: Date.now()
        });
      }

      DB.set('members', allMembers);
      UI.closeModal();
      UI.toast(editing ? 'Member diupdate! ✅' : 'Member ditambahkan! 👥', 'success');
      render();
    });
  }

  function claimReward(memberId) {
    const allMembers = DB.get('members') || [];
    const mem = allMembers.find(m => m.id === memberId);
    if (!mem) return;

    UI.showModal(`
      <div class="confirm-modal">
        <h3>🎁 Klaim Reward</h3>
        <p><strong>${mem.name}</strong> sudah ${mem.visits} kunjungan!</p>
        <p>Reward: <strong>${reward}</strong></p>
        <p>Reset hitungan kunjungan?</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="claim-cancel">Batal</button>
          <button class="btn btn-primary" id="claim-confirm">Klaim & Reset</button>
        </div>
      </div>
    `);

    document.getElementById('claim-cancel').addEventListener('click', () => UI.closeModal());
    document.getElementById('claim-confirm').addEventListener('click', () => {
      mem.visits = 0;
      DB.set('members', allMembers);
      UI.closeModal();
      UI.toast(`Reward diklaim untuk ${mem.name}! 🎉`, 'success');
      render();
    });
  }

  function sendBirthdayWA(memberId) {
    const members = DB.get('members') || [];
    const mem = members.find(m => m.id === memberId);
    if (!mem || !mem.phone) return;

    const msg = `Halo ${mem.name}, Selamat Ulang Tahun! 🎂 Spesial buat kamu, ada hadiah dari kami di ${shopName}. Ditunggu ya!`;
    const link = waLink(mem.phone, msg);
    window.open(link, '_blank');
  }

  render();
}
