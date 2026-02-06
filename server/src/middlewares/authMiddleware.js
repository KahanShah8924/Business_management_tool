const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded: { userId, businessId? }
    req.user = decoded || {};

    // Backward compatibility: older tokens may not contain businessId.
    if (req.user?.userId && !req.user?.businessId) {
      const user = await User.findById(req.user.userId).select('businessId');
      if (user?.businessId) {
        req.user.businessId = user.businessId.toString();
      }
    }

    if (!req.user?.businessId) {
      return res.status(401).json({ message: 'Business context missing for this token' });
    }
    // Add security headers to prevent caching of protected routes
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken;
