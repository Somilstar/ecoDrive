document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (response.ok && data.token) {
        localStorage.setItem("token", data.token);
    }
    document.getElementById("loginMessage").textContent = JSON.stringify(data, null, 2);
});