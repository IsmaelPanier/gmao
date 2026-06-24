#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  GMAO Pro — Script de déploiement Docker
#  Usage : ./run.sh [commande] [options]
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

# ─── Couleurs ─────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log_info()  { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step()  { echo -e "\n${BLUE}${BOLD}▶  $1${NC}"; }

# ─── Bannière ─────────────────────────────────────────────────────
print_banner() {
  echo -e "${BLUE}${BOLD}"
  echo "  ██████╗ ███╗   ███╗ █████╗  ██████╗     ██████╗ ██████╗  ██████╗ "
  echo " ██╔════╝ ████╗ ████║██╔══██╗██╔═══██╗    ██╔══██╗██╔══██╗██╔═══██╗"
  echo " ██║  ███╗██╔████╔██║███████║██║   ██║    ██████╔╝██████╔╝██║   ██║"
  echo " ██║   ██║██║╚██╔╝██║██╔══██║██║   ██║    ██╔═══╝ ██╔══██╗██║   ██║"
  echo " ╚██████╔╝██║ ╚═╝ ██║██║  ██║╚██████╔╝    ██║     ██║  ██║╚██████╔╝"
  echo "  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝     ╚═╝     ╚═╝  ╚═╝ ╚═════╝ "
  echo -e "${NC}${CYAN}  Gestion de Maintenance Assistée par Ordinateur${NC}\n"
}

# ─── Répertoire du script ─────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─── Détection de docker compose (v2 ou v1) ───────────────────────
detect_compose() {
  if docker compose version &>/dev/null 2>&1; then
    echo "docker compose"
  elif command -v docker-compose &>/dev/null; then
    echo "docker-compose"
  else
    log_error "docker compose introuvable. Installez Docker Desktop ou docker-compose-plugin."
    exit 1
  fi
}

# ─── Vérification des prérequis ───────────────────────────────────
check_prerequisites() {
  log_step "Vérification des prérequis"

  if ! command -v docker &>/dev/null; then
    log_error "Docker n'est pas installé."
    echo "  → https://docs.docker.com/engine/install/ubuntu/"
    exit 1
  fi
  log_info "Docker $(docker --version | grep -oP '[\d.]+' | head -1)"

  COMPOSE_CMD=$(detect_compose)
  log_info "Docker Compose détecté : $COMPOSE_CMD"

  if ! docker info &>/dev/null 2>&1; then
    log_error "Le daemon Docker n'est pas démarré."
    echo "  Lancez : sudo systemctl start docker"
    exit 1
  fi
  log_info "Daemon Docker actif"
}

# ─── Configuration .env ───────────────────────────────────────────
setup_env() {
  log_step "Configuration de l'environnement"

  if [ ! -f ".env" ]; then
    cp .env.example .env
    log_info "Fichier .env créé depuis .env.example"

    # Génération de secrets aléatoires si openssl disponible
    if command -v openssl &>/dev/null; then
      JWT_GEN=$(openssl rand -hex 32)
      PG_GEN=$(openssl rand -hex 12)
      MINIO_GEN=$(openssl rand -hex 12)

      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|CHANGEME_jwt_secret_must_be_at_least_32_chars_long|${JWT_GEN}|g" .env
        sed -i '' "s|CHANGEME_mot_de_passe_base_de_donnees|${PG_GEN}|g" .env
        sed -i '' "s|CHANGEME_mot_de_passe_minio|${MINIO_GEN}|g" .env
      else
        sed -i "s|CHANGEME_jwt_secret_must_be_at_least_32_chars_long|${JWT_GEN}|g" .env
        sed -i "s|CHANGEME_mot_de_passe_base_de_donnees|${PG_GEN}|g" .env
        sed -i "s|CHANGEME_mot_de_passe_minio|${MINIO_GEN}|g" .env
      fi

      log_info "Secrets générés automatiquement"
    else
      log_warn "openssl absent — modifiez manuellement les valeurs CHANGEME dans .env"
    fi

    log_warn "Conservez le fichier .env en lieu sûr. Ne le commitez jamais dans git."
  else
    log_info "Fichier .env existant détecté"
  fi

  # Chargement des variables pour vérification
  set -a; source .env 2>/dev/null || true; set +a

  if [[ "${JWT_SECRET:-}" == *"CHANGEME"* ]] || [ -z "${JWT_SECRET:-}" ]; then
    log_warn "JWT_SECRET contient encore une valeur CHANGEME dans .env"
    log_warn "Éditez .env et relancez ./run.sh"
    exit 1
  fi
}

