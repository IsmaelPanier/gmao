#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  GMAO Pro — Script de déploiement Docker (auto-install)
#  Usage : ./run.sh          (premier lancement, installe tout)
#          ./run.sh --seed   (avec données de démonstration)
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

# ─── Couleurs ─────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log_info()  { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1" >&2; }
log_step()  { echo -e "\n${BLUE}${BOLD}▶  $1${NC}"; }

# ─── Répertoire du script ─────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─── Variables globales ────────────────────────────────────────────
SUDO=""         # sera positionné à "sudo" si nécessaire
DC=""           # commande docker compose finale
PROFILE="prod"  # 'prod' (défaut) ou 'dev'
SEED_DB="false" # 'true' si --seed est passé
CMD="up"        # commande principale (up, logs, etc.)
CMD_ARGS=()     # arguments pour la commande

# ══════════════════════════════════════════════════════════════════
#  Bannière
# ══════════════════════════════════════════════════════════════════
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

# ══════════════════════════════════════════════════════════════════
#  Analyse des arguments
# ══════════════════════════════════════════════════════════════════
parse_args() {
  # Handle global flags first
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --dev)
        PROFILE="dev"
        shift
        ;;
      --prod)
        PROFILE="prod"
        shift
        ;;
      --seed|-s)
        SEED_DB="true"
        shift
        ;;
      -*)
        # Not one of our flags, break and let the rest be the command
        break
        ;;
      *)
        # Not a flag, break and let the rest be the command
        break
        ;;
    esac
  done

  # The rest are the command and its arguments
  if [ "$#" -gt 0 ]; then
    CMD="$1"
    shift
    CMD_ARGS=("$@")
  fi
}

# ══════════════════════════════════════════════════════════════════
#  Utilitaires de détection
# ══════════════════════════════════════════════════════════════════
is_wsl()    { grep -qiE "microsoft|wsl" /proc/version 2>/dev/null; }
is_debian() { command -v apt-get &>/dev/null; }
has_cmd()   { command -v "$1" &>/dev/null; }

# Détecte la distribution pour l'URL Docker GPG
distro_id() {
  if [ -f /etc/os-release ]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    echo "${ID:-linux}"
  else
    echo "linux"
  fi
}

# ══════════════════════════════════════════════════════════════════
#  Gestion sudo — demande le mot de passe UNE SEULE FOIS au début
# ══════════════════════════════════════════════════════════════════
acquire_sudo() {
  # L'utilisateur est root → pas besoin de sudo
  if [ "$EUID" -eq 0 ]; then
    SUDO=""
    return 0
  fi

  # sudo disponible ?
  if ! has_cmd sudo; then
    log_warn "sudo absent — les opérations système seront ignorées."
    SUDO=""
    return 0
  fi

  # L'utilisateur peut-il utiliser sudo sans mot de passe ?
  if sudo -n true 2>/dev/null; then
    SUDO="sudo"
    return 0
  fi

  # Sinon : on demande le mot de passe une seule fois ici
  echo ""
  echo -e "${YELLOW}${BOLD}┌─────────────────────────────────────────────────┐${NC}"
  echo -e "${YELLOW}${BOLD}│  Mot de passe administrateur requis             │${NC}"
  echo -e "${YELLOW}${BOLD}│  (utilisé pour Docker et les services système)  │${NC}"
  echo -e "${YELLOW}${BOLD}└─────────────────────────────────────────────────┘${NC}"
  echo ""
  if sudo -v; then
    SUDO="sudo"
    # Maintenir le cache sudo actif en arrière-plan pendant toute la durée du script
    # (rafraîchit toutes les 50 secondes pour ne pas expirer pendant un long build)
    ( while true; do sudo -n true; sleep 50; done ) 2>/dev/null &
    SUDO_REFRESH_PID=$!
    # Nettoyer le processus de refresh à la fin du script
    trap 'kill "$SUDO_REFRESH_PID" 2>/dev/null || true' EXIT
    log_info "Accès administrateur accordé."
  else
    log_error "Mot de passe incorrect ou sudo refusé."
    exit 1
  fi
}

