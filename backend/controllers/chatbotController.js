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
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are "Eco", the advanced AI sales and support assistant for EcoDrive, a premium electric vehicle (EV) e-commerce platform.
      Your goal is to provide exceptional, knowledgeable, and concise customer service.
      
      Customer Message: "${message}"
      
      Instructions:
      1. Be helpful, professional, and enthusiastic about electric vehicles, sustainability, and the EcoDrive experience.
      2. If they ask about financing, mention our loan calculator. If they ask about comparing cars, mention our comparison tool. 
      3. If they ask about batteries, mention our battery leasing options.
      4. Keep your response brief (1-3 sentences) but informative.
      
      Respond STRICTLY in JSON format with exactly two keys:
      {
        "reply": "Your conversational response here.",
        "redirectUrl": "A relative URL to navigate the user, or null if no navigation is needed."
      }
      
      Routing Rules for "redirectUrl":
      - "/index.html" -> general browsing, viewing the catalog, searching for cars, or going home.
      - "/compare.html" -> comparing two or more electric vehicles, side-by-side features.
      - "/loan-calculator.html" -> financing, calculating monthly payments, loan options, affordability.
      - "/cart.html" -> viewing their shopping cart, ready to checkout or buy.
      - "/account.html" -> viewing order history, profile, or account settings.
      - "/login.html" -> signing in, registering a new account, or resetting a password.
      - null -> answering general questions, EV knowledge, greetings, or when no page change is requested.
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