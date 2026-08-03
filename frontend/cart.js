const CART_STORAGE_KEY = "ecoDriveCart";

// Used to preview the tax before checkout.
// The backend still calculates and verifies the final amount.
const PROVINCE_TAX_RATES = {
    AB: 0.05,
    BC: 0.12,
    MB: 0.12,
    NB: 0.15,
    NL: 0.15,
    NS: 0.14,
    NT: 0.05,
    NU: 0.05,
    ON: 0.13,
    PE: 0.15,
    QC: 0.14975,
    SK: 0.11,
    YT: 0.05
};

// Load the cart when the page opens.
let cart = loadCart();

const cartItemsElement =
    document.getElementById("cartItems");

const emptyCartMessage =
    document.getElementById("emptyCartMessage");

const checkoutForm =
    document.getElementById("checkoutForm");

const submitOrderButton =
    document.getElementById("submitOrderButton");

const checkoutMessage =
    document.getElementById("checkoutMessage");

const provinceElement =
    document.getElementById("province");

const taxLabelElement =
    document.getElementById("taxLabel");

// Load the saved cart from localStorage.
function loadCart() {
    const savedCart =
        localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
        return [];
    }

    try {
        return JSON.parse(savedCart);
    } catch (error) {
        return [];
    }
}

// Save the cart to localStorage.
function saveCart() {
    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
    );
}

// Format a number as Canadian currency.
function formatPrice(price) {
    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD"
    }).format(price);
}

// Display all vehicles in the cart.
function displayCart() {
    cartItemsElement.innerHTML = "";

    if (cart.length === 0) {
        emptyCartMessage.style.display = "block";
        checkoutForm.style.display = "none";
        submitOrderButton.disabled = true;
    } else {
        emptyCartMessage.style.display = "none";
        checkoutForm.style.display = "block";
        submitOrderButton.disabled = false;
    }

    cart.forEach(function(vehicle, index) {
        const vehicleElement =
            document.createElement("div");

        vehicleElement.className =
            "checkout-cart-item";

        const vehicleName =
            document.createElement("h3");

        vehicleName.textContent = vehicle.name;

        const vehiclePrice =
            document.createElement("p");

        vehiclePrice.textContent =
            "Price: " + formatPrice(vehicle.price);

        const vehicleQuantity =
            document.createElement("p");

        vehicleQuantity.textContent = "Quantity: 1";

        let leaseElement = null;

        if (vehicle.batteryLease) {
            leaseElement =
                document.createElement("div");

            leaseElement.className =
                "cart-lease-details";

            const originalPrice =
                document.createElement("p");

            originalPrice.textContent =
                "Original price: " +
                formatPrice(vehicle.originalPrice);

            const batteryReduction =
                document.createElement("p");

            batteryReduction.textContent =
                "Battery value removed: -" +
                formatPrice(
                    vehicle.batteryLease.upfrontBatteryCost
                );

            const monthlyFee =
                document.createElement("p");

            monthlyFee.textContent =
                "Battery lease: " +
                formatPrice(
                    vehicle.batteryLease.monthlySubscriptionFee
                ) +
                " / month";

            const estimatedUsage =
                document.createElement("p");

            estimatedUsage.textContent =
                "Estimated usage: " +
                vehicle.batteryLease.estimatedMonthlyKm +
                " km / month";

            leaseElement.appendChild(originalPrice);
            leaseElement.appendChild(batteryReduction);
            leaseElement.appendChild(monthlyFee);
            leaseElement.appendChild(estimatedUsage);
        }

        const removeButton =
            document.createElement("button");

        removeButton.type = "button";
        removeButton.className = "remove-cart-button";
        removeButton.textContent = "Remove";

        removeButton.addEventListener(
            "click",
            function() {
                removeVehicle(index);
            }
        );

        vehicleElement.appendChild(vehicleName);
        vehicleElement.appendChild(vehiclePrice);
        vehicleElement.appendChild(vehicleQuantity);

        if (leaseElement) {
            vehicleElement.appendChild(leaseElement);
        }

        vehicleElement.appendChild(removeButton);
        cartItemsElement.appendChild(vehicleElement);
    });

    updateOrderSummary();
}

// Remove a vehicle from the cart.
function removeVehicle(index) {
    const removedVehicle = cart[index];

    cart.splice(index, 1);

    if (removedVehicle?.vehicleId) {
        localStorage.removeItem(
            `batteryLease_${removedVehicle.vehicleId}`
        );
    }

    saveCart();
    displayCart();

    if (typeof updateCartCount === "function") {
        updateCartCount();
    }
}

