# ORCA POS — On-site Recycler Cash Application

> Sesami SafePay RC5000 Integration · v1.2.0

A full-featured Point of Sale web application with native integration with the **Sesami SafePay RC5000** cash recycler. Designed for touch screens on **Linux ARM64 i.MX8 boards** (Yocto), and fully compatible with Windows and macOS for development.

---

## Table of Contents

- [What's New in v1.2.0](#whats-new-in-v120)
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Default Credentials](#default-credentials)
- [RC5000 Integration](#rc5000-integration)
- [Refund / Payout Flow](#refund--payout-flow)
- [Multi-Device Architecture](#multi-device-architecture)
- [Transaction Reporting](#transaction-reporting)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [Manager Panel](#manager-panel)
- [Theme System](#theme-system)
- [Deployment on i.MX8 / Yocto Linux](#deployment-on-imx8--yocto-linux)
- [Known Limitations](#known-limitations)

---

## What's New in v1.2.0

### SQLite Database Migration
The flat-file `db.json` database has been replaced with **SQLite via `better-sqlite3`**. All data is stored in `server/data/orca.db`. Schema migrations run automatically on server start — no manual steps needed when upgrading from v1.0.0.

### Multi-Device RC5000 Support
The system now supports **multiple RC5000 devices** in a single store. Cashiers select a device at login. Devices are managed from the Manager Panel. Each device maintains its own session independently, preventing one POS terminal from disrupting another's active transaction.

### RC5000 Bearer Token Persistence
Bearer tokens are **persisted to SQLite** after every successful login. If the server restarts mid-session, the next operation automatically recovers by using the saved token to cancel any stuck operation before retrying login.

### Refund / Payout (RC5000 type 5 — PayoutAmount)
Authorized users can now process **refunds** from the cashier screen via two workflows:
- **Cart refund**: add items to the cart, enable the refund toggle — the RC5000 dispenses the amount.
- **Manual amount**: enter a custom amount with an on-screen numeric keypad (with optional reason).

The refund toggle is only visible to users with the **can_refund** permission. Managers always have this; it is configurable per cashier from the Manager Panel.

### Manual Payment Mode
Stores without an RC5000 can operate in **manual mode** — the checkout flow skips all device steps and records the transaction directly.

### Device Error Recovery UI
When the RC5000 is unavailable, the checkout modal offers: **Retry**, **Manual payment/refund**, or **Cancel sale**.

### Force Reset (Manager Panel)
A **🔄 Reset** button on each device row lets a manager force-clear a stuck session. A bearer token can optionally be provided to also cancel any active operation on the device.

### Transaction Reporting Overhaul
The Transactions tab has been replaced with a filterable data table, multi-field filters, pagination and Excel export. See [Transaction Reporting](#transaction-reporting).

### Operation Type Constants
`server/sesami/operationTypes.js` centralises all 22 RC5000 operation type codes as named constants.

---

## Overview

Two user profiles:

- **Cashier** — Product grid, shopping cart, cash checkout via RC5000, refund/payout
- **Manager** — Product catalog, device management, user management, transaction reporting, theme

The backend is Node.js/Express. The frontend is a Vue 3 SPA. In production, both are served from a single process on port 3001.

---

## Features

### Retail (Cashier) View
- Touch-optimized product grid with category filters and live search
- Shopping cart with quantity controls and running totals
- Full RC5000 cash payment flow with real-time progress display
- Banknote insertion progress bar (amount inserted vs. amount due)
- Handles all RC5000 operation states: waiting, insufficient change, complete, cancelled, error
- Change display with cashier prompt after successful payment
- **Refund / Payout** with RC5000 dispensing (type 5 — PayoutAmount)
- **Manual amount entry** via on-screen numeric keypad with optional reason
- **Manual payment mode** when no RC5000 is available
- Device error recovery: Retry / Manual / Cancel options
- Live RC5000 device status indicator (polls every 30s)

### Manager Panel
- **Products** — CRUD with image upload, emoji fallback, auto-generated item codes
- **Categories** — Add/delete product categories
- **Users** — Create/edit/delete accounts; set per-user refund permissions
- **Devices** — Add/configure multiple RC5000 devices; force-reset stuck sessions
- **Settings** — Business name, logo, currency, locale, theme
- **Transactions** — Filterable, paginated data table with Excel export

### System
- Sesami-inspired dark theme (teal `#00c4b3` accent)
- Dynamic theming — all configurable at runtime without reload
- JWT-based authentication (8h sessions)
- **SQLite database** with automatic schema migrations
- Cross-platform: Linux ARM64, Windows, macOS

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 (Composition API) + Vite 5 |
| State management | Pinia |
| Routing | Vue Router 4 |
| HTTP client | Axios |
| Backend | Node.js + Express 4 |
| Authentication | JWT (`jsonwebtoken` + `bcryptjs`) |
| File uploads | Multer |
| Database | SQLite (`better-sqlite3`) |
| RC5000 comms | Axios + custom HMAC-SHA256 JWT generator |
| Excel export | SheetJS (loaded client-side on demand) |
| Dev tooling | Nodemon + Concurrently |

---

## Architecture

```
Browser / Kiosk (Chromium)
        │
        ▼
┌─────────────────────────────────┐
│  Vue 3 SPA  (port 5173 dev)     │
│  RetailView      — cashier POS  │
│  ManagerView     — back office  │
│  CheckoutModal   — RC5000 flow  │
│  ManualAmountModal — refund amt │
│  RC5000Status    — live polling │
└────────────┬────────────────────┘
             │ HTTP /api/*
             ▼
┌─────────────────────────────────┐
│  Express API  (port 3001)       │
│  /api/auth         JWT auth     │
│  /api/items        CRUD         │
│  /api/categories   CRUD         │
│  /api/users        CRUD         │
│  /api/settings     Config       │
│  /api/sesami       RC5000 proxy │
└────────────┬────────────────────┘
             │ HTTPS (local network, self-signed cert)
             ▼
┌─────────────────────────────────┐
│  Sesami SafePay RC5000          │
│  POS API v3                     │
│  https://<ip>:4443              │
└─────────────────────────────────┘
```

In production, Express serves the Vite build statically — single process on port 3001.

---

## Project Structure

```
demo-pos/
│
├── package.json              # Root — concurrently dev/build scripts
├── .gitignore
├── README.md
│
├── client/
│   ├── vite.config.js        # Dev proxy → :3001
│   └── src/
│       ├── stores/
│       │   ├── auth.js              # User session
│       │   ├── cart.js              # Cart + refund mode
│       │   └── theme.js             # CSS variables + currency formatter
│       ├── components/
│       │   ├── ProductCard.vue
│       │   ├── CartPanel.vue        # Cart + refund toggle + manual amount
│       │   ├── CheckoutModal.vue    # Multi-phase RC5000 payment/refund modal
│       │   ├── ManualAmountModal.vue
│       │   └── RC5000Status.vue
│       └── views/
│           ├── LoginView.vue
│           ├── RetailView.vue
│           └── ManagerView.vue      # 6 tabs
│
└── server/
    ├── index.js               # Entry point
    ├── database.js            # SQLite schema + migrations
    ├── db.js                  # Data access helpers
    ├── data/
    │   └── orca.db            # SQLite DB (auto-created)
    ├── uploads/               # Product images + logos
    ├── routes/
    │   ├── auth.js
    │   ├── items.js
    │   ├── categories.js
    │   ├── users.js           # + canRefund field
    │   ├── settings.js
    │   └── sesami.js          # payin, payout, poll, finish, cancel, transactions
    └── sesami/
        ├── jwt.js             # HMAC-SHA256 JWT for RC5000
        ├── client.js          # RC5000 client + token persistence
        └── operationTypes.js  # 22 operation type constants
```

---

## Prerequisites

- **Node.js v18+** (tested on v24 LTS)
- npm v8+
- Network access to the RC5000 (same LAN or direct Ethernet)
- ARM64 deployment: `node-gyp` build tools required for `better-sqlite3`

---

## Installation

```bash
git clone https://github.com/cgvispe/orca-pos.git
cd orca-pos
npm run install:all
```

### Upgrading from v1.0.0
Just replace the files and restart. The server migrates `orca.db` automatically on startup. The old `db.json` is no longer used and can be deleted.

### SQLite Native Binaries (`better-sqlite3`)

`better-sqlite3` compiles a native `.node` addon during `npm install`. This is the only package in the project that requires build tools — all other dependencies are pure JavaScript.

#### Linux / ARM64 (i.MX8, Yocto)

The board must have build tools available:

```bash
# Yocto: ensure these are in your image or installed
python3 make gcc g++
```

If the board does not have build tools, **pre-build on a matching ARM64 machine** and rsync the entire `server/node_modules` to the board. Do not copy `node_modules` from an x86 machine — the native binaries are architecture-specific and will crash with `invalid ELF header`.

```bash
# Build on ARM64 dev machine, then copy
rsync -av server/node_modules user@<board-ip>:/opt/demo-pos/server/
```

#### Windows

Requires **Visual Studio Build Tools** (C++ workload). The easiest way:

```bash
# Run once as administrator
npm install --global --production windows-build-tools
```

Or install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) manually and select the "Desktop development with C++" workload.

#### macOS

Xcode Command Line Tools are sufficient:

```bash
xcode-select --install
```

#### Verifying the installation

If `better-sqlite3` fails to load, the server will crash immediately on startup with an error like:

```
Error: Cannot find module '.../better_sqlite3.node'
# or
Error: The module was compiled against a different Node.js version
```

In either case, rebuild the native module:

```bash
cd server
npm rebuild better-sqlite3
```

### Troubleshooting (Linux / ARM64)

```bash
# Permission denied on binaries
chmod +x node_modules/.bin/* server/node_modules/.bin/* client/node_modules/.bin/*

# CERT_NOT_YET_VALID — fix system clock
sudo timedatectl set-ntp true
```

---

## Configuration

RC5000 devices are configured from **Manager Panel → Devices → Add Device**:

| Field | Description |
|---|---|
| Name | Display name (e.g. "Caja 1") |
| IP | Device IP on the local network |
| Port | `4443` (HTTPS default) |
| POS ID | Identifier registered with Sesami |
| Username | Sesami username for this POS |
| Secret Key | 256-bit HMAC secret from Sesami |
| HTTPS | `true` by default |
| Default | Pre-selected at cashier login |

---

## Running the Application

```bash
# Development
npm run dev
# Frontend: http://localhost:5173  Backend: http://localhost:3001/api

# Production
npm run build
NODE_ENV=production node server/index.js
# http://<host>:3001
```

---

## Default Credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `password` | Manager |
| `cashier` | `password` | Cashier |

> ⚠️ Change these before any production deployment.

---

## RC5000 Integration

### HTTPS and Self-Signed Certificate
The RC5000 uses HTTPS on port 4443 with a self-signed cert. The Node.js client uses `rejectUnauthorized: false`. The browser never connects to the device directly.

### JWT Authentication
- **Base64url** encoded header + payload
- **HMAC-SHA256** signature using the Sesami secret
- Expiration must be ≥5 min in the future (app uses +10 min)
- Login returns a bearer token used for all subsequent calls
- **One session per device** — logout is always called after every terminal operation

### Bearer Token Persistence
Token is saved to SQLite after every successful login. On server restart, if login returns "Operación ya iniciada", the server uses the persisted token to cancel + logout before retrying.

### PayIn Flow (type 10)

```
POST /api/sesami/payin { deviceId, amount }
  → login → start op type 10
  → poll GET /api/sesami/operation/:id every 1.5s
      status 1/2 → keep polling
      status 4/5/8 → finish → logout → save tx
      status 7 → offer Finish or Cancel to cashier
      status 3/9/6 → logout
```

### Operation Status Codes

| Code | Meaning | Intermediate |
|---|---|---|
| 1 | Started | ✓ |
| 2 | Processing | ✓ |
| 3 | Cancelled | — |
| 4 | Finished | — |
| 5 | Finished by system | — |
| 6 | Finished with error | — |
| 7 | Amount not available | ✓ |
| 8 | Finished incomplete | — |
| 9 | Cancelled incomplete | — |

### Operation Type Constants (`operationTypes.js`)

```js
PayoutAmount: 5,  PayinAmount: 10,  Collection: 17,  Empty: 15,
// ... and 18 more — see server/sesami/operationTypes.js
```

---

## Refund / Payout Flow

Operation type **5 (PayoutAmount)** — RC5000 dispenses cash.

### Permissions
Refund toggle visible only when `canRefund === true`. Managers always have it. Configurable per cashier in Manager Panel → Users.

### Workflow 1 — Cart Refund
1. Add items to cart → enable ↩ Refund toggle
2. Checkout button shows "↩️ Dispense"
3. `POST /api/sesami/payout` → type 5 operation
4. Modal shows amber "Dispensing cash…" with totalOut progress bar
5. `POST /api/sesami/operation/finish-refund` → save tx → logout → clear cart

### Workflow 2 — Manual Amount
1. Click **+ Add manual amount** → numeric keypad → optional reason
2. Enable refund toggle → proceed as above

### Manual Refund (no device)
Device-error screen offers **Manual refund** → saves tx with `isManual: true`, `rcStatus: null`.

---

## Multi-Device Architecture

- One server + one SQLite DB per store, multiple RC5000 devices
- Cashiers select device at login (or default is pre-selected)
- Sessions tracked per-device in memory + SQLite
- Server only logs out sessions it owns — never interrupts another terminal's active transaction
- **Force Reset**: Manager Panel → Devices → 🔄 Reset clears stuck sessions

---

## Transaction Reporting

### Columns

| Column | Description |
|---|---|
| Date | Timestamp |
| ID | Short UUID |
| User | Who processed the transaction |
| Device | RC5000 name or "Manual" |
| Operation | e.g. "Payin Amount", "Payout Amount" |
| Source | 🏧 RC5000 / 💵 Manual |
| RC Status | Finished / Cancelled / Error / Incomplete |
| Total In | Cash inserted (€) |
| Total Out | Cash dispensed (€) |
| Total | Net (positive = sale, negative = refund) |

### Filters (combinable)
- **Date** — calendar picker with month navigation
- **Operation** — multi-select
- **Source** — All / RC5000 / Manual
- **RC Status** — multi-select
- **User** — multi-select (all roles)

### Pagination & Export
Up to 100 rows per page. **⬇ Export Excel** downloads all filtered rows as `.xlsx` via SheetJS.

---

## API Reference

`/api` prefix. ✓ = JWT required. 👔 = manager role required.

### Auth
| POST | `/auth/login` | — | Returns JWT + user |
| GET | `/auth/me` | ✓ | Current user |

### Items · Categories · Users · Settings
Standard CRUD — see previous section for full table.

### RC5000
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/sesami/heartbeat` | — | Ping |
| GET | `/sesami/status/:deviceId` | — | Device status |
| POST | `/sesami/payin` | ✓ | Start PayinAmount (type 10) |
| POST | `/sesami/payout` | ✓ | Start PayoutAmount (type 5) |
| GET | `/sesami/operation/:id` | ✓ | Poll status |
| POST | `/sesami/operation/finish` | ✓ | Finish payin, save tx |
| POST | `/sesami/operation/finish-refund` | ✓ | Finish payout, save tx |
| POST | `/sesami/operation/finish-manual` | ✓ | Record manual tx |
| POST | `/sesami/operation/cancel` | ✓ | Cancel operation |
| POST | `/sesami/logout` | ✓ | Force logout |
| POST | `/sesami/force-reset/:deviceId` | 👔 | Clear stuck session |
| GET | `/sesami/transactions` | ✓ | History (filterable, paginated) |

#### `/sesami/transactions` query params
`date`, `operationType` (CSV ints), `status` (CSV), `rcStatus` (CSV ints), `cashierId` (CSV), `isManual` (bool), `page`, `limit` (max 100)

---

## User Roles

| Capability | Cashier | Manager |
|---|---|---|
| View products & cart | ✓ | ✓ |
| Process cash payment | ✓ | ✓ |
| Process refund / payout | if `canRefund` | ✓ |
| Select RC5000 device at login | ✓ | ✓ |
| Manage products & categories | — | ✓ |
| Manage users (+ refund permissions) | — | ✓ |
| Configure / reset RC5000 devices | — | ✓ |
| View & export transactions | — | ✓ |

---

## Manager Panel

| Tab | Description |
|---|---|
| Products | CRUD, image upload, auto item codes |
| Categories | Add/delete |
| Users | CRUD + canRefund permission per user |
| Devices | Multi-device config + 🔄 Force Reset |
| Settings | Business info, logo, currency, theme |
| Transactions | Filterable table + Excel export |

---

## Theme System

CSS custom properties injected by the Pinia theme store. Instant repaint — no reload.

```
--color-bg:        #090b0f
--color-surface:   #0f1117
--color-primary:   #00c4b3    (Sesami teal)
```

Sesami logo embedded as default. Replaceable from Settings → Store Logo.

---

## Deployment on i.MX8 / Yocto Linux

```bash
# On dev machine
npm run build
rsync -av --exclude='node_modules' --exclude='client/dist' --exclude='server/data' \
  . user@<board-ip>:/opt/demo-pos

# On the board
cd /opt/demo-pos
npm install --prefix server --omit=dev
scp -r client/dist user@<board-ip>:/opt/demo-pos/client/dist
NODE_ENV=production node server/index.js

# Kiosk
chromium-browser --kiosk --noerrdialogs --disable-infobars http://localhost:3001
```

### systemd

```ini
[Unit]
Description=ORCA POS Server
After=network.target

[Service]
WorkingDirectory=/opt/demo-pos
ExecStart=/usr/bin/node server/index.js
Environment=NODE_ENV=production
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## Known Limitations

- **One active operation per device at a time** — concurrent checkouts on the same device must queue
- **No HTTPS on the POS server** — use nginx for remote access
- **Image storage** — `server/uploads/` is local filesystem, excluded from git; back up separately
- **Token persistence** — per-device, per-server-instance; multi-server setups need a shared token store
