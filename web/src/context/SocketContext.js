import React, { createContext, useContext, useEffect, useState } from 'react';

const SocketContext = createContext(null);

export function SocketProvider({ children, socket }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastPong, setLastPong] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('pong', () => {
      setLastPong(new Date().toISOString());
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('pong');
    };
  }, [socket]);

  const ping = () => {
    socket.emit('ping');
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, lastPong, ping }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === null) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