// Calculate and display the subtotal, tax, and total.
function updateOrderSummary() {
    let subtotal = 0;

    cart.forEach(function(vehicle) {
        subtotal += Number(vehicle.price);
    });

    const selectedProvince = provinceElement.value;

    const taxRate =
        PROVINCE_TAX_RATES[selectedProvince] || 0;

    const tax = Number(
        (subtotal * taxRate).toFixed(2)
    );

    const total = Number(
        (subtotal + tax).toFixed(2)
    );

    document.getElementById("subtotal").textContent =
        formatPrice(subtotal);

    document.getElementById("tax").textContent =
        formatPrice(tax);

    document.getElementById("total").textContent =
        formatPrice(total);

    if (selectedProvince) {
        const taxPercentage = Number(
            (taxRate * 100).toFixed(3)
        );

        taxLabelElement.textContent =
            `Tax (${taxPercentage}%):`;
    } else {
        taxLabelElement.textContent = "Tax:";
    }
}

// Update the tax whenever the province changes.
provinceElement.addEventListener(
    "change",
    function() {
        updateOrderSummary();
    }
);

// Display a checkout message.
function showMessage(message, messageType) {
    checkoutMessage.textContent = message;
    checkoutMessage.className = "checkout-message";

    if (messageType) {
        checkoutMessage.classList.add(messageType);
    }
}

// Send the checkout request to the backend.
checkoutForm.addEventListener(
    "submit",
    async function(event) {
        event.preventDefault();

        const token = localStorage.getItem("token");

        // Checkout requires the user to be logged in.
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        if (cart.length === 0) {
            showMessage(
                "Your cart is empty.",
                "error"
            );
            return;
        }

        const checkoutData = {
            shippingAddress: {
                fullName:
                    document
                        .getElementById("fullName")
                        .value
                        .trim(),

                street:
                    document
                        .getElementById("street")
                        .value
                        .trim(),

                city:
                    document
                        .getElementById("city")
                        .value
                        .trim(),

                province:
                    document
                        .getElementById("province")
                        .value,

                country: "Canada",

                postalCode:
                    document
                        .getElementById("postalCode")
                        .value
                        .trim()
                        .toUpperCase(),

                phone:
                    document
                        .getElementById("phone")
                        .value
                        .trim()
            },

            items: cart.map(function(vehicle) {
                return {
                    vehicleId: vehicle.vehicleId,

                    batteryLease: vehicle.batteryLease
                        ? {
                            accepted: true,

                            adjustedVehiclePrice:
                                Number(
                                    vehicle
                                        .batteryLease
                                        .adjustedVehiclePrice
                                ),

                            monthlySubscriptionFee:
                                Number(
                                    vehicle
                                        .batteryLease
                                        .monthlySubscriptionFee
                                ),

                            estimatedMonthlyKm:
                                Number(
                                    vehicle
                                        .batteryLease
                                        .estimatedMonthlyKm
                                )
                        }
                        : null,

                    selectedCustomizationOptions:
                        vehicle.selectedCustomizationOptions || []
                };
            }),

            creditCard: {
                cardNumber:
                    document
                        .getElementById("cardNumber")
                        .value,

                expiry:
                    document
                        .getElementById("expiry")
                        .value,

                cvv:
                    document
                        .getElementById("cvv")
                        .value
            }
        };

        submitOrderButton.disabled = true;
        submitOrderButton.textContent = "Processing...";

        showMessage(
            "Processing your order.",
            ""
        );

        try {
            const response = await fetch(
                `${CONFIG.API_BASE_URL}/api/checkout`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify(checkoutData)
                }
            );

            const data = await response.json();

            if (
                response.ok &&
                data.status === "Success"
            ) {
                showMessage(
                    "Order completed. Loading your order summary.",
                    "success"
                );

                // Clear saved battery lease information.
                cart.forEach(function(vehicle) {
                    if (vehicle.vehicleId) {
                        localStorage.removeItem(
                            `batteryLease_${vehicle.vehicleId}`
                        );
                    }
                });

                // Clear the cart after successful checkout.
                cart = [];
                saveCart();

                if (
                    typeof updateCartCount ===
                    "function"
                ) {
                    updateCartCount();
                }

                // Open the completed order summary.
                window.location.href =
                    `order-summary.html?orderId=${encodeURIComponent(
                        data.orderId
                    )}`;

                return;
            }

            showMessage(
                data.message || "Checkout failed.",
                "error"
            );
        } catch (error) {
            showMessage(
                "Could not connect to the checkout server.",
                "error"
            );
        }

        submitOrderButton.textContent =
            "Submit Order";

        if (cart.length > 0) {
            submitOrderButton.disabled = false;
        }
    }
);

// Log the user out.
document
    .getElementById("logoutLink")
    .addEventListener(
        "click",
        function(event) {
            event.preventDefault();

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "login.html";
        }
    );

// Fill in the user's first name when possible.
function loadUserInformation() {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
        return;
    }

    try {
        const user = JSON.parse(savedUser);

        document.getElementById("fullName").value =
            user.firstName || "";
    } catch (error) {
        console.log(
            "Could not load user information."
        );
    }
}

loadUserInformation();
displayCart();