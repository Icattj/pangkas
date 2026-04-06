// login.js — Login page with PIN pad
function renderLogin(container) {
  const settings = DB.get('settings') || {};
  const shopName = (settings.shop && settings.shop.name) ? settings.shop.name : 'Pangkas';
  let pin = '';

  container.innerHTML = `
    <div class="login-page">
      <div class="login-header">
        <div class="login-logo">💈</div>
        <h1 class="login-shop-name">${shopName}</h1>
        <p class="login-subtitle">Masukkan PIN untuk masuk</p>
      </div>

      <div class="pin-dots" id="pin-dots">
        <span class="pin-dot" data-i="0"></span>
        <span class="pin-dot" data-i="1"></span>
        <span class="pin-dot" data-i="2"></span>
        <span class="pin-dot" data-i="3"></span>
      </div>

      <div class="pin-error" id="pin-error" style="display:none;">PIN salah!</div>

      <div class="pin-pad" id="pin-pad">
        <button class="pin-key" data-val="1">1</button>
        <button class="pin-key" data-val="2">2</button>
        <button class="pin-key" data-val="3">3</button>
        <button class="pin-key" data-val="4">4</button>
        <button class="pin-key" data-val="5">5</button>
        <button class="pin-key" data-val="6">6</button>
        <button class="pin-key" data-val="7">7</button>
        <button class="pin-key" data-val="8">8</button>
        <button class="pin-key" data-val="9">9</button>
        <button class="pin-key pin-key-empty" disabled></button>
        <button class="pin-key" data-val="0">0</button>
        <button class="pin-key pin-key-del" data-val="del">⌫</button>
      </div>

      <div class="login-footer">Powered by Pangkas 💈</div>
    </div>
  `;

  function updateDots() {
    const dots = container.querySelectorAll('.pin-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('filled', i < pin.length);
    });
  }

  function shakeAndClear() {
    const dotsEl = document.getElementById('pin-dots');
    const errEl = document.getElementById('pin-error');
    dotsEl.classList.add('shake');
    errEl.style.display = 'block';
    if (navigator.vibrate) navigator.vibrate(300);
    setTimeout(() => {
      dotsEl.classList.remove('shake');
      errEl.style.display = 'none';
      pin = '';
      updateDots();
    }, 800);
  }

  function attemptLogin() {
    const barbers = DB.get('barbers') || [];
    const matched = barbers.find(b => b.pin === pin);

    if (matched) {
      currentUser = matched;
      DB.set('currentUser', matched);

      // Check first run
      const settings = DB.get('settings');
      const services = DB.get('services') || [];
      if (!settings || !settings.shop || !settings.shop.name || services.length === 0) {
        PangkasApp.navigate('onboarding');
      } else {
        PangkasApp.navigate('home');
      }
    } else {
      // If no barbers exist, check for master PIN "0000"
      if (barbers.length === 0 && pin === '0000') {
        currentUser = { id: 'admin', name: 'Admin', role: 'admin', pin: '0000' };
        DB.set('currentUser', currentUser);
        PangkasApp.navigate('onboarding');
      } else {
        shakeAndClear();
      }
    }
  }

  container.querySelector('#pin-pad').addEventListener('click', function(e) {
    const btn = e.target.closest('.pin-key');
    if (!btn || btn.disabled) return;

    const val = btn.dataset.val;

    if (val === 'del') {
      pin = pin.slice(0, -1);
      updateDots();
      return;
    }

    if (pin.length >= 4) return;
    pin += val;
    updateDots();

    if (pin.length === 4) {
      setTimeout(attemptLogin, 200);
    }
  });
}
