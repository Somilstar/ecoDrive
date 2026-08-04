const express = require('express');
const router = express.Router();

const {
  getMyOrders,
  getOrderById
} = require('../controllers/orderController');

const {
  protect
} = require('../middleware/authMiddleware');

router.get('/my-orders', protect, getMyOrders);
// Get one order belonging to the logged-in customer.
router.get('/:orderId', protect, getOrderById);

module.exports = router;