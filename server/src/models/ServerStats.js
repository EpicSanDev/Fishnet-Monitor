const mongoose = require('mongoose');

const serverStatsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'unknown'],
    default: 'unknown'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  error: {
    type: String
  }
});

// Index composé pour les requêtes fréquentes
serverStatsSchema.index({ name: 1, timestamp: -1 });

const ServerStats = mongoose.model('ServerStats', serverStatsSchema);

module.exports = ServerStats;
