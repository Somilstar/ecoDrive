const express = require('express');
const router = express.Router();
const {getSalesReport, getVisitReport} = require('../controllers/analyticsController');

const {protect, adminOnly} = require('../middleware/authMiddleware');

router.get('/sales-report', protect, adminOnly, getSalesReport);
router.get('/visit-report', protect, adminOnly, getVisitReport);

module.exports = router;