# ─── Attendre que l'application soit prête ────────────────────────
wait_ready() {
  local port="${APP_PORT:-80}"
  local max=40
  echo -n "  Attente du démarrage"
  for i in $(seq 1 $max); do
    if curl -sf "http://localhost:${port}/api/health" &>/dev/null; then
      echo ""
      return 0
    fi
    echo -n "."
    sleep 3
  done
  echo ""
  log_warn "L'application met du temps à démarrer. Vérifiez : ./run.sh logs"
}

# ─── Afficher les URLs d'accès ────────────────────────────────────
print_urls() {
  set -a; source .env 2>/dev/null || true; set +a
  local port="${APP_PORT:-80}"
  local minio_console="${MINIO_CONSOLE_PORT:-9001}"
  local seed_enabled="${SEED_DB:-false}"

  echo ""
  echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}║        GMAO Pro — Démarrage réussi !         ║${NC}"
  echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BOLD}Application  :${NC}  http://localhost:${port}"
  echo -e "  ${BOLD}API Health   :${NC}  http://localhost:${port}/api/health"
  echo -e "  ${BOLD}Console MinIO:${NC}  http://localhost:${minio_console}"
  echo ""
  if [ "$seed_enabled" = "true" ]; then
    echo -e "${CYAN}  Comptes de démonstration :${NC}"
    echo "    admin@gmao.fr    / Admin1234!    (Administrateur)"
    echo "    manager@gmao.fr  / Manager1234!  (Manager)"
    echo "    tech1@gmao.fr    / Tech1234!     (Technicien)"
    echo ""
  fi
  echo -e "${CYAN}  Commandes utiles :${NC}"
  echo "    ./run.sh logs [service]  — logs en temps réel"
  echo "    ./run.sh stop            — arrêter les services"
  echo "    ./run.sh status          — état des conteneurs"
  echo "    ./run.sh seed            — injecter données de démo"
  echo "    ./run.sh help            — toutes les commandes"
  echo ""
}

# ══════════════════════════════════════════════════════════════════
#  Commandes
# ══════════════════════════════════════════════════════════════════

CMD="${1:-up}"
COMPOSE_CMD=$(detect_compose 2>/dev/null || echo "docker compose")

