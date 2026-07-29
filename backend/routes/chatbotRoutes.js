// routes/chatbotRoutes.js
const express = require('express');
const router = express.Router();
const { handleChatbotMessage } = require('../controllers/chatbotController');

router.post('/message', handleChatbotMessage);

module.exports = router;