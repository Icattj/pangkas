# Pangkas — Barbershop Management App
## Blueprint v1

### Product Identity
- **Name:** Pangkas
- **Tagline:** "Pangkas ribet, naikkan profit."
- **Type:** PWA (Progressive Web App), single-page, mobile-first
- **Target:** Indonesian barbershops (1-10 branches)
- **Storage:** localStorage + optional cloud sync
- **No backend required for v1** — pure client-side

### Architecture
```
pangkas/
├── index.html          # Entry point, shell
├── css/
│   ├── core.css        # Design tokens, reset, typography
│   ├── components.css  # Buttons, cards, modals, badges, inputs
│   └── pages.css       # Page-specific styles
├── js/
│   ├── app.js          # Router, init, state management
│   ├── db.js           # localStorage wrapper + cloud sync prep
│   ├── ui.js           # UI helpers, modal, toast, animations
│   ├── pages/
│   │   ├── login.js
│   │   ├── onboarding.js
│   │   ├── kasir.js
│   │   ├── antrian.js
│   │   ├── janji.js
│   │   ├── member.js
│   │   ├── laporan.js
│   │   ├── hutang.js
│   │   ├── belanja.js
│   │   └── admin.js
│   └── utils.js        # formatRp, dates, WA links
├── assets/
│   ├── icons/          # PWA icons
│   └── sounds/         # Queue ding, etc.
├── manifest.json
├── sw.js               # Service worker for offline
├── LICENSE
└── README.md
```

### Design System
- **Theme:** Dark (configurable later)
- **Primary:** #0ABFBC (teal)
- **Background:** #0a0a0f → #1a1a2a gradient
- **Accent Success:** #10B981
- **Accent Danger:** #EF4444
- **Accent Warning:** #F59E0B
- **Font:** Inter (UI) + JetBrains Mono (numbers/prices)
- **Border Radius:** 12px (cards), 8px (inputs), 20px (badges)
- **Bottom Navigation** (mobile pattern, 5 main tabs)
- **Swipe gestures** for tab switching

### Navigation (Bottom Nav — 5 tabs)
1. 🏠 Home (dashboard overview)
2. 💰 Kasir (POS)
3. 📋 Antrian (queue)
4. 👥 Member
5. ⚙️ Lainnya (more: janji, laporan, hutang, belanja, admin)

### Pages

#### Login
- PIN pad (4-digit)
- Shop logo + name (from settings)
- Session timeout after 15min idle
- "Powered by Pangkas" footer

#### Onboarding (first run)
- Step 1: Nama Toko + Alamat
- Step 2: Tambah Layanan pertama
- Step 3: Tambah Barber pertama
- Done → redirect to Kasir

#### Home Dashboard
- Today's revenue (big number)
- Active queue count
- Transactions today
- Next appointment
- Quick actions: + Transaksi, + Antrian, + Janji
- Barber on duty

#### Kasir
- Service grid (big touch targets)
- Add-on grid
- Cart sidebar/bottom sheet
- Customer name + member lookup
- Barber selector
- Payment modal (Cash/TF/QRIS/Hutang)
- "Seperti Biasa" button for returning members
- Discount chips
- Print struk

#### Antrian (NEW)
- Current queue list with estimated wait
- Add walk-in (name + service)
- Mark "Sedang Dilayani" / "Selesai" / "Batal"
- Auto-assign to available barber
- Queue number display (for TV/tablet mode)
- Sound notification when next

#### Janji (Appointments)
- Calendar view
- Add appointment (nama, no HP, tanggal, jam, barber, layanan)
- WA Reminder button (barber-triggered, not auto)
- Status: Menunggu / Dikonfirmasi / Selesai / Batal
- Upcoming appointments on home dashboard

#### Member
- Member list with search
- Visit dots (loyalty progress)
- Birthday tracking
- WA birthday greeting (one-tap)
- Member history (past transactions)
- Edit member details

#### Laporan
- Period tabs: Hari Ini / Minggu / Bulan / Custom
- Revenue, net, profit cards
- Barber commission breakdown
- Barber performance dashboard
- Transaction history table
- Expense summary
- Charts (bar chart for daily revenue)
- Export CSV / JSON backup / Import

#### Hutang
- Unpaid list with total
- Mark as paid
- Payment history
- Per-customer debt summary

#### Belanja
- Expense entry with category
- Qty × unit price auto-calc
- Link to add-on stock
- Category management
- Monthly summary by category
- Receipt photo capture (v2)

#### Admin / Settings
- Shop Info (nama, alamat, HP, logo, tagline)
- Barber management (add/edit/delete, PIN)
- Service management (add/edit/delete, pricing)
- Add-on management (stock, pricing)
- Commission % setting
- Member reward settings
- Data management (backup/restore/clear)
- About Pangkas (version, credits)

### Settings Data Model
```json
{
  "shop": {
    "name": "Rome Bois Barbershop",
    "address": "Jl. Raya No. 1, Balikpapan",
    "phone": "08xx-xxxx-xxxx",
    "logo": null,
    "tagline": "",
    "socials": { "instagram": "", "tiktok": "" }
  },
  "commission": 40,
  "memberVisits": 10,
  "memberReward": "1x Potong Gratis",
  "sessionTimeout": 15,
  "currency": "Rp",
  "queueEstimate": 20
}
```

### Franchise Module (v2)
- Multi-branch selector
- Consolidated P&L
- Centralized service menu
- Per-branch settings override
- Owner dashboard across all branches
