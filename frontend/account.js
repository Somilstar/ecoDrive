function formatMoney(price) {
    const value = Number(price);

    if (!Number.isFinite(value)){
        return "$0.00";
    }
    return `${value.toFixed(2)}`;
}

function formatDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString();
}

function createTextElement(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;

    if (className) {
        element.className = className;
    }

    return element;
}

async function loadMyOrders() {
    const token = localStorage.getItem("token");
    const ordersMessage = document.getElementById("ordersMessage");
    const ordersList = document.getElementById("ordersList");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(
            CONFIG.API_BASE_URL + "/api/orders/my-orders",
            {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            ordersMessage.textContent =
                data.message || "Could not load your orders.";
            return;
        }

        ordersList.innerHTML = "";

        if (!Array.isArray(data.orders) || data.orders.length === 0) {
            ordersMessage.textContent = "You have not placed any orders yet.";
            return;
        }

        ordersMessage.textContent = "";

        data.orders.forEach(function (order) {
            const orderCard = document.createElement("article");
            orderCard.className = "account-order-card";

            orderCard.appendChild(
                createTextElement("h3", "Order #" + order.orderId)
            );

            orderCard.appendChild(
                createTextElement("p", "Placed: " + formatDate(order.orderDate))
            );

            orderCard.appendChild(
                createTextElement(
                    "p",
                    "Status: " + (order.status || "Unavailable")
                )
            );

            orderCard.appendChild(
                createTextElement(
                    "p",
                    "Total: " + formatMoney(order.totalPrice)
                )
            );

            const vehicleList = document.createElement("div");
            vehicleList.className = "account-order-vehicles";

            order.vehicles.forEach(function (vehicle) {
                const vehicleLink = document.createElement("a");
                vehicleLink.textContent = vehicle.name;
                vehicleLink.href =
                    "vehicle-detail.html?id=" +
                    encodeURIComponent(vehicle.vehicleId);
                vehicleLink.className = "account-order-vehicle-link";

                vehicleList.appendChild(vehicleLink);
            });

            const detailsLink = document.createElement("a");
            detailsLink.textContent = "View Order Details";
            detailsLink.href =
                "order-summary.html?orderId=" +
                encodeURIComponent(order.orderId);
            detailsLink.className = "account-order-details-link";

            orderCard.appendChild(vehicleList);
            orderCard.appendChild(detailsLink);

            ordersList.appendChild(orderCard);
        });
    } catch (error) {
        console.error("Order history request failed:", error);

        ordersMessage.textContent =
            "Order display error: " + error.message;
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const userString = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !userString) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userString);

    document.getElementById("welcomeText").textContent = `Welcome back, ${user.firstName}!`;
    document.getElementById("profileDetails").innerHTML = `
        <strong>Email:</strong> ${user.email} <br><br>
        <strong>Role:</strong> ${user.role} <br><br>
        <strong>Account ID:</strong> ${user.id}
    `;
    loadMyOrders();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});