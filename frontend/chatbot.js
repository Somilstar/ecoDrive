// frontend/chatbot.js
const chatToggleBtn = document.getElementById('chatToggleBtn');
const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatBody = document.getElementById('chatBody');

// Open/Close the chat popup
chatToggleBtn.addEventListener('click', () => {
    chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
});

// Helper function to draw bubbles
const appendMessage = (text, sender) => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = text;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight; // Auto-scroll to bottom
};

// Send message to the Gemini Backend
chatSendBtn.addEventListener('click', async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    chatInput.value = '';
    
    // Add a temporary typing indicator
    const typingId = Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot');
    typingDiv.id = typingId;
    typingDiv.textContent = 'Typing...';
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/chatbot/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        document.getElementById(typingId).remove();

        if (response.ok && data.status === 'Success') {
            appendMessage(data.reply, 'bot');
            
            // Execute the routing command if the AI provided one
            if (data.redirectUrl) {
                setTimeout(() => {
                    window.location.href = data.redirectUrl;
                }, 2000); 
            }
        } else {
            appendMessage("Sorry, the server rejected the message.", 'bot');
        }
    } catch (error) {
        document.getElementById(typingId).remove();
        appendMessage("Network error. Make sure the backend is running.", 'bot');
    }
});

// Trigger send on "Enter" key press
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        chatSendBtn.click();
    }
});