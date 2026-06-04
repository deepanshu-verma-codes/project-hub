require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    // 1. Create an Admin User
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123', // Will be hashed by the User model pre-save hook
      role: 'Admin'
    });
    console.log('Created Admin User: admin@example.com / password123');

    // 2. Create a Manager
    const managerUser = await User.create({
      name: 'Project Manager',
      email: 'manager@example.com',
      password: 'password123',
      role: 'Manager'
    });
    console.log('Created Manager User');

    // 3. Create a Developer
    const devUser = await User.create({
      name: 'Developer One',
      email: 'dev@example.com',
      password: 'password123',
      role: 'Developer'
    });
    console.log('Created Developer User');

    // 4. Create a Project
    const project = await Project.create({
      name: 'Internal Platform Rebuild',
      description: 'Q3 objective to migrate legacy systems to MERN stack.',
      ownerId: adminUser._id,
      members: [managerUser._id, devUser._id]
    });
    console.log(`Created Project: ${project.name}`);

    // 5. Create Sample Tasks
    const tasks = [
      {
        title: 'Initialize Backend Repository',
        description: 'Set up Express, Mongoose, and Socket.IO boilerplate.',
        status: 'Done',
        projectId: project._id,
        assigneeId: devUser._id,
        position: 0
      },
      {
        title: 'Design MongoDB Schemas',
        description: 'Define User, Project, and Task schemas with indexing.',
        status: 'In Progress',
        projectId: project._id,
        assigneeId: devUser._id,
        position: 0
      },
      {
        title: 'Implement Real-time Sync',
        description: 'Integrate Redis Pub/Sub for cross-instance broadcasts.',
        status: 'Todo',
        projectId: project._id,
        assigneeId: managerUser._id,
        position: 0
      },
      {
        title: 'Build Kanban UI',
        description: 'React + Zustand board with drag-and-drop support.',
        status: 'Todo',
        projectId: project._id,
        assigneeId: devUser._id,
        position: 1
      }
    ];

    await Task.insertMany(tasks);
    console.log(`Successfully seeded ${tasks.length} tasks.`);

    console.log('Seeding complete. Press Ctrl+C to exit.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
