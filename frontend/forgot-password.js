document.getElementById("forgotForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const messageEl = document.getElementById("forgotMessage");
    
    messageEl.textContent = "If an account matches that email, a reset link has been sent.";
    messageEl.style.color = "#2ecc71";
});