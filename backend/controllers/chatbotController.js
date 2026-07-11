// @desc    Process client messaging inputs & map navigational paths
// @route   POST /api/chatbot/message
// @access  Public
const handleChatbotMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ status: "Failure", message: "Message content cannot be blank." });
    }

    const input = message.toLowerCase();
    let reply = "I'm sorry, I'm basic and still learning! Try asking about 'catalog', 'login', 'support', 'checkout', or a specific brand like 'Tesla' or 'Porsche'.";
    let redirectUrl = null;

    // Tokenization and trigger matching system to extract navigation intents
    if (input.includes("catalog") || input.includes("browse") || input.includes("cars") || input.includes("vehicles")) {
      reply = "Sure! I can help you look at our inventory. Let's take you over to our electric vehicle catalog page.";
      redirectUrl = "/index.html";
    } else if (input.includes("login") || input.includes("signin") || input.includes("account") || input.includes("register")) {
      reply = "No problem. Let's get you authenticated. Heading over to the account gateway.";
      redirectUrl = "/login.html";
    } else if (input.includes("checkout") || input.includes("buy") || input.includes("cart") || input.includes("purchase")) {
      reply = "Ready to complete your transaction? I will navigate you straight to the secure checkout review system.";
      redirectUrl = "/checkout.html";
    }

    // Return conversational text alongside an actionable redirect URL schema
    return res.status(200).json({
      status: "Success",
      reply,
      redirectUrl
    });

  } catch (error) {
    return res.status(500).json({ status: "Failure", message: error.message });
  }
};

module.exports = { handleChatbotMessage };