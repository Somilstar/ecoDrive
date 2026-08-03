// Full province names used when displaying the shipping address.
const PROVINCE_NAMES = {
    AB: "Alberta",
    BC: "British Columbia",
    MB: "Manitoba",
    NB: "New Brunswick",
    NL: "Newfoundland and Labrador",
    NS: "Nova Scotia",
    NT: "Northwest Territories",
    NU: "Nunavut",
    ON: "Ontario",
    PE: "Prince Edward Island",
    QC: "Quebec",
    SK: "Saskatchewan",
    YT: "Yukon"
};

const orderSummaryMessage =
    document.getElementById("orderSummaryMessage");

const orderSummaryContent =
    document.getElementById("orderSummaryContent");

const orderStatusMessage =
    document.getElementById("orderStatusMessage");

// Format a number as Canadian currency.
function formatPrice(price) {
    const number = Number(price);

    const safePrice =
        Number.isFinite(number) ? number : 0;

    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD"
    }).format(safePrice);
}

// Format the saved order date.
function formatOrderDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    }).format(date);
}

// Convert a decimal rate such as 0.13 into 13%.
function formatTaxRate(taxRate) {
    const rate = Number(taxRate);

    if (!Number.isFinite(rate)) {
        return "0";
    }

    return Number(
        (rate * 100).toFixed(3)
    );
}

// Display a page-level success or error message.
function showOrderMessage(message, messageType) {
    orderSummaryMessage.textContent = message;
    orderSummaryMessage.className = "checkout-message";

    if (messageType) {
        orderSummaryMessage.classList.add(messageType);
    }
}

// Create one line of vehicle information safely.
function createVehicleDetail(label, value) {
    const detail = document.createElement("p");

    const labelElement =
        document.createElement("strong");

    labelElement.textContent = label + ": ";

    const valueElement =
        document.createElement("span");

    valueElement.textContent = value;

    detail.appendChild(labelElement);
    detail.appendChild(valueElement);

    return detail;
}

// Display all vehicles that belong to the order.
function displayOrderItems(items) {
    const itemsContainer =
        document.getElementById("completedOrderItems");

    itemsContainer.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
        const emptyMessage =
            document.createElement("p");

        emptyMessage.textContent =
            "No vehicles were found for this order.";

        itemsContainer.appendChild(emptyMessage);
        return;
    }

    items.forEach(function(orderItem) {
        const vehicle = orderItem.item || {};

        const vehicleCard =
            document.createElement("article");

        vehicleCard.className =
            "completed-order-item";

        const vehicleName =
            document.createElement("h3");

        vehicleName.textContent =
            vehicle.name ||
            orderItem.vehicleId ||
            "Vehicle";

        vehicleCard.appendChild(vehicleName);

        if (vehicle.brand) {
            vehicleCard.appendChild(
                createVehicleDetail(
                    "Brand",
                    vehicle.brand
                )
            );
        }

        if (vehicle.model) {
            vehicleCard.appendChild(
                createVehicleDetail(
                    "Model",
                    vehicle.model
                )
            );
        }

        if (vehicle.modelYear) {
            vehicleCard.appendChild(
                createVehicleDetail(
                    "Model Year",
                    String(vehicle.modelYear)
                )
            );
        }

        vehicleCard.appendChild(
            createVehicleDetail(
                "Vehicle ID",
                orderItem.vehicleId || "Unavailable"
            )
        );

        vehicleCard.appendChild(
            createVehicleDetail(
                "Purchase Price",
                formatPrice(orderItem.purchasePrice)
            )
        );

        const customizationOptions =
            orderItem.selectedCustomizationOptions;

        if (
            Array.isArray(customizationOptions) &&
            customizationOptions.length > 0
        ) {
            vehicleCard.appendChild(
                createVehicleDetail(
                    "Customizations",
                    customizationOptions.join(", ")
                )
            );
        }

        itemsContainer.appendChild(vehicleCard);
    });
}

// Display the retrieved order on the page.
function displayOrder(order) {
    const shippingAddress =
        order.shippingAddress || {};

    const paymentSummary =
        order.paymentSummary || {};

    document.getElementById("orderId").textContent =
        order._id || "Unavailable";

    document.getElementById("orderDate").textContent =
        formatOrderDate(order.createdAt);

    document.getElementById("orderStatus").textContent =
        order.status || "Unavailable";

    document.getElementById("customerEmail").textContent =
        order.customerEmail || "Unavailable";

    document.getElementById(
        "shippingFullName"
    ).textContent =
        shippingAddress.fullName || "Unavailable";

    document.getElementById(
        "shippingStreet"
    ).textContent =
        shippingAddress.street || "Unavailable";

    document.getElementById(
        "shippingCity"
    ).textContent =
        shippingAddress.city || "Unavailable";

    const provinceCode =
        shippingAddress.province || "";

    document.getElementById(
        "shippingProvince"
    ).textContent =
        PROVINCE_NAMES[provinceCode] ||
        provinceCode ||
        "Unavailable";

    document.getElementById(
        "shippingCountry"
    ).textContent =
        shippingAddress.country || "Canada";

    document.getElementById(
        "shippingPostalCode"
    ).textContent =
        shippingAddress.postalCode || "Unavailable";

    document.getElementById(
        "shippingPhone"
    ).textContent =
        shippingAddress.phone || "Unavailable";

    const lastFour =
        paymentSummary.cardLastFour || "";

    document.getElementById("paymentCard").textContent =
        lastFour
            ? `Card ending in ${lastFour}`
            : "Unavailable";

    document.getElementById(
        "completedSubtotal"
    ).textContent =
        formatPrice(order.subtotal);

    document.getElementById(
        "completedTax"
    ).textContent =
        formatPrice(order.taxAmount);

    document.getElementById(
        "completedTotal"
    ).textContent =
        formatPrice(order.totalPrice);

    const taxPercentage =
        formatTaxRate(order.taxRate);

    document.getElementById(
        "completedTaxLabel"
    ).textContent =
        `Tax (${taxPercentage}%):`;

    displayOrderItems(order.items);

    orderStatusMessage.textContent =
        "Thank you for your purchase. Your order was completed successfully.";

    showOrderMessage(
        "Your payment was authorized and your order has been placed.",
        "success"
    );

    orderSummaryContent.hidden = false;
}

// Retrieve the completed order from the backend.
async function loadOrderSummary() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const queryParameters =
        new URLSearchParams(window.location.search);

    const orderId =
        queryParameters.get("orderId");

    if (!orderId) {
        orderStatusMessage.textContent =
            "The order could not be loaded.";

        showOrderMessage(
            "No order ID was provided.",
            "error"
        );

        return;
    }

    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/orders/${encodeURIComponent(
                orderId
            )}`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
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

        if (
            !response.ok ||
            data.status !== "Success"
        ) {
            throw new Error(
                data.message ||
                "The order could not be loaded."
            );
        }

        displayOrder(data.order);
    } catch (error) {
        orderStatusMessage.textContent =
            "The order could not be loaded.";

        showOrderMessage(
            error.message ||
            "Could not connect to the order server.",
            "error"
        );
    }
}

// Log the user out.
const logoutLink =
    document.getElementById("logoutLink");

if (logoutLink) {
    logoutLink.addEventListener(
        "click",
        function(event) {
            event.preventDefault();

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "login.html";
        }
    );
}

loadOrderSummary();