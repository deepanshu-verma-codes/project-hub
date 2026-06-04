import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useBoardStore } from '../store/useBoardStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

/**
 * Custom Socket Hook
 * Handles persistent connections, auto-reconnect, and global event listeners.
 */
export const useSocket = (projectId) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const { onTaskUpdatedByPeer, onTaskCreatedByPeer, onTaskDeletedByPeer } = useBoardStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token || !projectId) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      // Explicitly join the project room
      socket.emit('room:join', projectId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
    });

    socket.on('task:updated', (updatedTask) => {
      onTaskUpdatedByPeer(updatedTask);
    });

    socket.on('task:created', (newTask) => {
      onTaskCreatedByPeer(newTask);
    });

    socket.on('task:deleted', (taskId) => {
      onTaskDeletedByPeer(taskId);
    });

    return () => {
      socket.emit('room:leave', projectId);
      socket.disconnect();
    };
  }, [projectId, onTaskUpdatedByPeer]);

  return { socket: socketRef.current, isConnected };
};