# ══════════════════════════════════════════════════════════════════
#  Installation de Docker Engine
# ══════════════════════════════════════════════════════════════════
install_docker() {
  log_step "Installation de Docker Engine"

  if ! is_debian; then
    log_error "Installation automatique supportée uniquement sur Ubuntu/Debian."
    echo "  Installez Docker manuellement : https://docs.docker.com/engine/install/"
    exit 1
  fi

  local distro
  distro=$(distro_id)

  # Normaliser les dérivés (linuxmint, pop, etc.) vers ubuntu ou debian
  case "$distro" in
    ubuntu|linuxmint|pop|elementary|zorin) distro="ubuntu" ;;
    debian|raspbian|kali)                  distro="debian" ;;
    *)
      log_warn "Distribution '$distro' inconnue — tentative avec 'ubuntu'."
      distro="ubuntu"
      ;;
  esac

  log_info "Mise à jour des paquets apt..."
  $SUDO apt-get update -qq

  log_info "Installation des dépendances..."
  $SUDO apt-get install -y -qq ca-certificates curl gnupg lsb-release

  log_info "Ajout du dépôt officiel Docker..."
  $SUDO install -m 0755 -d /etc/apt/keyrings

  curl -fsSL "https://download.docker.com/linux/${distro}/gpg" \
    | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
  $SUDO chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/${distro} $(lsb_release -cs) stable" \
    | $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null

  $SUDO apt-get update -qq

  log_info "Installation de Docker CE + Compose plugin..."
  $SUDO apt-get install -y -qq \
    docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin

  # Ajouter l'utilisateur au groupe docker pour éviter sudo dans les futures sessions
  $SUDO usermod -aG docker "$USER" 2>/dev/null || true

  log_info "Docker installé avec succès."
  log_warn "Pour que le groupe 'docker' soit effectif, déconnectez-vous / reconnectez-vous."
  log_warn "Pour cette session, sudo sera utilisé automatiquement."
}

# ══════════════════════════════════════════════════════════════════
#  Démarrage du daemon Docker
# ══════════════════════════════════════════════════════════════════
start_docker_daemon() {
  log_warn "Tentative de démarrage du daemon Docker..."

  # Essai 1 : systemctl (systemd — Ubuntu natif ou WSL2 récent)
  if has_cmd systemctl && systemctl is-system-running &>/dev/null 2>&1; then
    if $SUDO systemctl start docker 2>/dev/null; then
      sleep 2
      return 0
    fi
  fi

  # Essai 2 : service (init.d — WSL2 sans systemd)
  if has_cmd service; then
    if $SUDO service docker start 2>/dev/null; then
      sleep 2
      return 0
    fi
  fi

  # Essai 3 : lancer dockerd directement en arrière-plan (dernier recours)
  if has_cmd dockerd; then
    log_warn "Lancement de dockerd en arrière-plan (fallback)..."
    nohup $SUDO dockerd >/tmp/dockerd.log 2>&1 &
    sleep 5
    return 0
  fi

  return 1
}

