const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

// Configuration du logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Configuration des serveurs Fishnet
let FISHNET_SERVERS = [];
try {
  FISHNET_SERVERS = JSON.parse(process.env.FISHNET_SERVERS || '[]');
  if (!Array.isArray(FISHNET_SERVERS)) {
    throw new Error('FISHNET_SERVERS doit être un tableau');
  }
} catch (error) {
  logger.error(`Erreur de configuration: ${error.message}`);
  process.exit(1);
}

// URL du serveur backend
const SERVER_URL = process.env.SERVER_URL || 'http://server:3000/api/stats';
const COLLECTION_INTERVAL = parseInt(process.env.COLLECTION_INTERVAL || '30000', 10);

// Fonction pour collecter les données d'un serveur Fishnet
async function collectServerStats(server) {
  try {
    // Récupération des données du serveur Fishnet
    logger.info(`Collecte des données pour le serveur ${server.name}`);
    
    // Si le serveur a une URL d'API, utiliser celle-ci
    if (server.url) {
      const response = await axios.get(server.url, { timeout: 5000 });
      return {
        name: server.name,
        timestamp: new Date().toISOString(),
        status: 'online',
        data: response.data
      };
    }
    
    // Sinon, collecter des données système via SSH ou autres méthodes
    // Exemple simplifié pour l'instant
    return {
      name: server.name,
      timestamp: new Date().toISOString(),
      status: 'unknown',
      data: {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        fishnetStatus: Math.random() > 0.2 ? 'running' : 'stopped',
        activeJobs: Math.floor(Math.random() * 20)
      }
    };
  } catch (error) {
    logger.error(`Erreur lors de la collecte des données pour ${server.name}: ${error.message}`);
    return {
      name: server.name,
      timestamp: new Date().toISOString(),
      status: 'offline',
      error: error.message
    };
  }
}

// Fonction pour envoyer les données au serveur
async function sendStatsToServer(stats) {
  try {
    await axios.post(SERVER_URL, stats, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    logger.info(`Données envoyées avec succès au serveur`);
  } catch (error) {
    logger.error(`Erreur lors de l'envoi des données au serveur: ${error.message}`);
    // Stocker localement en cas d'échec pour réessayer plus tard
    const backupFile = path.join('logs', `backup-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(stats));
    logger.info(`Données sauvegardées dans ${backupFile}`);
  }
}

// Fonction principale de collecte
async function collectAllStats() {
  try {
    logger.info('Début de la collecte des statistiques');
    
    // Collecter les statistiques de tous les serveurs
    const allStats = await Promise.all(FISHNET_SERVERS.map(collectServerStats));
    
    // Envoyer les données au serveur
    await sendStatsToServer(allStats);
  } catch (error) {
    logger.error(`Erreur lors de la collecte des statistiques: ${error.message}`);
  }
}

// Démarrer la collecte périodique
logger.info(`Démarrage du client de surveillance Fishnet avec ${FISHNET_SERVERS.length} serveurs`);
logger.info(`Intervalle de collecte: ${COLLECTION_INTERVAL}ms`);

// Exécuter immédiatement une première fois
collectAllStats();

// Puis configurer la tâche récurrente
setInterval(collectAllStats, COLLECTION_INTERVAL);

// Gérer les signaux d'arrêt
process.on('SIGINT', () => {
  logger.info('Arrêt du client...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error(`Exception non gérée: ${error.message}`, { stack: error.stack });
});
