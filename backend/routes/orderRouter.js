const express = require('express');
const router = express.Router();

const {
  getOrderById
} = require('../controllers/orderController');

const {
  protect
} = require('../middleware/authMiddleware');

// Get one order belonging to the logged-in customer.
router.get('/:orderId', protect, getOrderById);

module.exports = router;