const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Access Denied: No token provided' });
  }

  // Expecting format: Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Access Denied: Invalid token format' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'a_default_backup_jwt_secret');
    // Store decoded user info in request object
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Access Denied: Invalid or expired token' });
  }
};

module.exports = authMiddleware;
