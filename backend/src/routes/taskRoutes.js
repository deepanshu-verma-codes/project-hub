const express = require('express');
const router = express.Router();
const multer = require('multer');
const { updateTaskStatus, getTasks, createTask, deleteTask, searchTasks, updateTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 } // 1MB per file limit
});

// Protect all task routes
router.use(protect);

router.get('/', getTasks);
router.get('/search', searchTasks);
router.post('/', upload.array('images', 4), createTask);
router.put('/:id', upload.array('images', 4), updateTask);
router.put('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

module.exports = router;
