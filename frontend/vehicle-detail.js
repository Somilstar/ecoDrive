const CART_STORAGE_KEY = "ecoDriveCart";
const VEHICLE_IMAGES = {
    "EV-TSLA-M3-001": "img/Tesla Model 3.jpg",
    "EV-POR-TAY-002": "img/Porsche Taycan 4S.jpg",
    "EV-FRD-F150-003": "img/Ford F-150 Lightning Lariat.jpg",
    "EV-HYU-IQ5-004": "img/Hyundai Ioniq 5 SEL.jpg",
    "EV-CHV-BLT-005": "img/Chevrolet Bolt EV.jpg",
  };

  let currentVehicle = null;
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
function saveCart(cart) {
    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
    );
}

function updateCartCount(){
    const cart = loadCart();
    const cartCount = document.getElementById("cartCount");
    if (cartCount){
        cartCount.textContent = cart.length;
    }
}

function addCurrentVehicleToCart(){
    if (!currentVehicle){
        alert("The vehicle has not loaded.");
        return;
    }
    const cart = loadCart();
    const alreadyInCart = cart.some(function(cartVehicle){
        return cartVehicle.vehicleId == currentVehicle.vid;
    });
    if (alreadyInCart){
        alert("This vehicle is already in your cart.");
        return;
    }
    const cartVehicle = {
        vehicleId: currentVehicle.vid,
        name: currentVehicle.name,
        price: Number(currentVehicle.price),
        selectedCustomizationOptions: []
    };
    cart.push(cartVehicle);
    saveCart(cart);
    updateCartCount();
    alert("Vehicle has been added to cart.");
}

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
            currentVehicle = vehicle;
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

            const vehicleImage = document.getElementById("vehicleImage");
            vehicleImage.src = VEHICLE_IMAGES[vehicle.vid] || "img/placeholder.jpg";
            vehicleImage.alt = vehicle.name;

        } catch (error) {
            console.error("Could not load vehicle.", error);
        }

    }

    document.addEventListener("DOMContentLoaded", function(){
        updateCartCount();
        loadVehicle();
        
        const addToCartButton = document.getElementById("addToCartBtn");
        addToCartButton.addEventListener("click", addCurrentVehicleToCart);
    });