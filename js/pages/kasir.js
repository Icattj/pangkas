// kasir.js — POS / Cashier
function renderKasir(container) {
  const services = (DB.get('services') || []).filter(s => s.active !== false);
  const addons = (DB.get('addons') || []).filter(a => a.active !== false);
  const barbers = (DB.get('barbers') || []).filter(b => b.active !== false);
  const members = DB.get('members') || [];
  const settings = DB.get('settings') || {};

  let cart = [];
  let selectedBarber = barbers.length > 0 ? barbers[0].id : '';
  let customerName = '';
  let selectedMember = null;
  let discountPct = 0;
  let customDiscount = 0;

  // Check if coming from queue with pre-filled data
  const prefill = window._kasirPrefill || null;
  if (prefill) {
    customerName = prefill.customerName || '';
    selectedBarber = prefill.barberId || selectedBarber;
    if (prefill.serviceId) {
      const svc = services.find(s => s.id === prefill.serviceId);
      if (svc) cart.push({ id: svc.id, name: svc.name, price: svc.price, qty: 1, type: 'service' });
    }
    window._kasirPrefill = null;
  }

  function getTotal() {
    const subtotal = cart.reduce((s, item) => s + (item.price * item.qty), 0);
    const disc = discountPct > 0 ? Math.round(subtotal * discountPct / 100) : customDiscount;
    return Math.max(0, subtotal - disc);
  }

  function getSubtotal() {
    return cart.reduce((s, item) => s + (item.price * item.qty), 0);
  }

  function getDiscount() {
    const subtotal = getSubtotal();
    return discountPct > 0 ? Math.round(subtotal * discountPct / 100) : customDiscount;
  }

  function render() {
    const barber = barbers.find(b => b.id === selectedBarber);
    const barberName = barber ? barber.name : '';

    container.innerHTML = `
      <div class="page-kasir">
        <div class="kasir-header">
          <h2>💰 Kasir</h2>
        </div>

        <div class="kasir-services">
          <h3>Layanan</h3>
          <div class="service-grid" id="svc-grid">
            ${services.map(s => `
              <button class="svc-btn" data-id="${s.id}" data-name="${s.name}" data-price="${s.price}" data-type="service">
                <span class="svc-name">${s.name}</span>
                <span class="svc-price">${rp(s.price)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        ${addons.length > 0 ? `
          <div class="kasir-addons">
            <h3>Add-on / Produk</h3>
            <div class="service-grid" id="addon-grid">
              ${addons.map(a => `
                <button class="svc-btn addon-btn ${(a.stock || 0) <= 0 ? 'out-of-stock' : ''}" 
                  data-id="${a.id}" data-name="${a.name}" data-price="${a.price}" data-type="addon"
                  ${(a.stock || 0) <= 0 ? 'disabled' : ''}>
                  <span class="svc-name">${a.name}</span>
                  <span class="svc-price">${rp(a.price)}</span>
                  <span class="svc-stock">Stok: ${a.stock || 0}</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="kasir-cart" id="kasir-cart">
          <h3>🛒 Keranjang</h3>

          <div class="cart-customer">
            <div class="form-group">
              <label>Nama Customer</label>
              <input type="text" id="customer-name" class="input" placeholder="Nama / cari member..." value="${customerName}" autocomplete="off">
              <div class="autocomplete-list" id="member-autocomplete" style="display:none;"></div>
            </div>
            <div class="form-group">
              <label>Barber</label>
              <select id="barber-select" class="input">
                ${barbers.map(b => `<option value="${b.id}" ${b.id === selectedBarber ? 'selected' : ''}>${b.name}</option>`).join('')}
              </select>
            </div>
            ${selectedMember ? `
              <button class="btn btn-outline btn-sm" id="btn-seperti-biasa">🔄 Seperti Biasa</button>
            ` : ''}
          </div>

          ${cart.length > 0 ? `
            <div class="cart-items">
              ${cart.map((item, idx) => `
                <div class="cart-item">
                  <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">${rp(item.price)}</span>
                  </div>
                  <div class="cart-item-actions">
                    <button class="btn-qty" data-action="minus" data-idx="${idx}">−</button>
                    <span class="cart-item-qty">${item.qty}</span>
                    <button class="btn-qty" data-action="plus" data-idx="${idx}">+</button>
                    <button class="btn-remove" data-idx="${idx}">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="discount-section">
              <label>Diskon</label>
              <div class="discount-chips">
                <button class="chip ${discountPct === 0 && customDiscount === 0 ? 'active' : ''}" data-disc="0">Tanpa</button>
                <button class="chip ${discountPct === 10 ? 'active' : ''}" data-disc="10">10%</button>
                <button class="chip ${discountPct === 20 ? 'active' : ''}" data-disc="20">20%</button>
                <button class="chip ${discountPct === 50 ? 'active' : ''}" data-disc="50">50%</button>
                <button class="chip ${discountPct === -1 ? 'active' : ''}" data-disc="custom">Custom</button>
              </div>
            </div>

            <div class="cart-summary">
              <div class="cart-line"><span>Subtotal</span><span>${rp(getSubtotal())}</span></div>
              ${getDiscount() > 0 ? `<div class="cart-line discount-line"><span>Diskon</span><span>-${rp(getDiscount())}</span></div>` : ''}
              <div class="cart-line cart-total"><span>Total</span><span>${rp(getTotal())}</span></div>
            </div>

            <button class="btn btn-primary btn-lg btn-block" id="btn-bayar">Bayar ${rp(getTotal())}</button>
          ` : `
            <div class="empty-cart">
              <p>Ketuk layanan untuk menambahkan ke keranjang</p>
            </div>
          `}
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Service grid click
    container.querySelectorAll('.svc-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        const name = this.dataset.name;
        const price = parseInt(this.dataset.price);
        const type = this.dataset.type;
        addToCart(id, name, price, type);
      });
    });

    // Cart qty buttons
    container.querySelectorAll('.btn-qty').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.dataset.idx);
        const action = this.dataset.action;
        if (action === 'plus') cart[idx].qty++;
        else if (action === 'minus') {
          cart[idx].qty--;
          if (cart[idx].qty <= 0) cart.splice(idx, 1);
        }
        render();
      });
    });

    // Cart remove buttons
    container.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.dataset.idx);
        cart.splice(idx, 1);
        render();
      });
    });

    // Customer name autocomplete
    const nameInput = document.getElementById('customer-name');
    if (nameInput) {
      nameInput.addEventListener('input', function() {
        customerName = this.value;
        const q = this.value.toLowerCase().trim();
        const acList = document.getElementById('member-autocomplete');
        if (q.length < 2) {
          acList.style.display = 'none';
          selectedMember = null;
          return;
        }
        const matches = members.filter(m =>
          m.name.toLowerCase().includes(q) || (m.phone && m.phone.includes(q))
        ).slice(0, 5);
        if (matches.length > 0) {
          acList.innerHTML = matches.map(m => `
            <div class="ac-item" data-id="${m.id}" data-name="${m.name}">
              ${m.name} <span class="text-muted">${m.phone || ''}</span>
            </div>
          `).join('');
          acList.style.display = 'block';
          acList.querySelectorAll('.ac-item').forEach(item => {
            item.addEventListener('click', function() {
              const mid = this.dataset.id;
              const mname = this.dataset.name;
              selectedMember = members.find(m => m.id === mid) || null;
              customerName = mname;
              nameInput.value = mname;
              acList.style.display = 'none';
              render();
            });
          });
        } else {
          acList.style.display = 'none';
        }
      });
    }

    // Barber select
    const barberSel = document.getElementById('barber-select');
    if (barberSel) {
      barberSel.addEventListener('change', function() {
        selectedBarber = this.value;
      });
    }

    // Seperti Biasa
    const sbBtn = document.getElementById('btn-seperti-biasa');
    if (sbBtn) {
      sbBtn.addEventListener('click', function() {
        if (!selectedMember) return;
        const allTx = DB.get('transactions') || [];
        const memberTx = allTx.filter(t => t.memberId === selectedMember.id).sort((a, b) => b.timestamp - a.timestamp);
        if (memberTx.length > 0) {
          const lastTx = memberTx[0];
          cart = (lastTx.items || []).map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty || 1,
            type: item.type || 'service'
          }));
          if (lastTx.barberId) selectedBarber = lastTx.barberId;
          UI.toast('Order terakhir dimuat! 🔄', 'success');
          render();
        } else {
          UI.toast('Belum ada riwayat transaksi', 'info');
        }
      });
    }

    // Discount chips
    container.querySelectorAll('.discount-chips .chip').forEach(chip => {
      chip.addEventListener('click', function() {
        const disc = this.dataset.disc;
        if (disc === 'custom') {
          discountPct = -1;
          const val = prompt('Masukkan jumlah diskon (Rp):');
          if (val && !isNaN(val)) {
            customDiscount = parseInt(val);
            discountPct = 0;
          } else {
            discountPct = 0;
            customDiscount = 0;
          }
        } else {
          discountPct = parseInt(disc);
          customDiscount = 0;
        }
        render();
      });
    });

    // Bayar button
    const bayarBtn = document.getElementById('btn-bayar');
    if (bayarBtn) {
      bayarBtn.addEventListener('click', showPaymentModal);
    }
  }

  function addToCart(id, name, price, type) {
    const existing = cart.find(c => c.id === id);
    if (existing) {
      // For addons, check stock
      if (type === 'addon') {
        const addon = addons.find(a => a.id === id);
        if (addon && existing.qty >= (addon.stock || 0)) {
          UI.toast('Stok tidak cukup!', 'error');
          return;
        }
      }
      existing.qty++;
    } else {
      cart.push({ id, name, price, qty: 1, type });
    }
    render();
  }

  function showPaymentModal() {
    const total = getTotal();
    const html = `
      <div class="payment-modal">
        <h2>Pembayaran</h2>
        <div class="payment-total">${rp(total)}</div>
        
        <div class="payment-methods">
          <button class="payment-method-btn" data-method="cash">
            💵 Cash
          </button>
          <button class="payment-method-btn" data-method="transfer">
            🏦 Transfer
          </button>
          <button class="payment-method-btn" data-method="qris">
            📱 QRIS
          </button>
          <button class="payment-method-btn" data-method="hutang">
            📝 Hutang
          </button>
        </div>

        <div id="hutang-note" style="display:none;" class="form-group">
          <label>Catatan Hutang</label>
          <input type="text" id="hutang-note-input" class="input" placeholder="Catatan...">
        </div>

        <div class="payment-actions">
          <button class="btn btn-secondary" id="pay-cancel">Batal</button>
          <button class="btn btn-primary" id="pay-confirm" disabled>Konfirmasi</button>
        </div>
      </div>
    `;

    UI.showModal(html);

    let selectedMethod = '';

    document.querySelectorAll('.payment-method-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedMethod = this.dataset.method;
        document.getElementById('pay-confirm').disabled = false;
        document.getElementById('hutang-note').style.display = selectedMethod === 'hutang' ? 'block' : 'none';
      });
    });

    document.getElementById('pay-cancel').addEventListener('click', () => UI.closeModal());

    document.getElementById('pay-confirm').addEventListener('click', () => {
      if (!selectedMethod) return;
      const hutangNote = selectedMethod === 'hutang' ?
        (document.getElementById('hutang-note-input') || {}).value || '' : '';
      processPayment(selectedMethod, hutangNote);
    });
  }

  function processPayment(method, hutangNote) {
    const barber = barbers.find(b => b.id === selectedBarber);
    const commission = settings.commission || 40;
    const total = getTotal();
    const commissionAmount = Math.round(total * commission / 100);

    const tx = {
      id: generateId('tx'),
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      timestamp: Date.now(),
      customerName: customerName || 'Walk-in',
      memberId: selectedMember ? selectedMember.id : null,
      barberId: selectedBarber,
      barberName: barber ? barber.name : '',
      items: cart.map(c => ({ id: c.id, name: c.name, price: c.price, qty: c.qty, type: c.type })),
      subtotal: getSubtotal(),
      discount: getDiscount(),
      discountPct: discountPct > 0 ? discountPct : 0,
      total: total,
      commission: commissionAmount,
      paymentMethod: method,
      hutangNote: hutangNote,
      paid: method !== 'hutang'
    };

    // Save transaction
    const transactions = DB.get('transactions') || [];
    transactions.push(tx);
    DB.set('transactions', transactions);

    // Update addon stock
    cart.forEach(item => {
      if (item.type === 'addon') {
        const allAddons = DB.get('addons') || [];
        const addon = allAddons.find(a => a.id === item.id);
        if (addon) {
          addon.stock = Math.max(0, (addon.stock || 0) - item.qty);
          DB.set('addons', allAddons);
        }
      }
    });

    // Update member visits
    if (selectedMember) {
      const allMembers = DB.get('members') || [];
      const mem = allMembers.find(m => m.id === selectedMember.id);
      if (mem) {
        mem.visits = (mem.visits || 0) + 1;
        mem.lastVisit = new Date().toISOString().slice(0, 10);
        mem.totalSpent = (mem.totalSpent || 0) + total;
        DB.set('members', allMembers);
      }
    }

    UI.closeModal();

    // Show receipt option
    showReceiptModal(tx);
  }

  function showReceiptModal(tx) {
    const shop = (settings.shop || {});
    const html = `
      <div class="receipt-modal">
        <h2>✅ Transaksi Berhasil!</h2>
        <div class="receipt" id="receipt-content">
          <div class="receipt-header">
            <strong>${shop.name || 'Pangkas'}</strong><br>
            ${shop.address || ''}<br>
            ${shop.phone || ''}
          </div>
          <div class="receipt-divider">================================</div>
          <div class="receipt-date">${tx.date} ${tx.time}</div>
          <div class="receipt-barber">Barber: ${tx.barberName}</div>
          <div class="receipt-customer">Customer: ${tx.customerName}</div>
          <div class="receipt-divider">--------------------------------</div>
          ${tx.items.map(item => `
            <div class="receipt-item">
              <span>${item.name} x${item.qty}</span>
              <span>${rp(item.price * item.qty)}</span>
            </div>
          `).join('')}
          <div class="receipt-divider">--------------------------------</div>
          ${tx.discount > 0 ? `
            <div class="receipt-item"><span>Subtotal</span><span>${rp(tx.subtotal)}</span></div>
            <div class="receipt-item"><span>Diskon</span><span>-${rp(tx.discount)}</span></div>
          ` : ''}
          <div class="receipt-item receipt-total">
            <span><strong>TOTAL</strong></span>
            <span><strong>${rp(tx.total)}</strong></span>
          </div>
          <div class="receipt-payment">Bayar: ${tx.paymentMethod.toUpperCase()}</div>
          ${tx.paymentMethod === 'hutang' ? `<div class="receipt-hutang">⚠️ HUTANG${tx.hutangNote ? ': ' + tx.hutangNote : ''}</div>` : ''}
          <div class="receipt-divider">================================</div>
          <div class="receipt-footer">Terima kasih! 💈</div>
        </div>
        <div class="receipt-actions">
          <button class="btn btn-outline" id="btn-print-struk">🖨️ Print Struk</button>
          <button class="btn btn-primary" id="btn-done-tx">Selesai</button>
        </div>
      </div>
    `;

    UI.showModal(html);

    document.getElementById('btn-print-struk').addEventListener('click', () => {
      const content = document.getElementById('receipt-content');
      const win = window.open('', '_blank', 'width=300,height=600');
      win.document.write(`<html><head><title>Struk</title><style>
        body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:10px;}
        .receipt-item{display:flex;justify-content:space-between;}
        .receipt-header{text-align:center;margin-bottom:10px;}
        .receipt-footer{text-align:center;margin-top:10px;}
        .receipt-divider{text-align:center;color:#999;}
      </style></head><body>${content.innerHTML}</body></html>`);
      win.document.close();
      win.print();
    });

    document.getElementById('btn-done-tx').addEventListener('click', () => {
      UI.closeModal();
      cart = [];
      customerName = '';
      selectedMember = null;
      discountPct = 0;
      customDiscount = 0;
      render();
      UI.toast('Transaksi selesai! 🎉', 'success');
    });
  }

  render();
}
