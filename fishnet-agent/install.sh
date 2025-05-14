#!/bin/bash
# Script d'installation pour Fishnet Monitor Agent

# Vérifier les privilèges root
if [ "$(id -u)" -ne 0 ]; then
    echo "Ce script doit être exécuté en tant que root"
    exit 1
fi

# Variables
INSTALL_DIR="/opt/fishnet-agent"
SERVICE_FILE="/etc/systemd/system/fishnet-agent.service"
DASHBOARD_URL="http://votre-dashboard-server:3000/api/stats"
SERVER_NAME=$(hostname)
INTERVAL=30

# Installer les dépendances
echo "Installation des dépendances..."
if command -v apt-get &> /dev/null; then
    apt-get update
    apt-get install -y python3 python3-pip
elif command -v yum &> /dev/null; then
    yum install -y python3 python3-pip
elif command -v dnf &> /dev/null; then
    dnf install -y python3 python3-pip
else
    echo "Gestionnaire de paquets non reconnu. Veuillez installer Python 3 et pip manuellement."
    exit 1
fi

# Installer les modules Python requis
echo "Installation des modules Python..."
pip3 install requests psutil

# Créer le répertoire d'installation
echo "Création du répertoire d'installation..."
mkdir -p "$INSTALL_DIR"

# Demander l'URL du serveur de dashboard
read -p "URL du serveur de dashboard [$DASHBOARD_URL]: " user_input
DASHBOARD_URL=${user_input:-$DASHBOARD_URL}

# Demander le nom du serveur
read -p "Nom du serveur [$SERVER_NAME]: " user_input
SERVER_NAME=${user_input:-$SERVER_NAME}

# Demander l'intervalle d'envoi
read -p "Intervalle d'envoi en secondes [$INTERVAL]: " user_input
INTERVAL=${user_input:-$INTERVAL}

# Demander le nom du processus Fishnet
read -p "Nom du processus Fishnet [fishnet]: " FISHNET_PROCESS
FISHNET_PROCESS=${FISHNET_PROCESS:-fishnet}

# Copier le script
echo "Installation du script agent..."
cp fishnet-agent.py "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/fishnet-agent.py"

# Créer le service systemd
echo "Configuration du service systemd..."
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Fishnet Monitor Agent
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 $INSTALL_DIR/fishnet-agent.py
Restart=always
RestartSec=10
Environment=FISHNET_MONITOR_URL=$DASHBOARD_URL
Environment=FISHNET_MONITOR_NAME=$SERVER_NAME
Environment=FISHNET_MONITOR_INTERVAL=$INTERVAL
Environment=FISHNET_PROCESS_NAME=$FISHNET_PROCESS

[Install]
WantedBy=multi-user.target
EOF

# Activer et démarrer le service
echo "Activation et démarrage du service..."
systemctl daemon-reload
systemctl enable fishnet-agent
systemctl start fishnet-agent

# Vérifier le statut
echo "Vérification du statut du service..."
systemctl status fishnet-agent

echo
echo "Installation terminée!"
echo "L'agent Fishnet Monitor est maintenant installé et configuré."
echo "Utilisation:"
echo "  - Pour vérifier les logs: journalctl -u fishnet-agent"
echo "  - Pour redémarrer l'agent: systemctl restart fishnet-agent"
echo "  - Pour arrêter l'agent: systemctl stop fishnet-agent"
