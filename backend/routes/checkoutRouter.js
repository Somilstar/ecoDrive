const express = require('express');
const router = express.Router();
const { processCheckout } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// checkout needs a logged in user since order with account
router.post('/', protect, processCheckout);

module.exports = router;
