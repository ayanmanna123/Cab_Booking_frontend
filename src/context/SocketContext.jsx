import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { CONFIG } from '../constants/config';
import { SOCKET_EVENTS } from '../constants/socketEvents';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize singleton socket connection
    const socketInstance = io(CONFIG.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('⚡ [Socket] Connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 [Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('⚠️ [Socket] Connection error:', error.message);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const emitEvent = (event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  const joinUserRoom = (userId) => {
    emitEvent(SOCKET_EVENTS.JOIN_USER_ROOM, { userId });
  };

  const joinDriverRoom = (driverId) => {
    emitEvent(SOCKET_EVENTS.JOIN_DRIVER_ROOM, { driverId });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        emitEvent,
        joinUserRoom,
        joinDriverRoom
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}
