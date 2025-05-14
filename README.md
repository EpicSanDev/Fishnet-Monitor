# Fishnet Monitor Dashboard

Un tableau de bord en temps réel pour surveiller vos serveurs Fishnet Lichess.

## Architecture

Le projet est composé de deux parties principales:

1. **Dashboard** (Dockerisé):
   - **Serveur** - API backend qui stocke les données et les fournit à l'interface web
   - **Web** - Interface utilisateur pour visualiser les données en temps réel

2. **Agent Fishnet** (À installer sur chaque serveur Fishnet):
   - Script léger qui collecte les données locales et les envoie au serveur dashboard

## Prérequis

- Docker et Docker Compose
- Les serveurs Fishnet doivent être accessibles sur le réseau

## Installation

### 1. Installation du Dashboard

1. Clonez ce dépôt:
   ```
   git clone <URL_DU_REPO>
   cd fishnet-monitor
   ```

2. Démarrez l'application avec Docker Compose:
   ```
   docker-compose up -d
   ```

3. Accédez au tableau de bord:
   Ouvrez votre navigateur à l'adresse `http://localhost` ou à l'adresse IP de votre serveur.

### 2. Installation de l'Agent sur chaque serveur Fishnet

Sur chaque serveur Fishnet que vous souhaitez surveiller, vous devez installer l'agent:

1. Copiez le dossier `fishnet-agent` sur le serveur Fishnet:
   ```
   scp -r fishnet-agent user@serveur-fishnet:/tmp/
   ```

2. Connectez-vous au serveur Fishnet et lancez le script d'installation:
   ```
   ssh user@serveur-fishnet
   cd /tmp/fishnet-agent
   chmod +x install.sh
   sudo ./install.sh
   ```

3. Suivez les instructions du script d'installation:
   - Entrez l'URL de votre serveur dashboard (exemple: `http://dashboard-server:3000/api/stats`)
   - Entrez un nom pour ce serveur Fishnet
   - Configurez l'intervalle d'envoi des données (30 secondes par défaut)
   - Entrez le nom du processus Fishnet à surveiller

4. Vérifiez que l'agent est bien en cours d'exécution:
   ```
   sudo systemctl status fishnet-agent
   ```

## Configuration

### Configuration du Serveur Dashboard

Le serveur peut être configuré via le fichier `.env`:

- `PORT` - Port d'écoute du serveur (par défaut: 3000)
- `MONGODB_URI` - URI de connexion à la base de données MongoDB
- `NODE_ENV` - Environnement (production, development)
- `DATA_RETENTION_DAYS` - Nombre de jours de conservation des données (30 par défaut)

### Configuration de l'Agent Fishnet

L'agent peut être configuré via des variables d'environnement dans le fichier service (`/etc/systemd/system/fishnet-agent.service`):

- `FISHNET_MONITOR_URL` - URL du serveur dashboard
- `FISHNET_MONITOR_NAME` - Nom du serveur
- `FISHNET_MONITOR_INTERVAL` - Intervalle d'envoi en secondes
- `FISHNET_PROCESS_NAME` - Nom du processus Fishnet à surveiller

Pour modifier la configuration après l'installation:
```bash
sudo nano /etc/systemd/system/fishnet-agent.service
sudo systemctl daemon-reload
sudo systemctl restart fishnet-agent
```

## Fonctionnalités

- **Tableau de bord** - Vue d'ensemble de tous les serveurs Fishnet
- **Détails par serveur** - Statistiques détaillées pour chaque serveur
- **Historique** - Graphiques d'évolution des métriques dans le temps
- **Notifications en temps réel** - Mises à jour instantanées via Socket.IO

## Architecture technique

- **Client**: Node.js, Axios pour les requêtes HTTP
- **Serveur**: Express.js, MongoDB, Socket.IO pour les communications temps réel
- **Interface web**: React, Material-UI, Chart.js pour les graphiques

## Structure des données

Les statistiques des serveurs sont stockées avec la structure suivante:

```json
{
  "name": "NomDuServeur",
  "timestamp": "2023-12-01T12:00:00Z",
  "status": "online",
  "data": {
    "cpuUsage": 45.2,
    "memoryUsage": 78.3,
    "fishnetStatus": "running",
    "activeJobs": 12
  }
}
```

## Maintenance

### Logs

Les logs du client et du serveur sont stockés dans leurs conteneurs respectifs. Pour les consulter:

```bash
# Logs du client
docker-compose logs client

# Logs du serveur
docker-compose logs server
```

### Sauvegarde

La base de données MongoDB est persistante via un volume Docker. Pour sauvegarder vos données:

```bash
docker-compose exec mongo mongodump --out /data/backup
docker cp <ID_CONTENEUR_MONGO>:/data/backup ./backup
```

## Licence

Ce projet est distribué sous licence MIT.
