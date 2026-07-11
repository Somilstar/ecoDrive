const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect Routes Middleware: Verifies the client has a signed JWT
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Format: Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token string
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify token signature using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user profile from DB (excluding password field) and attach to request
      req.user = await User.findById(decoded.id).select('-password');
      
      return next(); // Pass control to the next controller function
    } catch (error) {
      console.error('Security Interceptor Error:', error.message);
      return res.status(401).json({ status: 'Failure', message: 'Not authorized, security token validation failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ status: 'Failure', message: 'Not authorized, no security token provided.' });
  }
};

// Admin Firewall Middleware: Verifies user has explicit administrative rights
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ status: 'Failure', message: 'Access Denied: Administrative privileges required.' });
  }
};

module.exports = { protect, adminOnly };