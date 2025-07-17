const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { type: String, required: true },  // 'create','update','delete'
  task:       { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  details:    { type: Object },                  // snapshot of the task
}, { timestamps: true });

module.exports = mongoose.model('ActionLog', actionSchema);