# Agent Fishnet Monitor

Ce dossier contient l'agent à installer sur chaque serveur Fishnet pour collecter et envoyer des données au dashboard.

## Contenu

- `fishnet-agent.py` - Script principal qui collecte les données et les envoie au serveur
- `fishnet-agent.service` - Fichier de service systemd
- `install.sh` - Script d'installation automatique

## Prérequis

- Python 3.6+
- Accès root au serveur
- Connexion réseau au serveur dashboard

## Installation manuelle

Si vous ne souhaitez pas utiliser le script d'installation automatique, voici les étapes manuelles:

1. Installez les dépendances Python:
   ```bash
   pip3 install requests psutil
   ```

2. Copiez le script `fishnet-agent.py` dans un répertoire approprié:
   ```bash
   mkdir -p /opt/fishnet-agent
   cp fishnet-agent.py /opt/fishnet-agent/
   chmod +x /opt/fishnet-agent/fishnet-agent.py
   ```

3. Configurez le service systemd:
   ```bash
   cp fishnet-agent.service /etc/systemd/system/
   nano /etc/systemd/system/fishnet-agent.service
   ```
   
   Modifiez les variables d'environnement dans le fichier service:
   - `FISHNET_MONITOR_URL` - URL de votre serveur dashboard
   - `FISHNET_MONITOR_NAME` - Nom de ce serveur Fishnet
   - `FISHNET_MONITOR_INTERVAL` - Intervalle d'envoi en secondes
   - `FISHNET_PROCESS_NAME` - Nom du processus Fishnet

4. Activez et démarrez le service:
   ```bash
   systemctl daemon-reload
   systemctl enable fishnet-agent
   systemctl start fishnet-agent
   ```

## Configuration avancée

### Adaptation pour votre environnement Fishnet

La fonction `get_active_jobs_count()` dans le script est un exemple et devrait être adaptée à votre environnement spécifique. Cette fonction essaie de déterminer le nombre de jobs actifs dans Fishnet.

Vous pourriez avoir besoin de modifier cette fonction pour:
- Lire un fichier de statut spécifique
- Appeler une API locale de Fishnet
- Exécuter une commande spécifique

### Dépannage

Si vous rencontrez des problèmes, vérifiez les logs:
```bash
journalctl -u fishnet-agent -f
# ou
cat /var/log/fishnet-agent.log
```

## Données collectées

L'agent collecte et envoie les données suivantes:

- **Nom du serveur**
- **Horodatage**
- **Statut** (online/offline)
- **Données système**:
  - Utilisation CPU (%)
  - Utilisation mémoire (%)
  - Utilisation disque (%)
  - Temps de fonctionnement (uptime)
- **Données Fishnet**:
  - Statut Fishnet (running/stopped)
  - Nombre de jobs actifs (estimé)
