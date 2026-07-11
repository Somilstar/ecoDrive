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
    const { email, password, firstName, lastName, defaultAddress } = req.body;

    // Check if the user account already exists in the cluster
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ status: 'Failure', message: 'An account with this email already exists.' });
    }

    // Generate cryptographic salt and hash the plain text password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Persist new user account profile to MongoDB
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      defaultAddress: defaultAddress || {}
    });

    if (user) {
      res.status(201).json({
        status: 'Success',
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        role: user.role,
        token: generateToken(user._id) // Automatically log them in by returning a token
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'Failure', message: error.message });
  }
};

// @desc    Authenticate user credentials & issue token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Query database for the user record
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ status: 'Failure', message: 'Invalid email or password credentials.' });
    }

    // Compare incoming plain-text input against stored hashed password string
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ status: 'Failure', message: 'Invalid email or password credentials.' });
    }

    // Authentication successful: issue payload token
    res.status(200).json({
      status: 'Success',
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ status: 'Failure', message: error.message });
  }
};

module.exports = { registerUser, loginUser };