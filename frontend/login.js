

document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const messageEl = document.getElementById("loginMessage");
    
    messageEl.textContent = "Authenticating...";
    messageEl.style.color = "#333";

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'Success') {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify({
                id: data.id, 
                email: data.email, 
                firstName: data.firstName, 
                role: data.role
            }));
            
            messageEl.textContent = "Success! Redirecting...";
            messageEl.style.color = "#2ecc71";
            
            setTimeout(() => {
                if (data.role === 'admin') {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "index.html";
                }
            }, 1000);
            
        } else {
            messageEl.textContent = data.message || "Login failed.";
            messageEl.style.color = "#e74c3c";
        }
    } catch (error) {
        messageEl.textContent = "Server connection failed.";
        messageEl.style.color = "#e74c3c";
    }
});