const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Process client messaging inputs & map navigational paths using AI
// @route   POST /api/chatbot/message
// @access  Public
const handleChatbotMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ status: "Failure", message: "Message content cannot be blank." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are the AI sales and support assistant for EcoDrive, an electric vehicle e-commerce platform.
      A customer just sent this message: "${message}"
      
      Respond in strict JSON format with exactly two keys:
      1. "reply": A warm, helpful, brief conversational response (1-2 sentences) answering their question or acknowledging their request.
      2. "redirectUrl": A relative URL to help navigate them to the right place. Use these rules:
         - "/index.html" -> if they want to browse cars, see the catalog, or see general inventory.
         - "/login.html" -> if they want to log in, register, or see their account.
         - "/checkout.html" -> if they want to buy, checkout, or view their cart.
         - null -> if they are just saying hello or asking a general question that doesn't require navigation.
      
      Return ONLY the raw JSON object. Do not wrap it in markdown code blocks.
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();
    
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '');
    const aiResponse = JSON.parse(responseText);

    return res.status(200).json({
      status: "Success",
      reply: aiResponse.reply,
      redirectUrl: aiResponse.redirectUrl
    });

  } catch (error) {
    console.error('Chatbot AI Error:', error);
    return res.status(500).json({ 
      status: "Failure", 
      message: "The AI assistant is currently offline. Please try again later." 
    });
  }
};

module.exports = { handleChatbotMessage };