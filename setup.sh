#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  BizPilot — Local Development Setup
#  Run once to install deps + copy .env
# ════════════════════════════════════════════════════════════════

set -e

RESET='\033[0m'
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'

header() { echo -e "\n${BOLD}${BLUE}▶ $1${RESET}"; }
ok()     { echo -e "${GREEN}✔ $1${RESET}"; }
warn()   { echo -e "${YELLOW}⚠ $1${RESET}"; }
info()   { echo -e "  $1"; }

echo ""
echo -e "${BOLD}  ╔══════════════════════════════════╗${RESET}"
echo -e "${BOLD}  ║       BizPilot Setup             ║${RESET}"
echo -e "${BOLD}  ╚══════════════════════════════════╝${RESET}"
echo ""

# ── 1. Node version check ──────────────────────────────────────
header "Checking Node.js version"
NODE_VER=$(node -v 2>/dev/null || echo "not found")
if [[ "$NODE_VER" == "not found" ]]; then
  echo -e "${RED}✘ Node.js not found. Install Node 20+ from https://nodejs.org${RESET}"
  exit 1
fi
ok "Node $NODE_VER"

# ── 2. Copy .env ───────────────────────────────────────────────
header "Setting up environment variables"
if [ ! -f ".env" ]; then
  cp .env.example .env
  ok "Created .env from .env.example"
  warn "Open .env and fill in your API keys before starting."
else
  ok ".env already exists — skipping copy"
fi

# ── 3. Install dependencies ────────────────────────────────────
header "Installing dependencies (this may take a minute)"
npm install
ok "Dependencies installed"

# ── Done ───────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}  Setup complete!${RESET}"
echo ""
echo -e "  ${BOLD}Required keys in .env:${RESET}"
echo -e "  ${YELLOW}GOOGLE_GENERATIVE_AI_API_KEY${RESET}  — Get from https://aistudio.google.com/app/apikey"
echo -e "  ${YELLOW}JWT_SECRET${RESET}                   — Any long random string"
echo -e "  ${YELLOW}JWT_REFRESH_SECRET${RESET}           — Any long random string (different from above)"
echo ""
echo -e "  ${BOLD}Optional (enables web search):${RESET}"
echo -e "  ${YELLOW}TAVILY_API_KEY${RESET}               — Free tier at https://tavily.com"
echo ""
echo -e "  ${BOLD}Optional (enables observability):${RESET}"
echo -e "  ${YELLOW}LANGFUSE_PUBLIC_KEY${RESET}"
echo -e "  ${YELLOW}LANGFUSE_SECRET_KEY${RESET}          — Free at https://cloud.langfuse.com"
echo ""
echo -e "  To start the app:"
echo -e "  ${BOLD}npm run dev${RESET}"
echo ""
echo -e "  Client → http://localhost:5173"
echo -e "  Server → http://localhost:3001"
echo ""
