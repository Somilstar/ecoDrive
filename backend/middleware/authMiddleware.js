const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ status: 'Failure', message: 'Not authorized, secure user profile no longer exists.' });
      }

      req.user = user; 
      return next();
    } catch (error) {
      console.error('Security Interceptor Firewall Error:', error.message);
      return res.status(401).json({ status: 'Failure', message: 'Not authorized, security token verification failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ status: 'Failure', message: 'Not authorized, no session bearer authorization token provided.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  } else {
    return res.status(403).json({ status: 'Failure', message: 'Access Denied: Administrative security configuration rights required.' });
  }
};

module.exports = { protect, adminOnly };