const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Cloud Database
connectDB();

// Initialize Express App (API Gateway)
const app = express();

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse incoming JSON payloads (REST Principle)
app.use(express.urlencoded({ extended: true })); // Parse HTML form submissions


app.use(express.static(path.join(__dirname, 'public')));

// Simple Health Check Route
app.get('/api/status', (req, res) => {
  res.status(200).json({ 
    status: 'Success', 
    message: 'EcoDrive REST API Gateway is running securely!',
    timestamp: new Date().toISOString()
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`EcoDrive Server is running`);
});