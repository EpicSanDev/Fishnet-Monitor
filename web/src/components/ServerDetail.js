import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Typography, Box, Paper, Grid, Button, Chip, CircularProgress, Alert, Tab, Tabs } from '@mui/material';
import { format } from 'date-fns';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ServerMetricsChart from './ServerMetricsChart';
import { useSocket } from '../context/SocketContext';

const ServerDetail = () => {
  const { serverName } = useParams();
  const { socket } = useSocket();
  const [serverData, setServerData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(24); // Heures
  const [tabValue, setTabValue] = useState(0);

  const fetchServerData = async () => {
    try {
      const response = await axios.get(`/api/stats/latest`);
      const serverInfo = response.data.find(s => s.name === serverName);
      
      if (!serverInfo) {
        setError(`Serveur "${serverName}" non trouvé`);
        setServerData(null);
      } else {
        setServerData(serverInfo);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching server data:', err);
      setError('Impossible de récupérer les informations du serveur.');
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`/api/stats/history/${serverName}?hours=${timeRange}`);
      setHistory(response.data);
    } catch (err) {
      console.error('Error fetching history:', err);
      // Ne pas afficher d'erreur car l'historique est secondaire
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerData();
    fetchHistory();
    
    // Rafraîchir toutes les minutes
    const interval = setInterval(() => {
      fetchServerData();
      fetchHistory();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [serverName, timeRange]);

  useEffect(() => {
    if (socket) {
      socket.on('stats-updated', (newStats) => {
        const updatedServer = newStats.find(stat => stat.name === serverName);
        if (updatedServer) {
          setServerData(updatedServer);
          fetchHistory(); // Rafraîchir l'historique aussi
        }
      });
      
      return () => {
        socket.off('stats-updated');
      };
    }
  }, [socket, serverName]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTimeRangeChange = (hours) => {
    setTimeRange(hours);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Button component={Link} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
          Retour au tableau de bord
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!serverData) {
    return (
      <Box sx={{ mt: 2 }}>
        <Button component={Link} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
          Retour au tableau de bord
        </Button>
        <Alert severity="warning">Aucune donnée disponible pour ce serveur</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Button component={Link} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Retour au tableau de bord
      </Button>
      
      <Typography variant="h4" gutterBottom>
        {serverName}
        <Chip 
          label={serverData.status} 
          color={serverData.status === 'online' ? 'success' : serverData.status === 'offline' ? 'error' : 'warning'} 
          size="small" 
          sx={{ ml: 2 }} 
        />
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Dernière mise à jour: {format(new Date(serverData.timestamp), 'dd/MM/yyyy HH:mm:ss')}
      </Typography>

      <Paper sx={{ mt: 3, p: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Informations" />
          <Tab label="Historique" />
        </Tabs>
        
        {tabValue === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Statut actuel
              </Typography>
              
              {serverData.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {serverData.error}
                </Alert>
              )}
              
              {serverData.data && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(serverData.data).map(([key, value]) => (
                    <Chip 
                      key={key}
                      label={`${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`}
                      size="small"
                      sx={{ m: 0.5 }}
                      color={
                        key.includes('Usage') && value > 80 ? 'warning' : 
                        key.includes('Status') && value === 'running' ? 'success' :
                        key.includes('Status') ? 'error' : 'default'
                      }
                    />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        )}
        
        {tabValue === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant={timeRange === 3 ? "contained" : "outlined"} 
                  size="small" 
                  onClick={() => handleTimeRangeChange(3)}
                >
                  3h
                </Button>
                <Button 
                  variant={timeRange === 12 ? "contained" : "outlined"} 
                  size="small" 
                  onClick={() => handleTimeRangeChange(12)}
                >
                  12h
                </Button>
                <Button 
                  variant={timeRange === 24 ? "contained" : "outlined"} 
                  size="small" 
                  onClick={() => handleTimeRangeChange(24)}
                >
                  24h
                </Button>
                <Button 
                  variant={timeRange === 72 ? "contained" : "outlined"} 
                  size="small" 
                  onClick={() => handleTimeRangeChange(72)}
                >
                  3j
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              {history.length > 0 ? (
                <ServerMetricsChart history={history} />
              ) : (
                <Alert severity="info">
                  Aucune donnée historique disponible pour cette période
                </Alert>
              )}
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default ServerDetail;
