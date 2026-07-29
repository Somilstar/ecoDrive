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

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const catalogRouter = require('./routes/catalogRouter');
app.use('/api/vehicles', catalogRouter);

const checkoutRouter = require('./routes/checkoutRouter');
app.use('/api/checkout', checkoutRouter);

const batteryLeaseRouter = require('./routes/batteryLeaseRouter');
app.use('/api/battery-lease', batteryLeaseRouter);

const adminRouter = require('./routes/adminRouter');
app.use('/api/admin', adminRouter);

const chatbotRoutes = require('./routes/chatbotRoutes');
app.use('/api/chatbot', chatbotRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`EcoDrive Server is running`);
});