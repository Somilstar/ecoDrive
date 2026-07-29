const CART_STORAGE_KEY = "ecoDriveCart";

const loanForm = document.getElementById("loanForm");
const loanMessage = document.getElementById("loanMessage");

let vehicleTotal = getVehicleTotal();

// Load the vehicles from the current cart.
function getVehicleTotal() {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
        return 0;
    }

    try {
        const cart = JSON.parse(savedCart);

        let total = 0;

        cart.forEach(function(vehicle) {
            total += Number(vehicle.price);
        });

        return total;
    } catch (error) {
        return 0;
    }
}

// Format a value as Canadian currency.
function formatPrice(price) {
    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD"
    }).format(price);
}

// Display the cart total when the page opens.
function displayVehicleTotal() {
    document.getElementById("vehicleTotal").value =
        formatPrice(vehicleTotal);

    if (vehicleTotal === 0) {
        loanMessage.textContent =
            "Your cart is empty. Add a vehicle before calculating a loan.";

        loanMessage.className = "loan-message error";
    }
}

// Calculate the estimated loan payments.
loanForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const downPayment = Number(
        document.getElementById("downPayment").value
    );

    const annualInterestRate = Number(
        document.getElementById("interestRate").value
    );

    const numberOfMonths = Number(
        document.getElementById("loanTerm").value
    );

    if (vehicleTotal <= 0) {
        showMessage(
            "Your cart is empty. Add a vehicle before calculating a loan.",
            "error"
        );

        return;
    }

    if (downPayment < 0) {
        showMessage(
            "The down payment cannot be negative.",
            "error"
        );

        return;
    }

    if (downPayment > vehicleTotal) {
        showMessage(
            "The down payment cannot be greater than the vehicle total.",
            "error"
        );

        return;
    }

    if (annualInterestRate < 0) {
        showMessage(
            "The interest rate cannot be negative.",
            "error"
        );

        return;
    }

    const amountFinanced = vehicleTotal - downPayment;
    const monthlyInterestRate = annualInterestRate / 100 / 12;

    let monthlyPayment;

    // Avoid dividing by zero for a zero-interest loan.
    if (monthlyInterestRate === 0) {
        monthlyPayment = amountFinanced / numberOfMonths;
    } else {
        const interestMultiplier = Math.pow(
            1 + monthlyInterestRate,
            numberOfMonths
        );

        monthlyPayment =
            amountFinanced *
            (
                monthlyInterestRate * interestMultiplier
            ) /
            (
                interestMultiplier - 1
            );
    }

    const totalRepayment =
        monthlyPayment * numberOfMonths;

    const totalInterest =
        totalRepayment - amountFinanced;

    document.getElementById("amountFinanced").textContent =
        formatPrice(amountFinanced);

    document.getElementById("monthlyPayment").textContent =
        formatPrice(monthlyPayment);

    document.getElementById("totalInterest").textContent =
        formatPrice(totalInterest);

    document.getElementById("totalRepayment").textContent =
        formatPrice(totalRepayment);

    showMessage(
        "Loan estimate calculated successfully.",
        "success"
    );
});

// Display a success or error message.
function showMessage(message, messageType) {
    loanMessage.textContent = message;
    loanMessage.className = "loan-message";

    if (messageType) {
        loanMessage.classList.add(messageType);
    }
}

// Log the user out.
document
    .getElementById("logoutLink")
    .addEventListener("click", function(event) {
        event.preventDefault();

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "login.html";
    });

displayVehicleTotal();