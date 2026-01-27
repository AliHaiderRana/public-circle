import { io, Socket } from 'socket.io-client';
import { CONFIG, STORAGE_KEY } from '@/config/config';

// ----------------------------------------------------------------------

const getToken = () => localStorage.getItem(STORAGE_KEY) || '';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(CONFIG.serverUrl.trim(), {
      query: { token: getToken() },
      autoConnect: false,
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  s.io.opts.query = { token: getToken() };
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function updateSocketToken(): void {
  const s = getSocket();
  s.io.opts.query = { token: getToken() };
  s.disconnect();
  s.connect();
}

// Reconnect when token changes in another tab
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    updateSocketToken();
  }
});
