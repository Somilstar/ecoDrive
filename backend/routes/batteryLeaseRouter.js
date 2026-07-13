const express = require('express');
const router = express.Router();
const { calculateBatteryLease } = require('../controllers/batteryLeaseController');

// public route, guests should be able to price out a lease while browsing
router.post('/calculate', calculateBatteryLease);

module.exports = router;
