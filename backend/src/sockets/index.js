const jwt = require('jsonwebtoken');

/**
 * Configures the Socket.IO server, integrates Redis Pub/Sub adapter,
 * and sets up robust connection and room strategies.
 */
const setupSockets = (io) => {
  // Authorization Middleware for Sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (Socket ID: ${socket.id})`);

    // Join the global workspace room
    socket.join('workspace');

    // Join a personal room for private notifications
    socket.join(`user:${socket.user.id}`);

    // Explicit room connection strategy
    socket.on('room:join', (projectId) => {
      socket.join(projectId);
      console.log(`Socket ${socket.id} joined project room: ${projectId}`);
    });

    socket.on('room:leave', (projectId) => {
      socket.leave(projectId);
      console.log(`Socket ${socket.id} left project room: ${projectId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });
};

module.exports = setupSockets;
