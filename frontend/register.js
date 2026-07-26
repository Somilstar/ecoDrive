

document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    const firstName = document.getElementById("fname").value;
    const lastName = document.getElementById("lname").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    const messageEl = document.getElementById("registerMessage");
    messageEl.textContent = "Creating account...";

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, firstName, lastName })
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
            
            messageEl.textContent = "Account created! Redirecting...";
            messageEl.style.color = "#2ecc71";
            
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
            
        } else {
            messageEl.textContent = data.message || "Registration failed.";
            messageEl.style.color = "#e74c3c";
        }
    } catch (error) {
        messageEl.textContent = "Server connection failed.";
        messageEl.style.color = "#e74c3c";
    }
});