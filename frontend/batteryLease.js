let calculatedBatteryLease = null;

function initializeBatteryLeaseModal(vehicleId) { 
    const leaseButton = document.getElementById("leaseBtn"); 
    const modal = document.getElementById("batteryLeaseModal"); 
    const closeButton =
document.getElementById("closeBatteryLeaseModal"); const cancelButton =
document.getElementById("cancelBatteryLeaseBtn"); const calculateButton
= document.getElementById("calculateBatteryLeaseBtn"); const
acceptButton = document.getElementById("acceptBatteryLeaseBtn"); const
monthlyKmInput = document.getElementById("estimatedMonthlyKm");

    if (!leaseButton || !modal) {
        console.error("Battery lease modal elements were not found.");
        return;
    }

    leaseButton.addEventListener("click", () => {
        resetBatteryLeaseModal();
        modal.style.display = "flex";
    });

    closeButton.addEventListener("click", closeBatteryLeaseModal);
    cancelButton.addEventListener("click", closeBatteryLeaseModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeBatteryLeaseModal();
        }
    });

    calculateButton.addEventListener("click", async () => {
        const estimatedMonthlyKm = Number(monthlyKmInput.value);

        if (!Number.isFinite(estimatedMonthlyKm) ||
            estimatedMonthlyKm < 1 ||
            estimatedMonthlyKm > 20000) {
            alert("Enter an estimated monthly distance between 1 and 20,000 km.");
            return;
        }

        await calculateBatteryLease(vehicleId, estimatedMonthlyKm);
    });

    acceptButton.addEventListener("click", () => {
        if (!calculatedBatteryLease) {
            alert("Calculate the battery lease before accepting it.");
            return;
        }

        saveAcceptedBatteryLease(calculatedBatteryLease);
        alert("Battery lease accepted.");
        closeBatteryLeaseModal();
    });

}

async function calculateBatteryLease(vehicleId, estimatedMonthlyKm) {
const response = await fetch(
`https://ecodrive-c6ds.onrender.com/api/battery-lease/calculate`, { 
    method: "POST",
    headers: { 
        "Content-Type": "application/json"  
    },
        body: JSON.stringify({
        vehicleId, estimatedMonthlyKm }) } );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to calculate battery lease.");
    }

    calculatedBatteryLease = data;

    document.getElementById("leaseVehiclePrice").textContent =
        formatCurrency(data.basePrice);

    document.getElementById("leaseBatteryCost").textContent =
        formatCurrency(data.upfrontBatteryCost);

    document.getElementById("leaseAdjustedPrice").textContent =
        formatCurrency(data.adjustedVehiclePrice);

    document.getElementById("leaseMonthlyFee").textContent =
        formatCurrency(data.monthlySubscriptionFee) + " / month";

}

function saveAcceptedBatteryLease(lease) { localStorage.setItem(
`batteryLease_${lease.vehicleId}`, JSON.stringify(lease) ); }

function closeBatteryLeaseModal() {
document.getElementById("batteryLeaseModal").style.display = "none"; }

function resetBatteryLeaseModal() { calculatedBatteryLease = null;

    document.getElementById("estimatedMonthlyKm").value = "";
    document.getElementById("leaseVehiclePrice").textContent = "-";
    document.getElementById("leaseBatteryCost").textContent = "-";
    document.getElementById("leaseAdjustedPrice").textContent = "-";
    document.getElementById("leaseMonthlyFee").textContent = "-";

}

function formatCurrency(value) { return new Intl.NumberFormat("en-CA", {
style: "currency", currency: "CAD" }).format(Number(value)); }

document.addEventListener("DOMContentLoaded", () => { const params = new
URLSearchParams(window.location.search);

    const vehicleId =
        params.get("id") ||
        params.get("vehicleId") ||
        params.get("vid");

    if (vehicleId) {
        initializeBatteryLeaseModal(vehicleId);
    }

});