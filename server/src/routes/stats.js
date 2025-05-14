const express = require('express');
const router = express.Router();
const ServerStats = require('../models/ServerStats');

// Récupérer les dernières statistiques de tous les serveurs
router.get('/latest', async (req, res) => {
  try {
    // Sous-requête pour trouver la dernière timestamp pour chaque serveur
    const latestTimestamps = await ServerStats.aggregate([
      {
        $group: {
          _id: '$name',
          latestTimestamp: { $max: '$timestamp' }
        }
      }
    ]);

    if (latestTimestamps.length === 0) {
      return res.status(404).json({ message: 'Aucune donnée trouvée' });
    }

    // Récupérer les documents correspondant aux dernières timestamps
    const latestStats = await Promise.all(
      latestTimestamps.map(({ _id, latestTimestamp }) =>
        ServerStats.findOne({
          name: _id,
          timestamp: latestTimestamp
        })
      )
    );

    res.json(latestStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer l'historique des statistiques pour un serveur spécifique
router.get('/history/:serverName', async (req, res) => {
  try {
    const { serverName } = req.params;
    const { hours = 24 } = req.query;
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - parseInt(hours));
    
    const stats = await ServerStats.find({
      name: serverName,
      timestamp: { $gte: cutoffTime }
    }).sort({ timestamp: 1 });
    
    if (stats.length === 0) {
      return res.status(404).json({ 
        message: `Aucune donnée trouvée pour le serveur ${serverName} dans les dernières ${hours} heures` 
      });
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enregistrer les statistiques d'un ou plusieurs serveurs
router.post('/', async (req, res) => {
  try {
    const stats = Array.isArray(req.body) ? req.body : [req.body];
    
    // Valider les données
    if (stats.some(stat => !stat.name || !stat.timestamp)) {
      return res.status(400).json({ 
        message: 'Chaque entrée doit contenir au moins name et timestamp' 
      });
    }
    
    // Enregistrer les statistiques
    const savedStats = await ServerStats.insertMany(stats);
    
    // Émettre un événement via Socket.IO pour notification en temps réel
    req.app.get('io').emit('stats-updated', savedStats);
    
    res.status(201).json(savedStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir la liste des noms de serveurs uniques
router.get('/servers', async (req, res) => {
  try {
    const servers = await ServerStats.distinct('name');
    res.json(servers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer les résumés des statistiques pour tous les serveurs
router.get('/summary', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - parseInt(hours));
    
    const summary = await ServerStats.aggregate([
      {
        $match: {
          timestamp: { $gte: cutoffTime }
        }
      },
      {
        $group: {
          _id: '$name',
          totalRecords: { $sum: 1 },
          onlineCount: {
            $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] }
          },
          offlineCount: {
            $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] }
          },
          latestTimestamp: { $max: '$timestamp' },
          latestStatus: { $last: '$status' }
        }
      },
      {
        $project: {
          name: '$_id',
          _id: 0,
          totalRecords: 1,
          onlineCount: 1,
          offlineCount: 1,
          availabilityPercentage: {
            $multiply: [
              { $divide: ['$onlineCount', { $max: ['$totalRecords', 1] }] },
              100
            ]
          },
          latestTimestamp: 1,
          latestStatus: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
