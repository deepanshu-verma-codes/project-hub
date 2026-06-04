const Task = require('../models/Task');

/**
 * Task Service Layer
 * Encapsulates core business logic for task state transitions.
 */
class TaskService {
  /**
   * Updates a task's status and ensures the transition is saved securely.
   * @param {string} taskId - The ID of the task to update.
   * @param {string} newStatus - The target status ('Todo', 'In Progress', 'Review', 'Done').
   * @param {string} projectId - Ensure task belongs to the expected project.
   */
  async updateTaskStatus(taskId, newStatus, projectId) {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, projectId },
      { status: newStatus },
      { new: true, runValidators: true }
    );

    if (!task) {
      throw new Error('Task not found or does not belong to this project');
    }

    return task;
  }

  // Other business logic methods like createTask, assignUser, updatePosition...
}

module.exports = new TaskService();
