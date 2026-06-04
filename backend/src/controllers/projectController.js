const Project = require('../models/Project');

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

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject
};
