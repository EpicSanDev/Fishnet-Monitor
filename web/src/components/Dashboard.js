import React, { useState, useEffect } from 'react';
import { Grid, Typography, Paper, Box, CircularProgress, Alert } from '@mui/material';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import ServerCard from './ServerCard';
import StatusSummary from './StatusSummary';

const Dashboard = () => {
  const { socket, isConnected } = useSocket();
  const [servers, setServers] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLatestStats = async () => {
    try {
      const response = await axios.get('/api/stats/latest');
      setServers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching latest stats:', err);
      setError('Failed to fetch server data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get('/api/stats/summary');
      setSummary(response.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  useEffect(() => {
    fetchLatestStats();
    fetchSummary();
    
    // Set up interval to refresh data
    const interval = setInterval(() => {
      fetchLatestStats();
      fetchSummary();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (socket) {
      // Listen for real-time updates
      socket.on('stats-updated', (newStats) => {
        setServers(prevServers => {
          const updatedServers = [...prevServers];
          
          // Update servers with new data
          newStats.forEach(newStat => {
            const index = updatedServers.findIndex(server => server.name === newStat.name);
            if (index !== -1) {
              updatedServers[index] = newStat;
            } else {
              updatedServers.push(newStat);
            }
          });
          
          return updatedServers;
        });
        
        // Refresh summary after receiving new stats
        fetchSummary();
      });
      
      return () => {
        socket.off('stats-updated');
      };
    }
  }, [socket]);

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
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <div>
      <Typography variant="h4" sx={{ mb: 3, mt: 2 }}>
        Dashboard
        {!isConnected && (
          <Typography component="span" color="error" sx={{ ml: 2, fontSize: '0.8rem', verticalAlign: 'middle' }}>
            (Offline mode)
          </Typography>
        )}
      </Typography>
      
      {/* Status Summary */}
      <StatusSummary summary={summary} />
      
      {/* Server Cards */}
      <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>
        Server Status
      </Typography>
      
      <Grid container spacing={3}>
        {servers.length > 0 ? (
          servers.map((server) => (
            <Grid item xs={12} sm={6} md={4} key={server.name}>
              <ServerCard server={server} />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No server data available. Please check your client configuration.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </div>
  );
};

export default Dashboard;
