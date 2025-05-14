import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const ServerMetricsChart = ({ history }) => {
  const [selectedMetric, setSelectedMetric] = useState('status');
  const [availableMetrics, setAvailableMetrics] = useState([]);
  const [chartData, setChartData] = useState(null);

  // Extraire toutes les métriques disponibles dans les données
  useEffect(() => {
    if (history && history.length > 0) {
      const metrics = new Set(['status']);
      
      history.forEach(point => {
        if (point.data) {
          Object.keys(point.data).forEach(key => {
            if (typeof point.data[key] === 'number' || typeof point.data[key] === 'boolean') {
              metrics.add(key);
            }
          });
        }
      });
      
      setAvailableMetrics(Array.from(metrics));
      
      // Si la métrique sélectionnée n'est pas disponible, en choisir une par défaut
      if (!metrics.has(selectedMetric)) {
        setSelectedMetric(Array.from(metrics)[0]);
      }
    }
  }, [history]);

  // Préparer les données du graphique
  useEffect(() => {
    if (history && history.length > 0 && selectedMetric) {
      // Formater les données pour Chart.js
      const labels = history.map(point => {
        return format(parseISO(point.timestamp), 'HH:mm');
      });
      
      let values = [];
      
      if (selectedMetric === 'status') {
        // Convertir le statut en valeur numérique: online=1, offline=0, unknown=0.5
        values = history.map(point => {
          if (point.status === 'online') return 1;
          if (point.status === 'offline') return 0;
          return 0.5;
        });
      } else {
        // Extraire la métrique spécifique des données
        values = history.map(point => {
          if (point.data && point.data[selectedMetric] !== undefined) {
            // Convertir les booléens en nombre
            if (typeof point.data[selectedMetric] === 'boolean') {
              return point.data[selectedMetric] ? 1 : 0;
            }
            return point.data[selectedMetric];
          }
          return null;
        });
      }
      
      // Configurer les données du graphique
      const data = {
        labels,
        datasets: [
          {
            label: getMetricLabel(selectedMetric),
            data: values,
            borderColor: getMetricColor(selectedMetric),
            backgroundColor: getMetricColor(selectedMetric, 0.1),
            tension: 0.1,
            pointRadius: 2,
            pointHoverRadius: 5,
            fill: true,
            stepped: selectedMetric === 'status' || typeof values[0] === 'boolean'
          }
        ]
      };
      
      setChartData(data);
    }
  }, [history, selectedMetric]);

  // Fonction pour obtenir la couleur selon la métrique
  const getMetricColor = (metric, alpha = 1) => {
    const colors = {
      status: `rgba(25, 118, 210, ${alpha})`,
      cpuUsage: `rgba(255, 152, 0, ${alpha})`,
      memoryUsage: `rgba(76, 175, 80, ${alpha})`,
      fishnetStatus: `rgba(211, 47, 47, ${alpha})`,
      activeJobs: `rgba(123, 31, 162, ${alpha})`
    };
    
    return colors[metric] || `rgba(100, 100, 100, ${alpha})`;
  };

  // Fonction pour obtenir le libellé de la métrique
  const getMetricLabel = (metric) => {
    const labels = {
      status: 'Statut du serveur',
      cpuUsage: 'Utilisation CPU (%)',
      memoryUsage: 'Utilisation mémoire (%)',
      fishnetStatus: 'Statut Fishnet',
      activeJobs: 'Jobs actifs'
    };
    
    return labels[metric] || metric;
  };

  // Options du graphique
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        // Pour les métriques de statut, adapter l'échelle
        ...(selectedMetric === 'status' && {
          ticks: {
            callback: function(value) {
              if (value === 1) return 'En ligne';
              if (value === 0) return 'Hors ligne';
              if (value === 0.5) return 'Inconnu';
              return '';
            },
            stepSize: 0.5,
            max: 1,
            min: 0
          }
        })
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            if (selectedMetric === 'status') {
              const value = context.parsed.y;
              if (value === 1) return 'En ligne';
              if (value === 0) return 'Hors ligne';
              return 'Inconnu';
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    }
  };

  const handleMetricChange = (event) => {
    setSelectedMetric(event.target.value);
  };

  if (!chartData || history.length === 0) {
    return (
      <Typography variant="body1" align="center">
        Pas assez de données pour afficher un graphique
      </Typography>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" fullWidth>
          <InputLabel id="metric-select-label">Métrique</InputLabel>
          <Select
            labelId="metric-select-label"
            id="metric-select"
            value={selectedMetric}
            label="Métrique"
            onChange={handleMetricChange}
          >
            {availableMetrics.map((metric) => (
              <MenuItem key={metric} value={metric}>
                {getMetricLabel(metric)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ height: 400 }}>
        <Line data={chartData} options={options} />
      </Box>
    </Paper>
  );
};

export default ServerMetricsChart;
