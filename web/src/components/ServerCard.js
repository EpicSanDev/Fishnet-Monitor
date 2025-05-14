import React from 'react';
import { Card, CardContent, CardActionArea, Typography, Box, Chip } from '@mui/material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';

const ServerCard = ({ server }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="status-online" />;
      case 'offline':
        return <ErrorIcon className="status-offline" />;
      default:
        return <HelpIcon className="status-unknown" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getFormattedTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss');
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Extraire des métriques importantes à afficher si disponibles
  const getFishnetMetrics = (data) => {
    if (!data) return null;

    // Pour les données spécifiques à Fishnet
    const fishnetData = [];
    
    if (data.fishnetStatus) {
      fishnetData.push(
        <Chip 
          key="status"
          label={`Status: ${data.fishnetStatus}`} 
          size="small" 
          color={data.fishnetStatus === 'running' ? 'success' : 'error'}
          sx={{ m: 0.5 }}
        />
      );
    }
    
    if (data.activeJobs !== undefined) {
      fishnetData.push(
        <Chip 
          key="jobs"
          label={`Jobs actifs: ${data.activeJobs}`} 
          size="small" 
          color="info" 
          sx={{ m: 0.5 }}
        />
      );
    }
    
    // Pour les métriques système standard
    if (data.cpuUsage !== undefined) {
      fishnetData.push(
        <Chip 
          key="cpu"
          label={`CPU: ${data.cpuUsage.toFixed(1)}%`} 
          size="small" 
          color={data.cpuUsage > 80 ? 'warning' : 'default'} 
          sx={{ m: 0.5 }}
        />
      );
    }
    
    if (data.memoryUsage !== undefined) {
      fishnetData.push(
        <Chip 
          key="memory"
          label={`RAM: ${data.memoryUsage.toFixed(1)}%`} 
          size="small" 
          color={data.memoryUsage > 80 ? 'warning' : 'default'} 
          sx={{ m: 0.5 }}
        />
      );
    }
    
    return fishnetData.length > 0 ? (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
        {fishnetData}
      </Box>
    ) : null;
  };

  return (
    <Card elevation={3}>
      <CardActionArea component={Link} to={`/server/${server.name}`}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" component="div">
              {server.name}
            </Typography>
            {getStatusIcon(server.status)}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip 
              label={server.status} 
              size="small" 
              color={getStatusColor(server.status)} 
              sx={{ mr: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              Mise à jour: {getFormattedTimestamp(server.timestamp)}
            </Typography>
          </Box>
          
          {server.error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              Erreur: {server.error}
            </Typography>
          )}
          
          {getFishnetMetrics(server.data)}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ServerCard;
