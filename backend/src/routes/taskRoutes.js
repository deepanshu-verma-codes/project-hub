const express = require('express');
const router = express.Router();
const { updateTaskStatus, getTasks, createTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// Protect all task routes
router.use(protect);

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

module.exports = router;
