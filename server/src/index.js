const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configuration du logger
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Routes
const statsRoutes = require('./routes/stats');

// Configuration de l'application Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware pour rendre io accessible dans les routes
app.set('io', io);

// Middleware pour parser le corps des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware CORS
app.use(cors());

// Routes API
app.use('/api/stats', statsRoutes);

// Servir l'interface web en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../web/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../web/build', 'index.html'));
  });
}

// Connexion à MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:27017/fishnet-monitor';
mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connexion à MongoDB établie');
    
    // Configuration de la nettoyage automatique des anciennes données
    const ServerStats = require('./models/ServerStats');
    const DATA_RETENTION_DAYS = parseInt(process.env.DATA_RETENTION_DAYS || '30', 10);
    
    // Nettoyer les anciennes données chaque jour à minuit
    setInterval(async () => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DATA_RETENTION_DAYS);
        
        const result = await ServerStats.deleteMany({
          timestamp: { $lt: cutoffDate }
        });
        
        logger.info(`Nettoyage des données: ${result.deletedCount} enregistrements supprimés`);
      } catch (error) {
        logger.error(`Erreur lors du nettoyage des données: ${error.message}`);
      }
    }, 24 * 60 * 60 * 1000);
  })
  .catch(err => {
    logger.error(`Erreur de connexion à MongoDB: ${err.message}`);
    process.exit(1);
  });

// Configuration Socket.IO
io.on('connection', (socket) => {
  logger.info(`Nouvelle connexion Socket.IO: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Déconnexion Socket.IO: ${socket.id}`);
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error(`Exception non gérée: ${error.message}`, { stack: error.stack });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesse rejetée non gérée', { reason });
});
