document.addEventListener("DOMContentLoaded", () => {
    const userString = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !userString) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userString);

    // Security redirect: If an admin accidentally navigates here, send them to their dashboard
    if (user.role === 'admin') {
        window.location.href = "admin.html";
        return;
    }

    document.getElementById("welcomeText").textContent = `Welcome back, ${user.firstName}!`;
    document.getElementById("profileDetails").innerHTML = `
        <strong>Email:</strong> ${user.email} <br><br>
        <strong>Role:</strong> ${user.role} <br><br>
        <strong>Account ID:</strong> ${user.id}
    `;
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});