# ══════════════════════════════════════════════════════════════════
#  Vérification et configuration complète de Docker
# ══════════════════════════════════════════════════════════════════
setup_docker() {
  log_step "Vérification de Docker (mode: ${BOLD}${PROFILE}${NC})"

  # ── 1. Docker Engine installé ? ──────────────────────────────
  local docker_ver
  docker_ver=$(docker --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)

  if [ -z "$docker_ver" ]; then
    log_warn "Docker non détecté — installation automatique..."
    install_docker
    docker_ver=$(docker --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)
    if [ -z "$docker_ver" ]; then
      log_error "Échec de l'installation de Docker. Installez-le manuellement :"
      echo "  https://docs.docker.com/engine/install/"
      exit 1
    fi
  fi
  log_info "Docker $docker_ver"

  # ── 2. Daemon actif ? ────────────────────────────────────────
  if ! docker info &>/dev/null 2>&1; then
    if [ -n "$SUDO" ] && $SUDO docker info &>/dev/null 2>&1; then
      # Docker fonctionne mais l'utilisateur n'est pas encore dans le groupe
      : # on gérera via le préfixe $SUDO dans la commande DC
    else
      if ! start_docker_daemon; then
        log_error "Impossible de démarrer le daemon Docker."
        if is_wsl; then
          echo ""
          echo -e "  ${YELLOW}Sous WSL 2, deux solutions :${NC}"
          echo ""
          echo "  ▸ Option A — Docker Desktop (Windows, recommandé) :"
          echo "    1. Téléchargez Docker Desktop : https://www.docker.com/products/docker-desktop/"
          echo "    2. Docker Desktop → Settings → Resources → WSL Integration"
          echo "    3. Activez votre distro, cliquez 'Apply & Restart'"
          echo "    4. Ouvrez un nouveau terminal et relancez : ./run.sh"
          echo ""
          echo "  ▸ Option B — Docker natif dans WSL (ce script installera Docker) :"
          echo "    Nécessite systemd activé dans WSL2."
        fi
        exit 1
      fi
    fi
  fi

  # ── 3. Accès sans sudo ? ─────────────────────────────────────
  if ! docker ps &>/dev/null 2>&1; then
    if [ -n "$SUDO" ] && $SUDO docker ps &>/dev/null 2>&1; then
      log_warn "Docker accessible uniquement via sudo pour cette session."
      log_warn "Pour les prochaines sessions, reconnectez-vous (groupe 'docker' ajouté)."
    else
      log_error "Impossible d'accéder au daemon Docker, même avec sudo."
      exit 1
    fi
  fi

  log_info "Daemon Docker actif"

  # ── 4. Docker Compose ────────────────────────────────────────
  local dc_prefix="${SUDO:+$SUDO }"
  if ${dc_prefix}docker compose version &>/dev/null 2>&1; then
    DC="${dc_prefix}docker compose --profile ${PROFILE}"
    log_info "Docker Compose v2 (plugin)"
  elif has_cmd docker-compose; then
    if [ "${PROFILE}" = "dev" ]; then
      log_error "Le mode --dev requiert Docker Compose v2 (plugin). Mettez à jour Docker."
      exit 1
    fi
    DC="docker-compose"
    log_info "Docker Compose v1 (standalone)"
  else
    log_warn "Docker Compose non trouvé — installation..."
    $SUDO apt-get install -y -qq docker-compose-plugin 2>/dev/null \
      || { log_error "Impossible d'installer Docker Compose v2. Installez-le manuellement."; exit 1; }
    DC="${dc_prefix}docker compose --profile ${PROFILE}"
    log_info "Docker Compose v2 (plugin) installé"
  fi
}

# ══════════════════════════════════════════════════════════════════
#  Configuration .env
# ══════════════════════════════════════════════════════════════════

# sed -i portable (BSD sur macOS, GNU sur Linux)
sed_inplace() {
  local pattern="$1"
  local file="$2"
  if sed --version 2>/dev/null | grep -q GNU; then
    sed -i "$pattern" "$file"
  else
    sed -i '' "$pattern" "$file"
  fi
}

