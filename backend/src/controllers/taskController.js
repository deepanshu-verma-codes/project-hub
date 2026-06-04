const taskService = require('../services/taskService');

/**
 * Task Controller Layer
 * Handles HTTP requests, extracts parameters, and delegates to the Service Layer.
 */
const Task = require('../models/Task');

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
    const { title, description, status, projectId } = req.body;
    const task = await Task.create({
      title,
      description,
      status: status || 'Todo',
      projectId,
      assigneeId: req.user._id
    });

    if (req.io) {
      req.io.to(projectId).emit('task:created', task);
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
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    next(error); // Pass to global centralized error-handling engine
  }
};

module.exports = {
  getTasks,
  createTask,
  deleteTask,
  updateTaskStatus
};
