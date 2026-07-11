const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { handleChatbotMessage } = require('../controllers/chatbotController');

// Map resource endpoints to their functional logic
router.post('/register', registerUser);
router.post('/login', loginUser);

router.post('/chatbot/message', handleChatbotMessage);

module.exports = router;