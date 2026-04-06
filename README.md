# 💈 Pangkas

**Pangkas ribet, naikkan profit.**

Aplikasi manajemen barbershop yang lengkap — POS, antrian, member, laporan, dan lainnya. Mobile-first, works offline, no backend required.

![License](https://img.shields.io/badge/license-MIT-blue)
![PWA](https://img.shields.io/badge/PWA-ready-brightgreen)
![No Backend](https://img.shields.io/badge/backend-none_required-orange)

## ✨ Features

### 💰 Kasir / POS
- Tap-to-add service & product grid
- Multi-payment: Cash, Transfer, QRIS, Hutang
- Quick Reorder — tombol "Seperti Biasa" untuk langganan
- Diskon chips (10%, 20%, 50%, custom)
- Cetak struk otomatis

### 📋 Antrian
- Walk-in queue management
- Estimasi waktu tunggu otomatis
- Auto-assign barber
- Status tracking: Menunggu → Dilayani → Selesai
- Queue reset harian

### 📅 Janji Temu
- Calendar view dengan appointment tracking
- WhatsApp reminder (barber-triggered, bukan auto-spam)
- Status: Menunggu / Dikonfirmasi / Selesai / Batal

### 👥 Member & Loyalty
- Program loyalty kunjungan (visit dots)
- Birthday tracking + WA greeting otomatis
- Riwayat transaksi per member
- Reward claim saat target tercapai

### 📊 Laporan
- Dashboard: pendapatan, net, profit, transaksi
- Komisi per barber
- Barber performance tracking
- Period filter: Hari Ini / Minggu / Bulan / Semua
- Bar chart revenue harian (pure CSS)
- Export CSV & JSON backup

### 📒 Hutang
- Track piutang pelanggan
- Mark as lunas
- Otomatis update komisi saat dibayar

### 🛒 Belanja
- Catat pengeluaran dengan kategori
- Link ke stok add-on (otomatis tambah stok)
- Breakdown per kategori
- Edit/delete expense

### ⚙️ Admin
- Info toko (nama, alamat, HP — muncul di struk & WA)
- Manajemen barber & PIN
- Layanan & harga
- Produk add-on & stok
- Pengaturan komisi, member, antrian
- Backup & restore data

## 🚀 Quick Start

### Option 1: Langsung pakai (hosted)
Buka di browser HP: **https://your-domain.com/pangkas/**

### Option 2: Self-host
```bash
# Clone repo
git clone https://github.com/Icattj/pangkas.git
cd pangkas

# Serve with any static file server
npx serve .
# or
python3 -m http.server 8080
```

Buka `http://localhost:8080` di browser.

### Option 3: Install sebagai PWA
1. Buka di Chrome/Safari di HP
2. Tap "Add to Home Screen"
3. Done — works offline!

## 📱 First Run

1. **Onboarding wizard** — isi nama toko, tambah layanan, tambah barber
2. **Login** — masukkan PIN 4 digit
3. **Mulai** — langsung ke dashboard

Default PIN admin: `1234`

## 🏗️ Tech Stack

- **Frontend:** Vanilla JS + CSS (no framework, no build step)
- **Storage:** localStorage (client-side)
- **Architecture:** Single-page PWA, hash-based routing
- **Offline:** Service Worker with cache-first strategy
- **Backend:** None required ✅

## 📂 Project Structure

```
pangkas/
├── index.html          # App shell
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── css/
│   ├── core.css        # Design tokens & reset
│   ├── components.css  # Reusable UI components
│   └── pages.css       # Page-specific styles
└── js/
    ├── db.js           # Data layer (localStorage)
    ├── utils.js        # Utilities (currency, dates, WA links)
    ├── ui.js           # UI framework (modals, toasts, nav)
    ├── app.js          # Router & state management
    └── pages/
        ├── login.js
        ├── onboarding.js
        ├── home.js
        ├── kasir.js
        ├── antrian.js
        ├── janji.js
        ├── member.js
        ├── laporan.js
        ├── hutang.js
        ├── belanja.js
        └── admin.js
```

## 🎨 Design

- Dark theme with teal (#0ABFBC) accent
- Bottom navigation (mobile pattern)
- Touch-optimized (44px minimum targets)
- Indonesian language throughout
- Responsive: mobile → tablet → desktop

## 🔒 Security

- PIN-based authentication per user
- Admin vs Barber role separation
- Session timeout (configurable)
- All data stays on device (no server calls)

## 📋 Roadmap

- [x] POS / Kasir
- [x] Antrian walk-in
- [x] Appointments + WA reminder
- [x] Member loyalty + birthday
- [x] Financial reports
- [x] Hutang tracking
- [x] Expense tracking
- [x] Multi-user PIN auth
- [ ] Cloud sync (multi-device)
- [ ] Multi-branch / franchise module
- [ ] Online booking link
- [ ] Promo & voucher engine
- [ ] Galeri potongan rambut
- [ ] Receipt photo capture

## 📄 License

MIT © [Sentra Technology](https://github.com/Icattj)

---

**Pangkas** — Barbershop management, simplified. 💈
