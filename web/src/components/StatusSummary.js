import React from 'react';
import { Grid, Paper, Typography, Box, LinearProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const StatusSummary = ({ summary }) => {
  if (!summary || summary.length === 0) {
    return null;
  }

  // Calculer des statistiques globales
  const totalServers = summary.length;
  const onlineServers = summary.filter(server => server.latestStatus === 'online').length;
  const offlineServers = summary.filter(server => server.latestStatus === 'offline').length;
  const globalAvailability = totalServers > 0 
    ? summary.reduce((acc, server) => acc + server.availabilityPercentage, 0) / totalServers 
    : 0;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Résumé global
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              Disponibilité globale: {globalAvailability.toFixed(2)}%
            </Typography>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={globalAvailability} 
                color={globalAvailability > 90 ? 'success' : globalAvailability > 70 ? 'warning' : 'error'} 
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon color="success" sx={{ mr: 0.5 }} />
              <Typography variant="body2">
                {onlineServers} serveurs en ligne
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ErrorIcon color="error" sx={{ mr: 0.5 }} />
              <Typography variant="body2">
                {offlineServers} serveurs hors ligne
              </Typography>
            </Box>
            <Typography variant="body2">
              {totalServers} serveurs au total
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default StatusSummary;
