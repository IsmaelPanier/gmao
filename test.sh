#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  GMAO Pro — Script de tests unitaires
#  Usage : ./test.sh              (lance tous les tests)
#          ./test.sh --backend    (backend seulement)
#          ./test.sh --frontend   (frontend seulement)
#          ./test.sh --watch      (mode watch, rerun à chaque changement)
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

# ─── Couleurs ─────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log_info()    { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
log_error()   { echo -e "${RED}[✗]${NC} $1"; }
log_section() { echo -e "\n${CYAN}${BOLD}━━━ $1 ━━━${NC}"; }

# ─── Arguments ────────────────────────────────────────────────────
RUN_BACKEND=true
RUN_FRONTEND=true
WATCH_MODE=false

for arg in "$@"; do
  case $arg in
    --backend)  RUN_FRONTEND=false ;;
    --frontend) RUN_BACKEND=false ;;
    --watch)    WATCH_MODE=true ;;
  esac
done

# ─── Détection de l'environnement ─────────────────────────────────
BACKEND_CONTAINER="gmao_backend"
BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
FRONTEND_DIR="$(cd "$(dirname "$0")/frontend" && pwd)"

run_in_docker_backend() {
  docker exec "$BACKEND_CONTAINER" sh -c "cd /app/backend && $1"
}

has_local_node() {
  command -v node &>/dev/null 2>&1
}

has_docker_backend() {
  docker ps --format "{{.Names}}" 2>/dev/null | grep -q "^${BACKEND_CONTAINER}$"
}

# ─── Entête ───────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}"
echo "  ╔══════════════════════════════════╗"
echo "  ║     GMAO Pro — Tests Unitaires   ║"
echo "  ╚══════════════════════════════════╝"
echo -e "${NC}"

START_TIME=$(date +%s)
FAILED=0
PASSED=0

# ─── Tests Backend ────────────────────────────────────────────────
if [ "$RUN_BACKEND" = true ]; then
  log_section "Tests Backend (Node.js / Vitest)"

  VITEST_CMD="npx vitest run"
  [ "$WATCH_MODE" = true ] && VITEST_CMD="npx vitest"

  if has_docker_backend; then
    log_info "Exécution dans le container Docker '$BACKEND_CONTAINER'..."
    echo ""
    if run_in_docker_backend "$VITEST_CMD"; then
      log_info "Tests backend réussis"
      PASSED=$((PASSED + 1))
    else
      log_error "Tests backend échoués"
      FAILED=$((FAILED + 1))
    fi
  elif has_local_node && [ -f "$BACKEND_DIR/node_modules/.bin/vitest" ]; then
    log_info "Exécution en local..."
    echo ""
    if (cd "$BACKEND_DIR" && $VITEST_CMD); then
      log_info "Tests backend réussis"
      PASSED=$((PASSED + 1))
    else
      log_error "Tests backend échoués"
      FAILED=$((FAILED + 1))
    fi
  else
    log_warn "Ni Docker backend ni node local disponible — tests backend ignorés"
    log_warn "Lancez : docker compose up -d backend  ou  npm install dans backend/"
  fi
fi

# ─── Tests Frontend ───────────────────────────────────────────────
if [ "$RUN_FRONTEND" = true ]; then
  log_section "Tests Frontend (React / Vitest + Testing Library)"

  VITEST_CMD="npx vitest run"
  [ "$WATCH_MODE" = true ] && VITEST_CMD="npx vitest"

  if has_local_node && [ -f "$FRONTEND_DIR/node_modules/.bin/vitest" ]; then
    log_info "Exécution en local..."
    echo ""
    if (cd "$FRONTEND_DIR" && $VITEST_CMD); then
      log_info "Tests frontend réussis"
      PASSED=$((PASSED + 1))
    else
      log_error "Tests frontend échoués"
      FAILED=$((FAILED + 1))
    fi
  else
    log_info "Exécution via Docker temporaire (node:20-alpine)..."
    echo ""
    if docker run --rm \
      -v "$FRONTEND_DIR:/app" \
      -w /app \
      node:20-alpine \
      sh -c "npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom --silent 2>/dev/null && npx vitest run"; then
      log_info "Tests frontend réussis"
      PASSED=$((PASSED + 1))
    else
      log_error "Tests frontend échoués"
      FAILED=$((FAILED + 1))
    fi
  fi
fi

# ─── Résumé ───────────────────────────────────────────────────────
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Résumé${NC}  (${DURATION}s)"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}Toutes les suites ont réussi ✓${NC}"
else
  echo -e "  ${RED}${BOLD}$FAILED suite(s) en échec${NC}"
  echo -e "  ${GREEN}$PASSED suite(s) réussies${NC}"
fi
echo ""

exit $FAILED
