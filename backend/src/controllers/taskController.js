const taskService = require('../services/taskService');

/**
 * Task Controller Layer
 * Handles HTTP requests, extracts parameters, and delegates to the Service Layer.
 */
const Task = require('../models/Task');
const { createNotification } = require('./notificationController');

const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const tasks = await Task.find({ projectId }).sort({ position: 1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, status, projectId, priority } = req.body;
    
    // Explicit Input Validation
    if (!title || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Task title and projectId are required'
      });
    }

    // Parse links if they come as a stringified array from FormData
    let links = req.body.links;
    if (typeof links === 'string') {
      try {
        links = JSON.parse(links);
      } catch (e) {
        links = [links];
      }
    }

    // Process uploaded files into Base64 strings for the DB
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => 
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
      );
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'Todo',
      projectId,
      priority: priority || 'medium',
      links: links || [],
      imageUrls,
      assigneeId: req.user._id
    });

    if (req.io) {
      req.io.to(projectId).emit('task:created', task);
      createNotification({
        userId: req.user._id,
        message: `Task "${task.title}" was created by ${req.user.name}`,
        type: 'success',
        projectId: task.projectId
      });
    }

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    
    if (task && req.io) {
      req.io.to(task.projectId.toString()).emit('task:deleted', id);
      createNotification({
        userId: req.user._id,
        message: `Task "${task.title}" was deleted by ${req.user.name}`,
        type: 'warning',
        projectId: task.projectId
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, projectId } = req.body;

    // Delegate core logic to the service layer
    const updatedTask = await taskService.updateTaskStatus(id, status, projectId);

    // Broadcast explicitly to the target project room via Socket.io
    if (req.io) {
      req.io.to(projectId).emit('task:updated', updatedTask);
      createNotification({
        userId: req.user._id,
        message: `Task "${updatedTask.title}" moved to ${status} by ${req.user.name}`,
        type: 'info',
        projectId: updatedTask.projectId
      });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    next(error); // Pass to global centralized error-handling engine
  }
};

const reorderTasks = async (req, res, next) => {
  try {
    const { updates, projectId } = req.body; // updates is an array of { id, position, status }
    
    // Perform bulk write for efficiency
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.id, projectId },
        update: { position: update.position, status: update.status }
      }
    }));
    
    await Task.bulkWrite(bulkOps);

    // We can emit a single 'board:reordered' event if needed, or rely on client's optimistic update.
    if (req.io) {
      req.io.to(projectId).emit('board:reordered', updates);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, links, existingImageUrls } = req.body;
    
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.status = status !== undefined ? status : task.status;
    task.priority = priority !== undefined ? priority : task.priority;
    
    if (links !== undefined) {
      try {
        task.links = typeof links === 'string' ? JSON.parse(links) : links;
      } catch (e) {
        task.links = task.links;
      }
    }

    // Handle image updates
    let updatedImageUrls = [];
    if (existingImageUrls !== undefined) {
      try {
        updatedImageUrls = typeof existingImageUrls === 'string' ? JSON.parse(existingImageUrls) : existingImageUrls;
      } catch (e) {
        updatedImageUrls = task.imageUrls;
      }
    } else {
      updatedImageUrls = task.imageUrls;
    }

    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => 
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
      );
      updatedImageUrls = [...updatedImageUrls, ...newImageUrls];
    }
    
    task.imageUrls = updatedImageUrls.slice(0, 4);

    const updatedTask = await task.save();

    if (req.io) {
      req.io.to(updatedTask.projectId.toString()).emit('task:updated', updatedTask);
      createNotification({
        userId: req.user._id,
        message: `Task "${updatedTask.title}" was updated by ${req.user.name}`,
        type: 'info',
        projectId: updatedTask.projectId
      });
    }

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

const searchTasks = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const tasks = await Task.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    }).limit(20);

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  deleteTask,
  updateTaskStatus,
  reorderTasks,
  searchTasks,
  updateTask
};
