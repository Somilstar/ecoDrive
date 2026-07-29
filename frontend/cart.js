const CART_STORAGE_KEY = "ecoDriveCart";

// Load the cart when the page opens.
let cart = loadCart();

const cartItemsElement = document.getElementById("cartItems");
const emptyCartMessage = document.getElementById("emptyCartMessage");
const checkoutForm = document.getElementById("checkoutForm");
const submitOrderButton = document.getElementById("submitOrderButton");
const checkoutMessage = document.getElementById("checkoutMessage");

// Load the saved cart from localStorage.
function loadCart() {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

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
        const vehicleElement = document.createElement("div");
        vehicleElement.className = "checkout-cart-item";

        const vehicleName = document.createElement("h3");
        vehicleName.textContent = vehicle.name;

        const vehiclePrice = document.createElement("p");
        vehiclePrice.textContent =
            "Price: " + formatPrice(vehicle.price);

        const vehicleQuantity = document.createElement("p");
        vehicleQuantity.textContent = "Quantity: 1";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-cart-button";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", function() {
            removeVehicle(index);
        });

        vehicleElement.appendChild(vehicleName);
        vehicleElement.appendChild(vehiclePrice);
        vehicleElement.appendChild(vehicleQuantity);
        vehicleElement.appendChild(removeButton);

        cartItemsElement.appendChild(vehicleElement);
    });

    updateOrderSummary();
}

// Remove a vehicle from the cart.
function removeVehicle(index) {
    cart.splice(index, 1);

    saveCart();
    displayCart();
    if (typeof updateCartCount === "function"){
        updateCartCount();
    }
}

// Calculate and display the total.
function updateOrderSummary() {
    let subtotal = 0;

    cart.forEach(function(vehicle) {
        subtotal += Number(vehicle.price);
    });

    /*
     * The backend currently does not calculate tax.
     * Tax stays at zero so both totals match.
     * //todo add logic later?
     */
    const tax = 0;
    const total = subtotal + tax;

    document.getElementById("subtotal").textContent =
        formatPrice(subtotal);

    document.getElementById("tax").textContent =
        formatPrice(tax);

    document.getElementById("total").textContent =
        formatPrice(total);
}

// Display a checkout message.
function showMessage(message, messageType) {
    checkoutMessage.textContent = message;
    checkoutMessage.className = "checkout-message";

    if (messageType) {
        checkoutMessage.classList.add(messageType);
    }
}

// Send the checkout request to the backend.
checkoutForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");

    // Checkout requires the user to be logged in.
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (cart.length === 0) {
        showMessage("Your cart is empty.", "error");
        return;
    }

    const checkoutData = {
        shippingAddress: {
            street: document.getElementById("street").value.trim(),
            city: document.getElementById("city").value.trim(),
            province: document.getElementById("province").value,
            country: "Canada",
            postalCode: document
                .getElementById("postalCode")
                .value
                .trim()
                .toUpperCase(),
            phone: document.getElementById("phone").value.trim()
        },

        items: cart.map(function(vehicle) {
            return {
                vehicleId: vehicle.vehicleId,
                selectedCustomizationOptions:
                    vehicle.selectedCustomizationOptions || []
            };
        }),

        creditCard: {
            cardNumber:
                document.getElementById("cardNumber").value,

            expiry:
                document.getElementById("expiry").value,

            cvv:
                document.getElementById("cvv").value
        }
    };

    submitOrderButton.disabled = true;
    submitOrderButton.textContent = "Processing...";

    showMessage("Processing your order.", "");

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

        if (response.ok && data.status === "Success") {
            showMessage(
                `Order completed. Order ID: ${data.orderId}`,
                "success"
            );

            // Clear the cart after a successful checkout.
            cart = [];
            saveCart();
            checkoutForm.reset();
            displayCart();
        } else {
            showMessage(
                data.message || "Checkout failed.",
                "error"
            );
        }
    } catch (error) {
        showMessage(
            "Could not connect to the checkout server.",
            "error"
        );
    }

    submitOrderButton.textContent = "Submit Order";

    if (cart.length > 0) {
        submitOrderButton.disabled = false;
    }
});

// Log the user out.
document
    .getElementById("logoutLink")
    .addEventListener("click", function(event) {
        event.preventDefault();

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "login.html";
    });

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
        console.log("Could not load user information.");
    }
}

loadUserInformation();
displayCart();