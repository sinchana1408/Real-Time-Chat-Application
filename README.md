#  PulseChat

> **Connect instantly. Chat effortlessly.**

A modern, high-performance, production-style real-time messaging platform built from scratch with TypeScript, Node.js, Express, Socket.IO, PostgreSQL, Prisma, React, and Tailwind CSS.

---

##  Key Features

- ** Real-Time Messaging**: Sub-millisecond message delivery powered by Socket.IO WebSockets.
- ** Live Presence**: Real-time online/offline status indicators across all active sessions.
- ** Live Typing Indicators**: Smooth animated typing indicators as users compose messages.
- ** Direct & Group Chats**: Seamless 1-to-1 private messaging and multi-user group chat rooms.
- ** Message Reactions**: Interactive emoji reactions with live counters and user lists.
- ** Message Replies & Quoting**: Context-aware inline message replies.
- ** Media & File Attachments**: Image previews and file sharing with integrated upload handling.
- ** Edit & Delete**: Inline message editing and soft deletion.
- ** Secure Authentication**: JWT in HTTP-only cookies, password hashing with bcrypt, and rate-limiting.
- ** Modern Dark & Light Mode**: Curated design system with glassmorphism, smooth animations, and clean responsive layout.
- ** Monorepo Architecture**: Clean separation between `@pulsechat/web`, `@pulsechat/api`, and `@pulsechat/shared`.

---

##  Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Zustand |
| **Backend** | Node.js, Express 5, TypeScript, Socket.IO, Multer, Helmet, CORS |
| **Database** | PostgreSQL, Prisma ORM 6, Embedded Postgres for instant zero-config local run |
| **Shared** | Shared TypeScript interfaces, Zod validation schemas, Socket event constants |

---

##  Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize & Start the Database
The project includes a built-in embedded PostgreSQL server for instant local development:
```bash
npm run db:dev
```
*(Keep this running in a separate terminal or run as background service)*

Push schema and seed initial demo accounts:
```bash
npm run db:push
npm run db:seed
```

### 4. Start Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

##  Demo Accounts (1-Click Login Available)

All demo accounts use password: `Password123!`

| Name | Username | Email |
| :--- | :--- | :--- |
| **Alex Rivers** | `alex.rivers` | `alex@pulsechat.io` |
| **Sarah Chen** | `sarah.chen` | `sarah@pulsechat.io` |
| **Marcus Vance** | `marcus.vance` | `marcus@pulsechat.io` |
| **Elena Rostova** | `elena.rostova` | `elena@pulsechat.io` |
| **David Kim** | `david.kim` | `david@pulsechat.io` |

*Tip: Open an Incognito window or different browser to test real-time chat between two users simultaneously!*

---

##  Repository Structure

```
Real-Time Chat Application/
├── apps/
│   ├── api/                     # Node.js + Express + Socket.IO Backend
│   │   ├── prisma/              # Prisma schema and seed scripts
│   │   ├── scripts/             # Embedded PostgreSQL runner
│   │   ├── src/
│   │   │   ├── config/          # Environment configuration
│   │   │   ├── controllers/     # API request controllers
│   │   │   ├── middleware/      # Auth, error, rate-limiter, upload middlewares
│   │   │   ├── routes/          # Express route definitions
│   │   │   ├── services/        # Business logic (Auth, Conversation, Message, User)
│   │   │   ├── socket/          # Socket.IO event handlers
│   │   │   └── utils/           # JWT, Prisma client, errors, response formatters
│   │   └── package.json
│   └── web/                     # React 19 + Vite + Tailwind Frontend
│       ├── public/              # Static assets & logo
│       ├── src/
│       │   ├── components/      # Chat UI, modals, avatar components
│       │   ├── lib/             # API client, Socket.IO singleton, date helpers
│       │   ├── pages/           # ChatPage, LoginPage, RegisterPage
│       │   ├── store/           # Zustand state management (auth, chat)
│       │   ├── App.tsx          # Root routing & protected routes
│       │   ├── main.tsx         # React DOM entry
│       │   └── index.css        # Tailwind design system & theme variables
│       └── package.json
├── packages/
│   └── shared/                  # Shared TypeScript types, Zod schemas, socket constants
│       ├── src/
│       └── package.json
├── package.json                 # Monorepo root package.json
├── docker-compose.yml           # Optional Docker PostgreSQL configuration
└── README.md
```

---

##  License

MIT License. See [LICENSE](LICENSE) for details.
