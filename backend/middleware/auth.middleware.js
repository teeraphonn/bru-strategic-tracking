const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        department: {
          include: { faculty: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found or disabled' });
    }

    // Verify token using secret key appended with the current password hash
    jwt.verify(token, process.env.JWT_SECRET + user.password);

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
