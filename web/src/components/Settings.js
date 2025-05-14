import React from 'react';
import { Typography, Paper, Box, TextField, Button, Alert, Divider } from '@mui/material';

const Settings = () => {
  return (
    <Box sx={{ mt: 2, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Paramètres
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Information
        </Typography>
        <Typography variant="body1" paragraph>
          Cette page est une maquette de l'interface de configuration. Dans un environnement de production, les paramètres sont configurés via les fichiers .env ou via une interface admin protégée.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          Pour configurer le client et le serveur, veuillez éditer les fichiers .env correspondants.
        </Alert>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configuration des serveurs Fishnet
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configuration exemple (en lecture seule)
        </Typography>
        
        <TextField
          label="Configuration JSON des serveurs"
          multiline
          fullWidth
          rows={4}
          defaultValue={`[
  {"name":"Server1","url":"http://192.168.1.10:9000/api/status"},
  {"name":"Server2","url":"http://192.168.1.11:9000/api/status"}
]`}
          InputProps={{
            readOnly: true,
          }}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" gutterBottom>
          Format de configuration :
        </Typography>
        <Box component="pre" sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          borderRadius: 1,
          overflow: 'auto',
          fontSize: '0.875rem'
        }}>
{`[
  {
    "name": "NomDuServeur",
    "url": "http://adresse-ip:port/api/status"  // Pour les serveurs avec API REST
  },
  {
    "name": "AutreServeur",
    "ip": "192.168.1.10",                       // Pour connexion SSH
    "port": "22",
    "sshUser": "utilisateur",
    "sshKey": "chemin/vers/cle"
  }
]`}
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          À propos
        </Typography>
        <Typography variant="body2" paragraph>
          Fishnet Monitor v1.0.0
        </Typography>
        <Typography variant="body2">
          Un tableau de bord pour surveiller en temps réel les serveurs Fishnet pour Lichess.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Settings;