case "$CMD" in

  # ─── Démarrer (défaut) ─────────────────────────────────────────
  up|start|"")
    print_banner
    check_prerequisites
    COMPOSE_CMD=$(detect_compose)
    setup_env

    # Option --seed : activer les données de démo
    if [[ "${2:-}" == "--seed" || "${2:-}" == "-s" ]]; then
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's/^SEED_DB=.*/SEED_DB=true/' .env
      else
        sed -i 's/^SEED_DB=.*/SEED_DB=true/' .env
      fi
      log_info "Mode seed activé (données de démonstration)"
    fi

    log_step "Construction des images Docker"
    $COMPOSE_CMD build --parallel

    log_step "Démarrage de tous les services"
    $COMPOSE_CMD up -d

    wait_ready
    print_urls
    ;;

  # ─── Arrêter ───────────────────────────────────────────────────
  stop)
    log_step "Arrêt des services"
    $COMPOSE_CMD stop
    log_info "Services arrêtés (les données sont conservées)."
    ;;

  # ─── Redémarrer ────────────────────────────────────────────────
  restart)
    log_step "Redémarrage des services"
    $COMPOSE_CMD restart
    log_info "Services redémarrés."
    ;;

  # ─── Supprimer les conteneurs (données conservées) ─────────────
  down)
    log_step "Arrêt et suppression des conteneurs"
    log_warn "Les volumes de données (BDD, fichiers) sont conservés."
    $COMPOSE_CMD down
    log_info "Conteneurs supprimés."
    ;;

  # ─── Tout supprimer (données incluses) ─────────────────────────
  reset)
    echo ""
    log_warn "ATTENTION : cette commande supprime TOUTES les données."
    log_warn "La base de données et les fichiers MinIO seront perdus définitivement."
    echo ""
    read -r -p "  Tapez 'oui' pour confirmer : " CONFIRM
    if [ "$CONFIRM" = "oui" ]; then
      $COMPOSE_CMD down -v --remove-orphans
      log_info "Tout supprimé (conteneurs + volumes)."
    else
      log_info "Annulé."
    fi
    ;;

  # ─── Voir les logs ─────────────────────────────────────────────
  logs)
    SERVICE="${2:-}"
    $COMPOSE_CMD logs -f --tail=150 $SERVICE
    ;;

  # ─── État des conteneurs ───────────────────────────────────────
  status|ps)
    log_step "État des services"
    $COMPOSE_CMD ps
    ;;

  # ─── Injecter les données de démo ──────────────────────────────
  seed)
    log_step "Injection des données de démonstration"
    $COMPOSE_CMD exec backend sh -c "
      rm -f /var/lib/gmao/.seed_done
      cd /app/backend && node prisma/seed.js
    " && log_info "Données de démo injectées avec succès." \
      || log_error "Erreur lors du seed. Vérifiez : ./run.sh logs backend"
    ;;

  # ─── Mettre à jour l'application ───────────────────────────────
  update)
    log_step "Mise à jour de l'application"
    if command -v git &>/dev/null && [ -d ".git" ]; then
      git pull --ff-only && log_info "Code mis à jour depuis git."
    fi
    $COMPOSE_CMD build --parallel
    $COMPOSE_CMD up -d
    log_info "Application mise à jour et redémarrée."
    ;;

  # ─── Ouvrir un shell dans un conteneur ─────────────────────────
  shell)
    SERVICE="${2:-backend}"
    log_step "Shell interactif dans le conteneur : $SERVICE"
    $COMPOSE_CMD exec "$SERVICE" sh
    ;;

  # ─── Aide ──────────────────────────────────────────────────────
  help|-h|--help)
    print_banner
    echo -e "${BOLD}Usage :${NC}  ./run.sh [commande] [options]"
    echo ""
    echo -e "${BOLD}Commandes :${NC}"
    echo "  up [--seed]        Construire et démarrer l'application"
    echo "                       --seed : injecter des données de démonstration"
    echo "  stop               Arrêter les services (données conservées)"
    echo "  restart            Redémarrer les services"
    echo "  down               Supprimer les conteneurs (données conservées)"
    echo "  reset              ⚠  Tout supprimer, données incluses"
    echo "  logs [service]     Voir les logs (service : backend|nginx|postgres|minio)"
    echo "  status             État de tous les conteneurs"
    echo "  seed               Injecter les données de démonstration"
    echo "  update             Mettre à jour l'application (git pull + rebuild)"
    echo "  shell [service]    Ouvrir un shell dans un conteneur"
    echo "  help               Afficher cette aide"
    echo ""
    echo -e "${BOLD}Exemples :${NC}"
    echo "  ./run.sh                   # Premier démarrage"
    echo "  ./run.sh up --seed         # Démarrage avec données de démo"
    echo "  ./run.sh logs backend      # Logs du backend uniquement"
    echo "  ./run.sh shell postgres    # Shell dans PostgreSQL"
    echo ""
    ;;

  *)
    log_error "Commande inconnue : '$CMD'"
    echo "  Lancez ./run.sh help pour voir les commandes disponibles."
    exit 1
    ;;
esac