setup_env() {
  log_step "Configuration de l'environnement"

  if [ ! -f ".env.example" ]; then
    log_error "Fichier .env.example introuvable. Êtes-vous dans le bon répertoire ?"
    exit 1
  fi

  if [ ! -f ".env" ]; then
    cp .env.example .env
    log_info "Fichier .env créé depuis .env.example"

    if has_cmd openssl; then
      local jwt_secret pg_pass minio_pass
      jwt_secret=$(openssl rand -hex 32)
      pg_pass=$(openssl rand -hex 12)
      minio_pass=$(openssl rand -hex 12)
      sed_inplace "s|CHANGEME_jwt_secret_must_be_at_least_32_chars_long|${jwt_secret}|g" .env
      sed_inplace "s|CHANGEME_mot_de_passe_base_de_donnees|${pg_pass}|g"                .env
      sed_inplace "s|CHANGEME_mot_de_passe_minio|${minio_pass}|g"                       .env
      log_info "Secrets générés automatiquement (JWT, BDD, MinIO)"
    else
      log_warn "openssl absent — remplacez les valeurs CHANGEME dans .env manuellement."
    fi

    log_warn "Gardez le fichier .env secret. Ne le commitez jamais dans git."
  else
    log_info "Fichier .env existant conservé"
  fi

  # Configurer SEED_DB dans .env si demandé
  if [ "$SEED_DB" = "true" ]; then
    sed_inplace 's/^SEED_DB=.*/SEED_DB=true/' .env
    set -a; source .env 2>/dev/null || true; set +a
    log_info "Mode seed activé — données de démonstration incluses"
  fi

  # Charger les variables d'env
  set -a
  # shellcheck disable=SC1091
  source .env 2>/dev/null || true
  set +a

  # Vérifier que JWT_SECRET est configuré
  if [[ "${JWT_SECRET:-}" == *"CHANGEME"* ]] || [ -z "${JWT_SECRET:-}" ]; then
    log_error "JWT_SECRET non configuré dans .env"
    echo ""
    echo "  Éditez le fichier .env et remplacez la valeur JWT_SECRET."
    echo "  Astuce : générez un secret avec :  openssl rand -hex 32"
    echo ""
    exit 1
  fi
}

