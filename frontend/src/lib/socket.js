import { io } from 'socket.io-client';
import { getToken } from './api';

const API_BASE = (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== null)
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:5000' : (typeof window !== 'undefined' ? window.location.origin : ''));

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_BASE, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: (cb) => {
        cb({ token: getToken() });
      }
    });
  }
  return socket;
};

export const connectSocket = (userId) => {
  const s = getSocket();
  s.auth = { token: getToken() };
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
