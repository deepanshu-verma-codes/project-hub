const Notification = require('../models/Notification');

// @desc    Get all notifications for the logged in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    // For now, we fetch all notifications that the user might be interested in.
    // In a real app, you'd filter by projectId or shared workspace.
    // To keep it simple as requested, we'll fetch all and show them.
    // We could filter by userId if we want "Personal" notifications, 
    // but the activity log seems to be shared.
    
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new notification (Internal use)
const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = {
  getNotifications,
  createNotification
};
