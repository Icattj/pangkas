// onboarding.js — First-run onboarding wizard
function renderOnboarding(container) {
  let step = 1;
  const data = {
    shopName: '',
    shopAddress: '',
    shopPhone: '',
    serviceName: '',
    servicePrice: '',
    barberName: '',
    barberPin: '',
    barberRole: 'admin'
  };

  function render() {
    container.innerHTML = `
      <div class="onboarding-page">
        <div class="onboarding-header">
          <h1>Selamat Datang di Pangkas 💈</h1>
          <p>Atur toko kamu dalam 3 langkah mudah</p>
          <div class="step-dots">
            <span class="step-dot ${step >= 1 ? 'active' : ''}">1</span>
            <span class="step-dot ${step >= 2 ? 'active' : ''}">2</span>
            <span class="step-dot ${step >= 3 ? 'active' : ''}">3</span>
          </div>
        </div>

        <div class="onboarding-body">
          ${step === 1 ? renderStep1() : ''}
          ${step === 2 ? renderStep2() : ''}
          ${step === 3 ? renderStep3() : ''}
        </div>

        <div class="onboarding-actions">
          ${step > 1 ? '<button class="btn btn-secondary" id="ob-back">← Kembali</button>' : '<div></div>'}
          ${step < 3 ? `<button class="btn btn-primary" id="ob-next">Lanjut →</button>` : ''}
          ${step === 3 ? `<button class="btn btn-primary" id="ob-finish">Mulai Pangkas! 🚀</button>` : ''}
        </div>
      </div>
    `;

    bindEvents();
  }

  function renderStep1() {
    return `
      <div class="onboarding-step">
        <h2>📍 Info Toko</h2>
        <div class="form-group">
          <label>Nama Toko *</label>
          <input type="text" id="ob-shop-name" class="input" placeholder="Contoh: Rome Bois Barbershop" value="${data.shopName}">
        </div>
        <div class="form-group">
          <label>Alamat</label>
          <input type="text" id="ob-shop-address" class="input" placeholder="Jl. Raya No. 1, Balikpapan" value="${data.shopAddress}">
        </div>
        <div class="form-group">
          <label>No HP / WhatsApp</label>
          <input type="tel" id="ob-shop-phone" class="input" placeholder="08xx-xxxx-xxxx" value="${data.shopPhone}">
        </div>
      </div>
    `;
  }

  function renderStep2() {
    return `
      <div class="onboarding-step">
        <h2>✂️ Layanan Pertama</h2>
        <p class="text-muted">Bisa ditambah lagi nanti di pengaturan</p>
        <div class="form-group">
          <label>Nama Layanan</label>
          <input type="text" id="ob-svc-name" class="input" placeholder="Contoh: Potong Rambut" value="${data.serviceName}">
        </div>
        <div class="form-group">
          <label>Harga (Rp)</label>
          <input type="number" id="ob-svc-price" class="input" placeholder="30000" value="${data.servicePrice}">
        </div>
        <button class="btn btn-outline btn-sm" id="ob-skip-svc">Pakai default (Potong Rambut Rp 30.000)</button>
      </div>
    `;
  }

  function renderStep3() {
    return `
      <div class="onboarding-step">
        <h2>💈 Barber Pertama</h2>
        <p class="text-muted">Ini juga jadi akun admin utama</p>
        <div class="form-group">
          <label>Nama Barber *</label>
          <input type="text" id="ob-barber-name" class="input" placeholder="Nama kamu" value="${data.barberName}">
        </div>
        <div class="form-group">
          <label>PIN (4 digit) *</label>
          <input type="number" id="ob-barber-pin" class="input" placeholder="1234" maxlength="4" value="${data.barberPin}">
        </div>
        <div class="form-group">
          <label>Role</label>
          <select id="ob-barber-role" class="input">
            <option value="admin" ${data.barberRole === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="barber" ${data.barberRole === 'barber' ? 'selected' : ''}>Barber</option>
          </select>
        </div>
      </div>
    `;
  }

  function saveStepData() {
    if (step === 1) {
      data.shopName = (document.getElementById('ob-shop-name') || {}).value || '';
      data.shopAddress = (document.getElementById('ob-shop-address') || {}).value || '';
      data.shopPhone = (document.getElementById('ob-shop-phone') || {}).value || '';
    } else if (step === 2) {
      data.serviceName = (document.getElementById('ob-svc-name') || {}).value || '';
      data.servicePrice = (document.getElementById('ob-svc-price') || {}).value || '';
    } else if (step === 3) {
      data.barberName = (document.getElementById('ob-barber-name') || {}).value || '';
      data.barberPin = (document.getElementById('ob-barber-pin') || {}).value || '';
      data.barberRole = (document.getElementById('ob-barber-role') || {}).value || 'admin';
    }
  }

  function bindEvents() {
    const backBtn = document.getElementById('ob-back');
    const nextBtn = document.getElementById('ob-next');
    const finishBtn = document.getElementById('ob-finish');
    const skipBtn = document.getElementById('ob-skip-svc');

    if (backBtn) backBtn.addEventListener('click', () => {
      saveStepData();
      step--;
      render();
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
      saveStepData();
      if (step === 1 && !data.shopName.trim()) {
        UI.toast('Nama toko wajib diisi!', 'error');
        return;
      }
      step++;
      render();
    });

    if (skipBtn) skipBtn.addEventListener('click', () => {
      data.serviceName = 'Potong Rambut';
      data.servicePrice = '30000';
      step++;
      render();
    });

    if (finishBtn) finishBtn.addEventListener('click', () => {
      saveStepData();
      if (!data.barberName.trim()) {
        UI.toast('Nama barber wajib diisi!', 'error');
        return;
      }
      if (!data.barberPin || data.barberPin.length !== 4) {
        UI.toast('PIN harus 4 digit!', 'error');
        return;
      }
      finishOnboarding();
    });
  }

  function finishOnboarding() {
    // Save settings
    const settings = DB.get('settings') || {};
    settings.shop = {
      name: data.shopName,
      address: data.shopAddress,
      phone: data.shopPhone,
      logo: null,
      tagline: ''
    };
    settings.commission = settings.commission || 40;
    settings.memberVisits = settings.memberVisits || 10;
    settings.memberReward = settings.memberReward || '1x Potong Gratis';
    settings.sessionTimeout = settings.sessionTimeout || 15;
    settings.queueEstimate = settings.queueEstimate || 20;
    DB.set('settings', settings);

    // Save service
    const services = DB.get('services') || [];
    if (data.serviceName.trim()) {
      services.push({
        id: generateId('svc'),
        name: data.serviceName.trim(),
        price: parseInt(data.servicePrice) || 30000,
        active: true
      });
    }
    if (services.length === 0) {
      services.push({
        id: generateId('svc'),
        name: 'Potong Rambut',
        price: 30000,
        active: true
      });
    }
    DB.set('services', services);

    // Save barber
    const barbers = DB.get('barbers') || [];
    const newBarber = {
      id: generateId('brb'),
      name: data.barberName.trim(),
      pin: data.barberPin,
      role: data.barberRole,
      active: true
    };
    barbers.push(newBarber);
    DB.set('barbers', barbers);

    // Set current user
    currentUser = newBarber;
    DB.set('currentUser', newBarber);

    UI.toast('Toko berhasil diatur! 🎉', 'success');
    PangkasApp.navigate('home');
  }

  render();
}
