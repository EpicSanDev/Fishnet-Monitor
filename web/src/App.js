import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import io from 'socket.io-client';

// Components
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import ServerDetail from './components/ServerDetail';
import Settings from './components/Settings';

// Utils
import { SocketProvider } from './context/SocketContext';

// Determine the base URL for the backend
const getBaseUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // In production, the frontend is served by nginx which proxies the API requests
  return `${protocol}//${hostname}`;
};

const socket = io(getBaseUrl(), {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

function App() {
  return (
    <SocketProvider socket={socket}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/server/:serverName" element={<ServerDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Box>
      </Box>
    </SocketProvider>
  );
}

export default App;
