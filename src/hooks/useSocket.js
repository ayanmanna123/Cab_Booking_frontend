import { useEffect } from 'react';
import { useSocketContext } from '../context/SocketContext';

/**
 * Custom hook to subscribe to socket events with automatic cleanup
 */
export function useSocketEvent(event, callback) {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket || !event || !callback) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);
}

export function useSocket() {
  return useSocketContext();
}
