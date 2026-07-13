document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const firstName = document.getElementById("fname").value;
    const lastName = document.getElementById("lname").value;
    const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password, firstName, lastName })
    });
    const data = await response.json();
    document.getElementById("registerMessage").textContent = JSON.stringify(data, null, 2);
});