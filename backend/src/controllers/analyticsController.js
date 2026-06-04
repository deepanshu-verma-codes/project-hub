const Project = require('../models/Project');
const Task = require('../models/Task');

const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Get all projects accessible to the user
    const projects = await Project.find({
      $or: [
        { ownerId: req.user._id },
        { members: req.user._id },
        { visibility: 'public' }
      ]
    });

    const projectIds = projects.map(p => p._id);

    // 2. Get task stats across these projects
    const tasks = await Task.find({ projectId: { $in: projectIds } });

    const stats = {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      taskStatusDistribution: {
        Todo: tasks.filter(t => t.status === 'Todo').length,
        'In Progress': tasks.filter(t => t.status === 'In Progress').length,
        Review: tasks.filter(t => t.status === 'Review').length,
        Done: tasks.filter(t => t.status === 'Done').length
      },
      recentProjects: projects.slice(0, 5).map(p => ({
        id: p._id,
        name: p.name,
        visibility: p.visibility,
        createdAt: p.createdAt
      }))
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
