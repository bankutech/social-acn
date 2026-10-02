import { io } from 'socket.io-client';

import { API_BASE } from './api';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_BASE, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      withCredentials: true,
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
