const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper Function: Generates a signed, stateless JSON Web Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// @desc    Register a new customer profile
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, shippingAddress, billingAddress } = req.body;

    // Input Payload Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        status: 'Failure', 
        message: 'email, password, firstName, and lastName fields are strictly required.' 
      });
    }

    //Data Normalization
    const normalizedEmail = email.toLowerCase().trim();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ status: 'Failure', message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      shippingAddress: shippingAddress || {},
      billingAddress: billingAddress || {}
    });

    if (user) {
      return res.status(201).json({
        status: 'Success',
        id: user.id, 
        email: user.email,
        firstName: user.firstName,
        role: user.role,
        token: generateToken(user.id)
      });
    }
  } catch (error) {
    
    if (error?.code === 11000) {
      return res.status(400).json({ status: 'Failure', message: 'An account with this email already exists.' });
    }
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ status: 'Failure', message: error.message });
    }
    console.error('Register Error Logged:', error);
    return res.status(500).json({ status: 'Failure', message: 'Internal server error processing registration.' });
  }
};

// @desc    Authenticate user credentials & issue token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate Input Payload
    if (!email || !password) {
      return res.status(400).json({ status: 'Failure', message: 'Both email and password elements are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (!user) {
      return res.status(401).json({ status: 'Failure', message: 'Invalid email or password credentials.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ status: 'Failure', message: 'Invalid email or password credentials.' });
    }

    return res.status(200).json({
      status: 'Success',
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      token: generateToken(user.id)
    });
  } catch (error) {
    console.error('Login Error Logged:', error);
    return res.status(500).json({ status: 'Failure', message: 'Internal server error processing verification authentication.' });
  }
};

module.exports = { registerUser, loginUser };