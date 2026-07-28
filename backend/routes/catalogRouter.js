const express = require('express');
const router = express.Router();
const { getVehicles, filterVehicles, getVehicleById, compareVehicles} = require('../controllers/catalogController');
const { addReview, getVehicleReviews} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { tracker } = require('../middleware/trackerMiddleware');

// Map catalog endpoints to their functional controller logic
router.get('/', getVehicles);
router.get('/filter', filterVehicles);
router.post('/compare', compareVehicles);
router.get('/:id', tracker('VIEW'), getVehicleById);

// Map review endpoints connected to a specific vehicle
router.post('/:id/reviews', protect, addReview);
router.get('/:id/reviews', getVehicleReviews);

module.exports = router;