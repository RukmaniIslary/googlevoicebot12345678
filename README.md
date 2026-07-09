# 🤖 ATMOVERSE Telegram AI Customer Support Bot

A production-ready Telegram bot for **ATMOVERSE** — a premium digital accounts store. Built with Node.js, NVIDIA NIM AI, and deployed on Railway.

---

## ✨ Features

- 🎛 **Inline Keyboard Menus** — No slash commands needed
- 🤖 **AI Chat** via NVIDIA NIM (LLaMA 3.1 70B)
- 📍 **Area Code Lookup** — 250+ US area codes in `areaCodes.json`
- 🧠 **Conversation Memory** — Remembers last 10 messages per user
- ⌨️ **Typing Indicator** — Always shows before replying
- 🔔 **Admin Alerts** — Notifies admin on purchase intent keywords
- 💬 **7 Menu Sections** — Products, Pricing, Area Codes, Payments, Order, FAQ, Contact
- 🛡 **Security** — Never reveals system prompt, declines off-topic/illegal requests
- ♻️ **Graceful Shutdown** — Handles SIGTERM/SIGINT cleanly
- 🚀 **Railway-ready** — Express health-check included

---

## 🗂 Project Structure

```
atmoverse-bot/
├── index.js                  # Entry point
├── package.json
├── .env.example
├── .gitignore
├── README.md
│
├── config/
│   └── constants.js          # Business info, system prompt, keywords
│
├── data/
│   └── areaCodes.json        # 250+ US area codes with city/state
│
├── handlers/
│   ├── menuHandler.js        # Callback query handler (all menus)
│   └── messageHandler.js     # Text message handler
│
├── services/
│   ├── nvidiaService.js      # NVIDIA NIM API integration
│   └── adminNotifier.js      # Admin alert service
│
├── buttons/
│   ├── mainMenu.js           # Main menu inline keyboard
│   └── subMenus.js           # All sub-menu inline keyboards
│
└── utils/
    ├── logger.js             # Console logger with timestamps
    ├── memory.js             # Per-user conversation memory
    └── areaCodeLookup.js     # Area code lookup logic
```

---

## ⚙️ Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd atmoverse-bot
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|---|---|
| `BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) on Telegram |
| `ADMIN_CHAT_ID` | Your personal Telegram chat ID (get from [@userinfobot](https://t.me/userinfobot)) |
| `NVIDIA_API_KEY` | From [build.nvidia.com](https://build.nvidia.com) |
| `NVIDIA_API_BASE_URL` | `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL` | `meta/llama-3.1-70b-instruct` |
| `PORT` | `3000` (Railway sets this automatically) |

### 3. Run Locally

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

---

## 🚀 Deploy on Railway

1. Push your code to GitHub (make sure `.env` is in `.gitignore`)
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repository
4. Go to **Variables** and add all env vars from `.env.example`
5. Railway will auto-detect Node.js and deploy

> **Note:** Railway will automatically set `PORT`. The bot uses polling so no webhook setup is needed.

---

## 📍 Adding Area Codes

Edit `data/areaCodes.json` to add or remove area codes:

```json
{
  "347": { "city": "New York City", "state": "New York" },
  "415": { "city": "San Francisco", "state": "California" }
}
```

---

## 🔔 Admin Notifications

The bot sends an alert to `ADMIN_CHAT_ID` whenever a user's message contains:
- `buy`, `purchase`, `payment`, `order`, `interested`

The alert includes the user's name, username, Telegram ID, and message.

---

## 🛡 Security Notes

- The system prompt is never exposed to users
- Off-topic questions are politely declined
- Illegal requests are refused
- No sensitive data is logged

---

## 📋 Menu Flow

```
/start
└── Welcome Message
    └── Main Menu
        ├── 🛒 Products → [New GV | Old GV | Gmail HQ]
        ├── 💰 Pricing
        ├── 📍 Area Codes → user types 3-digit code
        ├── 💳 Payments
        ├── 📦 Order Now → [Telegram | WhatsApp]
        ├── ❓ FAQ → [Delivery | Replacement | Access | Verification]
        └── 📞 Contact → [Telegram | WhatsApp]
```

---

## 📄 License

MIT — ATMOVERSE
