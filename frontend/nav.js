document.addEventListener("DOMContentLoaded", () => {
    const userString = localStorage.getItem("user");
    if (!userString) {
        return;
    }

    const user = JSON.parse(userString);
    if (user.role !== 'admin') {
        return;
    }

    const navLinks = document.querySelector(".nav-links");
    if (!navLinks || navLinks.querySelector('a[href="admin.html"]')) {
        return;
    }

    const adminItem = document.createElement("li");
    adminItem.innerHTML = '<a href="admin.html">Admin</a>';

    const accountLink = navLinks.querySelector('a[href="account.html"]');
    if (accountLink) {
        accountLink.parentElement.insertAdjacentElement("afterend", adminItem);
    } else {
        navLinks.appendChild(adminItem);
    }
});
