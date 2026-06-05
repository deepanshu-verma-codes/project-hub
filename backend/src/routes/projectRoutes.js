const express = require('express');
const router = express.Router();
const { getProjects, createProject, deleteProject, updateProject } = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getProjects);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
