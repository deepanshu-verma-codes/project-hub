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
  const { 
    onTaskUpdatedByPeer, 
    onTaskCreatedByPeer, 
    onTaskDeletedByPeer,
    onProjectCreatedByPeer,
    onProjectDeletedByPeer,
    onProjectUpdatedByPeer,
    recordActivity,
    addNotification
  } = useBoardStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      if (projectId) {
        // Explicitly join the project room
        socket.emit('room:join', projectId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
      if (err.message && err.message.toLowerCase().includes('authentication error')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    });

    socket.on('task:updated', (updatedTask) => {
      onTaskUpdatedByPeer(updatedTask);
      recordActivity(`Task "${updatedTask.title}" was updated by a teammate`, 'info');
      addNotification(`Task "${updatedTask.title}" updated`, 'info');
    });

    socket.on('task:created', (newTask) => {
      onTaskCreatedByPeer(newTask);
      recordActivity(`New task "${newTask.title}" created in project`, 'success');
      addNotification(`New task: ${newTask.title}`, 'success');
    });

    socket.on('task:deleted', (taskId) => {
      onTaskDeletedByPeer(taskId);
      recordActivity(`A task was deleted from the project`, 'warning');
      addNotification(`Task deleted`, 'warning');
    });

    socket.on('project:created', (newProject) => {
      onProjectCreatedByPeer(newProject);
      recordActivity(`New project "${newProject.name}" created`, 'success');
      addNotification(`New project: ${newProject.name}`, 'success');
    });

    socket.on('project:updated', (updatedProject) => {
      onProjectUpdatedByPeer(updatedProject);
      recordActivity(`Project "${updatedProject.name}" settings updated`, 'info');
      addNotification(`Project "${updatedProject.name}" updated`, 'info');
    });

    socket.on('project:deleted', (projectId) => {
      onProjectDeletedByPeer(projectId);
      recordActivity(`A project was deleted from the workspace`, 'warning');
      addNotification(`Project deleted`, 'warning');
    });

    return () => {
      if (projectId) {
        socket.emit('room:leave', projectId);
      }
      socket.disconnect();
    };
  }, [projectId, onTaskUpdatedByPeer, onTaskCreatedByPeer, onTaskDeletedByPeer, onProjectCreatedByPeer, onProjectDeletedByPeer]);

  return { socket: socketRef.current, isConnected };
};
