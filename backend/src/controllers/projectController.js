const Project = require('../models/Project');
const Task = require('../models/Task');
const { createNotification } = require('./notificationController');

/**
 * Project Controller
 */
const getProjects = async (req, res, next) => {
  try {
    // Return projects where user is owner or member, OR if it is public
    const projects = await Project.find({
      $or: [
        { ownerId: req.user._id },
        { members: req.user._id },
        { visibility: 'public' }
      ]
    }).sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { name, description, visibility } = req.body;
    
    const project = await Project.create({
      name,
      description,
      visibility: visibility || 'private',
      ownerId: req.user._id,
      members: [req.user._id]
    });

    if (req.io) {
      if (project.visibility === 'public') {
        req.io.to('workspace').emit('project:created', project);
      } else {
        req.io.to(`user:${req.user._id}`).emit('project:created', project);
      }
      createNotification({
        userId: req.user._id,
        message: `Project "${project.name}" was created by ${req.user.name}`,
        type: 'success',
        projectId: project._id
      });
    }

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or admin
    if (project.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    await project.deleteOne();
    
    // Delete all tasks associated with this project
    await Task.deleteMany({ projectId: req.params.id });

    if (req.io) {
      req.io.to('workspace').emit('project:deleted', req.params.id);
      createNotification({
        userId: req.user._id,
        message: `Project "${project.name}" was deleted by ${req.user.name}`,
        type: 'warning'
      });
    }

    res.json({ message: 'Project and associated tasks removed' });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { name, description, visibility } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or admin
    if (project.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    project.name = name || project.name;
    project.description = description || project.description;
    project.visibility = visibility || project.visibility;

    const updatedProject = await project.save();

    if (req.io) {
      req.io.to('workspace').emit('project:updated', updatedProject);
      createNotification({
        userId: req.user._id,
        message: `Project "${updatedProject.name}" settings updated by ${req.user.name}`,
        type: 'info',
        projectId: updatedProject._id
      });
    }

    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject,
  deleteProject,
  updateProject
};
