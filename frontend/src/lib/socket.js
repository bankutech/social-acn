import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_BASE, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

export const connectSocket = (userId) => {
  const s = getSocket();
  const join = () => {
    if (userId) s.emit('join', userId);
  };

  // Ensure we always (re)identify after a connect.
  s.off('connect', join);
  s.on('connect', join);

  if (!s.connected) s.connect();
  else join();
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

export default getSocket;