# ══════════════════════════════════════════════════════════════════
#  Vérifications système légères
# ══════════════════════════════════════════════════════════════════
check_prerequisites() {
  local missing=()

  has_cmd curl  || missing+=("curl")
  has_cmd git   || missing+=("git (optionnel pour update)")

  if [ ${#missing[@]} -gt 0 ]; then
    if [[ "${missing[*]}" == *"curl"* ]]; then
      log_warn "curl absent — installation..."
      if is_debian; then
        $SUDO apt-get install -y -qq curl
        log_info "curl installé"
      else
        log_error "curl est requis. Installez-le et relancez : ./run.sh"
        exit 1
      fi
    fi
  fi
}

# ══════════════════════════════════════════════════════════════════
#  Attendre que l'application soit prête
# ══════════════════════════════════════════════════════════════════
wait_ready() {
  local url=""
  if [ "$PROFILE" = "dev" ]; then
    url="http://localhost:5173/api/health"
  else
    local port="${APP_PORT:-80}"
    url="http://localhost:${port}/api/health"
  fi
  
  local max=40
  local i=0
  echo -n "  Attente du démarrage de l'application ($url)"
  while [ $i -lt $max ]; do
    if curl -sf "$url" &>/dev/null; then
      echo ""
      return 0
    fi
    echo -n "."
    sleep 3
    i=$((i + 1))
  done
  echo ""
  log_warn "L'application tarde à répondre (${max} tentatives)."
  local _pflag=""
  [ "$PROFILE" = "dev" ] && _pflag="--dev "
  log_warn "Vérifiez les logs avec :  ./run.sh ${_pflag}logs"
}

# ══════════════════════════════════════════════════════════════════
#  Afficher les URLs de l'application
# ══════════════════════════════════════════════════════════════════
print_urls() {
  set -a
  # shellcheck disable=SC1091
  source .env 2>/dev/null || true
  set +a

  local minio_console="${MINIO_CONSOLE_PORT:-9001}"

  echo ""
  echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}║        GMAO Pro — Démarrage réussi !         ║${NC}"
  echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
  echo ""
  if [ "$PROFILE" = "dev" ]; then
    echo -e "  ${BOLD}Mode         :${NC}  ${YELLOW}Développement (avec hot-reload)${NC}"
    echo -e "  ${BOLD}Application  :${NC}  http://localhost:5173"
    echo -e "  ${BOLD}API Health   :${NC}  http://localhost:5173/api/health"
  else
    local port="${APP_PORT:-80}"
    echo -e "  ${BOLD}Mode         :${NC}  ${CYAN}Production${NC}"
    echo -e "  ${BOLD}Application  :${NC}  http://localhost:${port}"
    echo -e "  ${BOLD}API Health   :${NC}  http://localhost:${port}/api/health"
  fi
  echo -e "  ${BOLD}Console MinIO:${NC}  http://localhost:${minio_console}"
  echo ""
  if [ "${SEED_DB:-false}" = "true" ]; then
    echo -e "${CYAN}  Comptes de démonstration :${NC}"
    echo "    admin@gmao.fr   / Admin1234!   (Administrateur)"
    echo "    manager@gmao.fr / Manager1234! (Manager)"
    echo "    tech1@gmao.fr   / Tech1234!    (Technicien)"
    echo ""
  fi

  local profile_flag=""
  [ "$PROFILE" = "dev" ] && profile_flag="--dev "
  
  echo -e "${CYAN}  Commandes utiles :${NC}"
  echo "    ./run.sh ${profile_flag}logs [service]  — logs en temps réel"
  echo "    ./run.sh ${profile_flag}stop            — arrêter les services"
  echo "    ./run.sh ${profile_flag}restart         — redémarrer les services"
  echo "    ./run.sh ${profile_flag}status          — état des conteneurs"
  echo "    ./run.sh ${profile_flag}seed            — injecter données de démo"
  echo "    ./run.sh ${profile_flag}reset           — ⚠  tout réinitialiser"
  echo "    ./run.sh help            — toutes les commandes"
  echo ""
}

# ══════════════════════════════════════════════════════════════════
#  Point d'entrée principal
# ══════════════════════════════════════════════════════════════════

# Toujours rendre le script exécutable
[ ! -x "${BASH_SOURCE[0]}" ] && chmod +x "${BASH_SOURCE[0]}" 2>/dev/null || true

parse_args "$@"

case "$CMD" in

  # ─── Démarrer (défaut) ─────────────────────────────────────────
  up|start)
    print_banner
    acquire_sudo
    check_prerequisites
    setup_docker
    setup_env

    log_step "Construction des images Docker"
    if ! $DC build --parallel; then
      log_error "Échec de la construction des images Docker."
      echo ""
      echo "  Conseils de dépannage :"
      echo "    • Vérifiez votre connexion internet"
      echo "    • Consultez les logs ci-dessus pour l'erreur exacte"
      echo "    • Réessayez : ./run.sh"
      exit 1
    fi

    log_step "Démarrage de tous les services"
    if ! $DC up -d "${CMD_ARGS[@]}"; then
      log_error "Échec du démarrage des services."
      echo "  Consultez les logs : ./run.sh logs"
      exit 1
    fi

    wait_ready
    print_urls
    ;;

  # ─── Arrêter ───────────────────────────────────────────────────
  stop)
    acquire_sudo
    setup_docker
    log_step "Arrêt des services"
    $DC stop
    log_info "Services arrêtés (données conservées)."
    ;;

  # ─── Redémarrer ────────────────────────────────────────────────
  restart)
    acquire_sudo
    setup_docker
    log_step "Redémarrage des services"
    $DC restart "${CMD_ARGS[@]}"
    log_info "Services redémarrés."
    ;;

  # ─── Supprimer les conteneurs (données conservées) ─────────────
  down)
    acquire_sudo
    setup_docker
    log_step "Suppression des conteneurs"
    log_warn "Les volumes de données (BDD, fichiers) sont conservés."
    $DC down
    log_info "Conteneurs supprimés."
    ;;

  # ─── Tout supprimer (données incluses) ─────────────────────────
  reset)
    acquire_sudo
    setup_docker
    echo ""
    log_warn "ATTENTION : cette opération supprime TOUTES les données (BDD + fichiers MinIO)."
    echo ""
    read -r -p "  Tapez 'oui' pour confirmer : " CONFIRM
    if [ "$CONFIRM" = "oui" ]; then
      $DC down -v --remove-orphans
      log_info "Tout supprimé (conteneurs + volumes)."
    else
      log_info "Annulé — aucune donnée supprimée."
    fi
    ;;

  # ─── Logs ──────────────────────────────────────────────────────
  logs)
    acquire_sudo
    setup_docker
    $DC logs -f --tail=150 "${CMD_ARGS[@]}"
    ;;

  # ─── État ──────────────────────────────────────────────────────
  status|ps)
    acquire_sudo
    setup_docker
    log_step "État des services"
    $DC ps "${CMD_ARGS[@]}"
    ;;

  # ─── Seed ──────────────────────────────────────────────────────
  seed)
    acquire_sudo
    setup_docker
    log_step "Injection des données de démonstration"
    # Le service backend doit tourner
    if ! ($DC ps | grep -q 'gmao_backend.*Up'); then
      log_warn "Le service backend n'est pas démarré. Tentative de démarrage..."
      $DC up -d backend
      sleep 5
    fi
    $DC exec backend sh -c "cd /app/backend && sh prisma/seed.sh" \
      && log_info "Seed terminé avec succès." \
      || { log_error "Erreur lors du seed. Vérifiez : ./run.sh logs backend"; exit 1; }
    ;;

  # ─── Mise à jour ───────────────────────────────────────────────
  update)
    acquire_sudo
    setup_docker
    log_step "Mise à jour de l'application"
    if [ -d ".git" ]; then
      git pull --ff-only && log_info "Code mis à jour depuis git."
    else
      log_warn "Pas de dépôt git détecté — mise à jour du code ignorée."
    fi
    $DC build --parallel
    $DC up -d
    log_info "Application mise à jour et redémarrée."
    ;;

  # ─── Shell interactif ──────────────────────────────────────────
  shell)
    acquire_sudo
    setup_docker
    local svc="${CMD_ARGS[0]:-backend}"
    log_info "Ouverture d'un shell dans le conteneur '${svc}'..."
    $DC exec "$svc" sh
    ;;

  # ─── Aide ──────────────────────────────────────────────────────
  help|-h|--help)
    print_banner
    echo -e "${BOLD}Usage :${NC}  ./run.sh [options] [commande]"
    echo ""
    echo -e "${BOLD}Options générales :${NC}"
    echo "  --dev                    Mode développement (hot-reload, Vite)"
    echo "  --prod                   Mode production (Nginx) (défaut)"
    echo "  --seed, -s               Injecter les données de démo au premier 'up'"
    echo ""
    echo -e "${BOLD}Commandes principales :${NC}"
    echo "  up                       Installer, configurer et démarrer (défaut)"
    echo "  stop                     Arrêter les services (données conservées)"
    echo "  restart                  Redémarrer les services"
    echo "  down                     Supprimer les conteneurs (données conservées)"
    echo "  reset                    ⚠  Tout supprimer y compris les données"
    echo ""
    echo -e "${BOLD}Commandes de débogage et maintenance :${NC}"
    echo "  logs [service]           Logs temps réel (ex: backend, frontend, postgres)"
    echo "  status                   État de tous les conteneurs"
    echo "  seed                     Injecter les données de démonstration"
    echo "  update                   git pull + rebuild + restart"
    echo "  shell [service]          Shell dans un conteneur (défaut : backend)"
    echo ""
    echo -e "${BOLD}Exemples :${NC}"
    echo "  ./run.sh --dev              # Démarrer en mode DÉVELOPPEMENT"
    echo "  ./run.sh                    # Démarrer en mode PRODUCTION (défaut)"
    echo "  ./run.sh --dev --seed       # Démarrer en dev avec les données de démo"
    echo "  ./run.sh --prod logs backend # Logs du backend en mode production"
    echo "  ./run.sh --dev shell frontend # Shell dans le conteneur frontend (dev)"
    echo ""
    ;;

  *)
    log_error "Commande inconnue : '$CMD'."
    echo "  Lancez  ./run.sh help  pour la liste des commandes."
    exit 1
    ;;
esac
