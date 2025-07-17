const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Get token from header (we’ll use "x-auth-token")
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No auth token, access denied' });
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 3. Attach user id to request
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};