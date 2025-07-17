const router = require('express').Router();
const auth   = require('../middleware/auth');

// GET /api/test
router.get('/', auth, (req, res) => {
  res.json({ msg: `Authenticated! Your user ID is ${req.user}` });
});

module.exports = router;