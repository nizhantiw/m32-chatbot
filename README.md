# BizPilot — AI Business Co-Pilot

An AI-powered business intelligence assistant for SMB owners and executives. Researches competitors, analyzes markets, performs financial calculations, and answers business questions with cited sources — all in a clean, streaming chat interface.

---

## Quick Start (Local Dev)

### 1. Prerequisites

- **Node.js 20+** — https://nodejs.org
- A **Google Gemini API key** — https://aistudio.google.com/app/apikey
- *(Optional)* A **Tavily API key** for live web search — https://tavily.com (free tier: 1000 req/month)

### 2. Setup

```bash
# Clone / open the project, then:
chmod +x setup.sh && ./setup.sh
```

Or manually:
```bash
cp .env.example .env    # copy env template
npm install             # install all workspace dependencies
```

### 3. Configure `.env`

Open `.env` and fill in **at minimum**:

```dotenv
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
JWT_SECRET=any-long-random-string
JWT_REFRESH_SECRET=another-long-random-string
```

For web search (highly recommended):
```dotenv
TAVILY_API_KEY=your-tavily-key
```

For observability (optional):
```dotenv
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_SECRET_KEY=...
```

### 4. Run

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3001 |
| Health   | http://localhost:3001/health |

---

## Features

| Feature | Details |
|---------|---------|
| **AI Chat** | Streaming responses via Google Gemini + Vercel AI SDK |
| **Web Search** | Live market research with cited sources (Tavily) |
| **Calculator** | Precise financial math: ROI, margins, break-even |
| **Multi-step** | AI can chain tool calls (search → calculate) in one answer |
| **Auth** | JWT with access + refresh token rotation |
| **Context** | Full conversation history persisted in SQLite |
| **Observability** | LLM tracing via Langfuse (optional) |

---

## Architecture

```
m32-chatbot/
├── packages/
│   ├── server/               # Node.js + Express backend
│   │   └── src/
│   │       ├── config/       # Env validation
│   │       ├── db/           # SQLite + Drizzle ORM schema
│   │       ├── middleware/   # JWT auth, error handler
│   │       ├── routes/       # auth, conversations, chat (SSE)
│   │       ├── services/     # Vercel AI SDK + Langfuse
│   │       └── tools/        # webSearch, calculator, getDateTime
│   └── client/               # React + Vite frontend
│       └── src/
│           ├── api/          # Axios client w/ token refresh
│           ├── components/   # Chat UI, tool call display
│           ├── pages/        # Login, Register, Chat
│           └── store/        # Zustand (auth + chat state)
├── docker-compose.yml
├── Dockerfile.server
├── Dockerfile.client
└── nginx.conf
```

### Tech stack

- **Frontend**: React 18, Vite, Tailwind CSS, Zustand, Vercel AI SDK `useChat`
- **Backend**: Node.js, Express, Vercel AI SDK `streamText`, Google Gemini
- **DB**: SQLite via `better-sqlite3` + Drizzle ORM (schema-ready for Postgres)
- **Auth**: JWT (15-min access + 7-day refresh with rotation)
- **Observability**: Langfuse
- **Tools**: Tavily web search, built-in calculator, date/time

---

## Docker (script only — not deploying)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access at http://localhost (nginx serves client + proxies API)
```

> **Note**: The Docker build compiles `better-sqlite3` from source inside the container — build tools are installed in `Dockerfile.server`.

---

## DB Schema

```sql
users (id, name, email, password_hash, google_id, avatar_url, created_at, updated_at)
refresh_tokens (id, user_id, token, expires_at, created_at)
conversations (id, user_id, title, created_at, updated_at)
messages (id, conversation_id, role, content, tool_calls, created_at)
```

To migrate to Postgres: update the Drizzle adapter from `better-sqlite3` to `pg`, add `DATABASE_URL` env var, and the schema works as-is (Drizzle is ORM-agnostic).

---

## Env Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ | Gemini API key |
| `JWT_SECRET` | ✅ | Access token signing key |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing key |
| `TAVILY_API_KEY` | Recommended | Enables live web search |
| `GEMINI_MODEL` | Optional | Default: `gemini-2.0-flash` |
| `PORT` | Optional | Server port (default: 3001) |
| `CLIENT_URL` | Optional | CORS origin (default: http://localhost:5173) |
| `LANGFUSE_PUBLIC_KEY` | Optional | Observability |
| `LANGFUSE_SECRET_KEY` | Optional | Observability |
| `DB_PATH` | Optional | SQLite file path (default: ./bizpilot.db) |
