const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['Todo', 'In Progress', 'Review', 'Done'],
    default: 'Todo',
    index: true
  },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  links: [{ type: String }],
  imageUrls: [{ type: String }],
  position: { type: Number, default: 0 }, // Tracks ordering within Kanban column
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
