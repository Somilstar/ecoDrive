    async function loadVehicle() {

        const params = new URLSearchParams(window.location.search);
        const vehicleId = params.get("id");

        if (!vehicleId) {
            console.error("No vehicle ID found.");
            return;
        }

        try {

            const response = await fetch(
                `${CONFIG.API_BASE_URL}/api/vehicles/${vehicleId}`
            );

            const data = await response.json();
            const vehicle = data.vehicle;

            document.getElementById("vehicleName").textContent = vehicle.name;
            document.getElementById("vehicleSubtitle").textContent = vehicle.description;

            document.getElementById("vehicleBrand").textContent = vehicle.brand;
            document.getElementById("vehicleModel").textContent = vehicle.model;
            document.getElementById("vehicleYear").textContent = vehicle.modelYear;
            document.getElementById("vehiclePrice").textContent = `$${vehicle.price}`;
            document.getElementById("vehicleMileage").textContent = `${vehicle.mileage} km`;

            document.getElementById("vehicleExteriorColour").textContent = vehicle.exteriorColor;
            document.getElementById("vehicleInteriorColour").textContent = vehicle.interiorColor;
            document.getElementById("vehicleInteriorFabric").textContent = vehicle.interiorFabric;
            document.getElementById("vehicleShape").textContent = vehicle.shape;

            document.getElementById("vehicleHistoryReport").textContent = vehicle.historyReport;
            //document.getElementById("vehicleDescription").textContent = vehicle.description;
            document.getElementById("vehicleQuantity").textContent = vehicle.quantity;

            document.getElementById("vehicleImage").src = `images/${vehicle.vid}.jpg`;

        } catch (error) {
            console.error("Could not load vehicle.", error);
        }

    }

    document.addEventListener("DOMContentLoaded", loadVehicle);