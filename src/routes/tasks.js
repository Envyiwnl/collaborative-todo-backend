const router = require('express').Router();
const auth   = require('../middleware/auth');
const Task   = require('../models/Task');
const Action = require('../models/ActionLog');
const User   = require('../models/User');

// Helper: log an action and return the saved ActionLog
async function logAction(userId, type, task) {
  const action = new Action({
    user:       userId,
    actionType: type,
    task:       task._id,
    details:    task.toObject()
  });
  return action.save();
}

// POST /api/tasks — create a new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, assignedUser, status, priority } = req.body;
    // Disallow titles matching column names
    if (['Todo','In Progress','Done'].includes(title)) {
      return res.status(400).json({ msg: 'Title cannot match a column name' });
    }

    // Save task
    let task = new Task({ title, description, assignedUser, status, priority });
    let savedTask = await task.save();

    // Populate before emit
    savedTask = await savedTask.populate('assignedUser', 'email name');

    // Log & emit
    const action = await logAction(req.user, 'create', savedTask);
    const io     = req.app.get('io');
    io.emit('taskCreated', savedTask);
    io.emit('actionLogged', action);

    res.json(savedTask);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Title must be unique' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks — list all tasks
router.get('/', auth, async (req, res) => {
  const tasks = await Task.find()
    .populate('assignedUser', 'email name')
    .sort({ createdAt: 1 });
  res.json(tasks);
});

// PUT /api/tasks/:id — update a task with conflict detection
router.put('/:id', auth, async (req, res) => {
  const { lastUpdated, ...updates } = req.body;

  try {
    // Fetch current task
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Conflict detection
    if (lastUpdated) {
      const clientTime = new Date(lastUpdated).getTime();
      const serverTime = new Date(task.updatedAt).getTime();
      if (clientTime !== serverTime) {
        return res.status(409).json({
          msg: 'Version conflict',
          serverVersion: task,
          clientVersion: {
            ...task.toObject(),
            ...updates,
            updatedAt: lastUpdated
          }
        });
      }
    }

    Object.assign(task, updates);
    let savedTask = await task.save();

    // Populate before emit
    savedTask = await savedTask.populate('assignedUser', 'email name');

    // Log & emit
    const action = await logAction(req.user, 'update', savedTask);
    const io     = req.app.get('io');
    io.emit('taskUpdated', savedTask);
    io.emit('actionLogged', action);

    res.json(savedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id — delete a task
router.delete('/:id', auth, async (req, res) => {
  const deletedTask = await Task.findByIdAndDelete(req.params.id);
  if (!deletedTask) return res.status(404).json({ msg: 'Task not found' });

  // create the action
  const rawAction = await logAction(req.user, 'delete', deletedTask);
  // populate the user name
  const action    = await rawAction.populate('user', 'name');

  // emit both events
  const io = req.app.get('io');
  io.emit('taskDeleted', { id: req.params.id });
  io.emit('actionLogged', action);

  res.json({ msg: 'Task deleted' });
});

// POST /api/tasks/:id/smart-assign — assigns to user with fewest active tasks
router.post('/:id/smart-assign', auth, async (req, res) => {
  try {
    // Counts not completed tasks per user
    const counts = await Task.aggregate([
      { $match: { status: { $ne: 'Done' } } },
      { $group: { _id: '$assignedUser', count: { $sum: 1 } } }
    ]);

    // Fetch all users in DB
    const allUsers = await User.find({}, '_id');
    const countMap = {};
    allUsers.forEach(u => { countMap[u._id.toString()] = 0; });
    counts.forEach(c => {
      if (c._id) countMap[c._id.toString()] = c.count;
    });

    // Picks the user with the fewest tasks for assigning
    const [bestUserId] = Object.entries(countMap)
      .sort(([,a],[,b]) => a - b)
      .map(([id]) => id);

    // Update and populate
    let task = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedUser: bestUserId },
      { new: true }
    ).populate('assignedUser', 'email name');

    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Log & emit
    const action = await logAction(req.user, 'smart-assign', task);
    const io     = req.app.get('io');
    io.emit('taskUpdated', task);
    io.emit('actionLogged', action);

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;