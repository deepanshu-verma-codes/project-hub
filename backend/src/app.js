require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const cors = require('cors');

const connectDB = require('./config/db');
const redisClient = require('./config/redis');
const setupSockets = require('./sockets');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Configure Redis Pub/Sub Adapter for Socket.IO clustering
const subClient = redisClient.duplicate();

subClient.on('error', (err) => {
  console.error('Redis SubClient Error:', err);
});

io.adapter(createAdapter(redisClient, subClient));

// Inject `io` into express request object for controller access
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Setup Socket logic
setupSockets(io);

// Express Middleware
app.use(cors({
  origin: true, // Reflects the request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = { app, server };
