document.addEventListener("DOMContentLoaded", () => {
  const VEHICLE_DETAILS_PAGE = "vehicle-detail.html";
  const MAX_COMPARE_VEHICLES = 3;

  const VEHICLE_IMAGES = {
    "EV-TSLA-M3-001": "img/Tesla Model 3.jpg",
    "EV-POR-TAY-002": "img/Porsche Taycan 4S.jpg",
    "EV-FRD-F150-003": "img/Ford F-150 Lightning Lariat.jpg",
    "EV-HYU-IQ5-004": "img/Hyundai Ioniq 5 SEL.jpg",
    "EV-CHV-BLT-005": "img/Chevrolet Bolt EV.jpg",
  };

  const vehicleSearch = document.getElementById("vehicleSearch");
  const brandFilter = document.getElementById("brandFilter");
  const priceFilter = document.getElementById("priceFilter");
  const sortFilter = document.getElementById("sortFilter");
  const hotDealsFilter = document.getElementById("hotDealsFilter");

  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  const compareSelectedBtn = document.getElementById("compareSelectedBtn");

  const catalogContainer = document.getElementById("catalog");
  const catalogMessage = document.getElementById("catalogMessage");
  const catalogCount = document.getElementById("catalogCount");
  const authLink = document.getElementById("authLink");

  //Stores the complete catalog received from the backend
  let allVehicles = [];

  //Stores the IDs of vehicles selected for comparison
  const selectedCompareIds = new Set();

  initializeCatalog();

  //Starts the catalog page
  function initializeCatalog() {
    configureAuthenticationLink();
    attachEventListeners();
    loadVehicles();
  }

  //Adds all required event listeners
  function attachEventListeners() {
    vehicleSearch.addEventListener("input", applyFiltersAndRender);
    brandFilter.addEventListener("change", applyFiltersAndRender);
    priceFilter.addEventListener("change", applyFiltersAndRender);
    sortFilter.addEventListener("change", applyFiltersAndRender);
    hotDealsFilter.addEventListener("change", applyFiltersAndRender);

    clearFiltersBtn.addEventListener("click", clearFilters);

    compareSelectedBtn.addEventListener("click", openComparisonPage);

    catalogContainer.addEventListener("change", handleCatalogChange);
  }

  //Changes the Login link to Logout when a user is signed in
  function configureAuthenticationLink() {
    const token = localStorage.getItem("token");

    if (!token) {
      authLink.textContent = "Login";
      authLink.href = "login.html";
      return;
    }

    authLink.textContent = "Logout";
    authLink.href = "#";

    authLink.addEventListener("click", (event) => {
      event.preventDefault();

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "login.html";
    });
  }

  //Retrieves all vehicles from the backend
  async function loadVehicles() {
    setMessage("Loading available vehicles...", "loading");
    renderEmptyState("Loading available vehicles...");

    compareSelectedBtn.disabled = true;
    clearFiltersBtn.disabled = true;

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/vehicles`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to retrieve the vehicle catalog.",
        );
      }

      const hotDeals = Array.isArray(data.hotDeals) ? data.hotDeals : [];

      const regularVehicles = Array.isArray(data.vehicles) ? data.vehicles : [];

      allVehicles = removeDuplicateVehicles([...hotDeals, ...regularVehicles]);

      if (allVehicles.length === 0) {
        renderEmptyState("There are currently no vehicles available.");

        setMessage("The vehicle catalog is currently empty.", "error");

        catalogCount.textContent = "0 vehicles";
        return;
      }

      populateBrandFilter();
      restoreCompareSelections();
      applyFiltersAndRender();

      clearFiltersBtn.disabled = false;
      clearMessage();
    } catch (error) {
      console.error("Catalog Loading Error:", error);

      renderEmptyState(
        "The vehicle catalog could not be loaded. Please try again.",
      );

      setMessage(
        error.message || "Failed to connect to the vehicle catalog.",
        "error",
      );

      catalogCount.textContent = "";
    }
  }

  // Removes duplicates in case the backend response contains the same vehicle in both the Hot Deals and regular vehicle arrays
  function removeDuplicateVehicles(vehicles) {
    const uniqueVehicles = new Map();

    vehicles.forEach((vehicle) => {
      const vehicleId = getVehicleIdentifier(vehicle);

      if (vehicleId) {
        uniqueVehicles.set(String(vehicleId), vehicle);
      }
    });

    return Array.from(uniqueVehicles.values());
  }

  //Creates the brand-filter options using the actual brands available in the database
  function populateBrandFilter() {
    const brands = [
      ...new Set(allVehicles.map((vehicle) => vehicle.brand).filter(Boolean)),
    ].sort((firstBrand, secondBrand) => firstBrand.localeCompare(secondBrand));

    brandFilter.innerHTML = '<option value="">All Brands</option>';

    brands.forEach((brand) => {
      const option = document.createElement("option");

      option.value = brand;
      option.textContent = brand;

      brandFilter.appendChild(option);
    });
  }

  //Applies search, brand, price, Hot Deal, and sorting selections
  function applyFiltersAndRender() {
    const searchTerm = vehicleSearch.value.trim().toLowerCase();

    const selectedBrand = brandFilter.value;
    const selectedPriceRange = priceFilter.value;
    const hotDealsOnly = hotDealsFilter.checked;

    let filteredVehicles = allVehicles.filter((vehicle) => {
      return (
        matchesSearch(vehicle, searchTerm) &&
        matchesBrand(vehicle, selectedBrand) &&
        matchesPriceRange(vehicle, selectedPriceRange) &&
        matchesHotDealFilter(vehicle, hotDealsOnly)
      );
    });

    filteredVehicles = sortVehicles(filteredVehicles, sortFilter.value);

    renderVehicleCards(filteredVehicles);
    updateCatalogCount(filteredVehicles.length);
  }

  //Searches the vehicle name, brand, model, year, and body type
  function matchesSearch(vehicle, searchTerm) {
    if (!searchTerm) {
      return true;
    }

    const searchableText = [
      vehicle.name,
      vehicle.brand,
      vehicle.model,
      vehicle.modelYear,
      vehicle.shape,
    ]
      .filter((value) => value !== undefined && value !== null)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchTerm);
  }

  //Checks the selected brand
  function matchesBrand(vehicle, selectedBrand) {
    if (!selectedBrand) {
      return true;
    }

    return vehicle.brand === selectedBrand;
  }

  //Applies the selected price range
  function matchesPriceRange(vehicle, selectedPriceRange) {
    if (!selectedPriceRange) {
      return true;
    }

    const price = Number(vehicle.price);

    if (!Number.isFinite(price)) {
      return false;
    }

    switch (selectedPriceRange) {
      case "under-40000":
        return price < 40000;

      case "40000-60000":
        return price >= 40000 && price < 60000;

      case "60000-80000":
        return price >= 60000 && price <= 80000;

      case "over-80000":
        return price > 80000;

      default:
        return true;
    }
  }

  //Shows only vehicles marked as Hot Deals when the checkbox is selected
  function matchesHotDealFilter(vehicle, hotDealsOnly) {
    if (!hotDealsOnly) {
      return true;
    }

    return vehicle.isHotDeal === true;
  }

  //Sorts a copy of the filtered vehicle array
  function sortVehicles(vehicles, selectedSort) {
    const sortedVehicles = [...vehicles];

    switch (selectedSort) {
      case "price-low-high":
        sortedVehicles.sort(
          (firstVehicle, secondVehicle) =>
            Number(firstVehicle.price) - Number(secondVehicle.price),
        );
        break;

      case "price-high-low":
        sortedVehicles.sort(
          (firstVehicle, secondVehicle) =>
            Number(secondVehicle.price) - Number(firstVehicle.price),
        );
        break;

      case "mileage-low-high":
        sortedVehicles.sort(
          (firstVehicle, secondVehicle) =>
            Number(firstVehicle.mileage) - Number(secondVehicle.mileage),
        );
        break;

      case "mileage-high-low":
        sortedVehicles.sort(
          (firstVehicle, secondVehicle) =>
            Number(secondVehicle.mileage) - Number(firstVehicle.mileage),
        );
        break;

      default:
        break;
    }

    return sortedVehicles;
  }

  //Displays all filtered vehicles
  function renderVehicleCards(vehicles) {
    if (vehicles.length === 0) {
      renderEmptyState("No vehicles match the selected search or filters.");

      return;
    }

    catalogContainer.innerHTML = vehicles
      .map((vehicle) => createVehicleCard(vehicle))
      .join("");
  }

  //Creates one vehicle card
  function createVehicleCard(vehicle) {
    const vehicleId = getVehicleIdentifier(vehicle);
    const encodedVehicleId = encodeURIComponent(vehicleId);
    const isSelected = selectedCompareIds.has(String(vehicleId));
    const isOutOfStock = Number(vehicle.quantity) < 1;
    const fullVehicleName = createVehicleName(vehicle);
    const vehicleImage = getVehicleImage(vehicle);

    return `
            <article
                class="vehicle-card ${isSelected ? "selected-for-compare" : ""}"
            >
                <div class="vehicle-card-top">

                    ${
                      vehicle.isHotDeal
                        ? `
                                <span class="hot-deal-badge">
                                    Hot Deal!
                                </span>
                            `
                        : `
                                <span
                                    class="hot-deal-badge-placeholder"
                                    aria-hidden="true"
                                ></span>
                            `
                    }

                    ${
                      vehicleImage
                        ? `
            <img
                src="${escapeHtml(vehicleImage)}"
                alt="${escapeHtml(vehicle.name || fullVehicleName)}"
                class="vehicle-image"
                loading="lazy"
            >
        `
                        : `
            <div
                class="vehicle-image-placeholder"
                aria-label="Vehicle image unavailable"
            >
                EcoDrive EV
            </div>
        `
                    }
                </div>

                <div class="vehicle-card-content">
                    <h2 class="vehicle-card-name">
                        ${escapeHtml(vehicle.name || fullVehicleName)}
                    </h2>

                    <p class="vehicle-card-model">
                        ${escapeHtml(fullVehicleName)}
                    </p>

                    <dl class="vehicle-card-details">
                        <div>
                            <dt>Price</dt>
                            <dd>
                                ${escapeHtml(formatCurrency(vehicle.price))}
                            </dd>
                        </div>

                        <div>
                            <dt>Mileage</dt>
                            <dd>
                                ${escapeHtml(formatMileage(vehicle.mileage))}
                            </dd>
                        </div>

                        <div>
                            <dt>Body Type</dt>
                            <dd>
                                ${escapeHtml(displayValue(vehicle.shape))}
                            </dd>
                        </div>

                        <div>
                            <dt>Year</dt>
                            <dd>
                                ${escapeHtml(displayValue(vehicle.modelYear))}
                            </dd>
                        </div>
                    </dl>

                    <p class="${
                      isOutOfStock
                        ? "vehicle-stock out-of-stock"
                        : "vehicle-stock in-stock"
                    }">
                        ${
                          isOutOfStock
                            ? "Out of Stock"
                            : `${Number(vehicle.quantity)} Available`
                        }
                    </p>
                </div>

                <div class="vehicle-card-actions">
                    <a
                        href="${VEHICLE_DETAILS_PAGE}?id=${encodedVehicleId}"
                        class="vehicle-details-button"
                    >
                        View Details
                    </a>

                    <label class="vehicle-compare-option">
                        <input
                            type="checkbox"
                            class="compare-checkbox"
                            data-vehicle-id="${escapeHtml(vehicleId)}"
                            ${isSelected ? "checked" : ""}
                        >

                        <span>Add to Compare</span>
                    </label>
                </div>
            </article>
        `;
  }

  //Creates a readable vehicle title
  function createVehicleName(vehicle) {
    return [vehicle.modelYear, vehicle.brand, vehicle.model]
      .filter(Boolean)
      .join(" ");
  }

  //Handles a comparison checkbox on a dynamically created card
  function handleCatalogChange(event) {
    if (!event.target.matches(".compare-checkbox")) {
      return;
    }

    const checkbox = event.target;
    const vehicleId = String(checkbox.dataset.vehicleId);

    if (checkbox.checked) {
      if (selectedCompareIds.size >= MAX_COMPARE_VEHICLES) {
        checkbox.checked = false;

        setMessage("You can compare a maximum of three vehicles.", "error");

        return;
      }

      selectedCompareIds.add(vehicleId);
    } else {
      selectedCompareIds.delete(vehicleId);
    }

    saveCompareSelections();
    updateCompareButton();
    updateSelectedCardAppearance(checkbox);
    clearMessage();
  }

  //Adds or removes the selected-card visual class
  function updateSelectedCardAppearance(checkbox) {
    const vehicleCard = checkbox.closest(".vehicle-card");

    if (!vehicleCard) {
      return;
    }

    vehicleCard.classList.toggle("selected-for-compare", checkbox.checked);
  }

  //Restores comparison selections previously saved by either index.js or compare.js
  function restoreCompareSelections() {
    const storedSelections = localStorage.getItem("compareVehicleIds");

    if (!storedSelections) {
      updateCompareButton();
      return;
    }

    try {
      const parsedSelections = JSON.parse(storedSelections);

      if (!Array.isArray(parsedSelections)) {
        localStorage.removeItem("compareVehicleIds");

        updateCompareButton();
        return;
      }

      const validVehicleIds = new Set(
        allVehicles.map((vehicle) => String(getVehicleIdentifier(vehicle))),
      );

      parsedSelections
        .map(String)
        .filter((vehicleId) => validVehicleIds.has(vehicleId))
        .slice(0, MAX_COMPARE_VEHICLES)
        .forEach((vehicleId) => {
          selectedCompareIds.add(vehicleId);
        });

      saveCompareSelections();
      updateCompareButton();
    } catch (error) {
      console.error("Saved Comparison Selection Error:", error);

      localStorage.removeItem("compareVehicleIds");

      selectedCompareIds.clear();
      updateCompareButton();
    }
  }

  //Saves comparison selections for compare.html
  function saveCompareSelections() {
    localStorage.setItem(
      "compareVehicleIds",
      JSON.stringify(Array.from(selectedCompareIds)),
    );
  }

  //Updates the comparison button count and enabled state
  function updateCompareButton() {
    const selectedCount = selectedCompareIds.size;

    compareSelectedBtn.textContent = `Compare Selected (${selectedCount}/3)`;

    //At least two vehicles are required by the backend comparison endpoint
    compareSelectedBtn.disabled = selectedCount < 2;
  }

  //Opens compare.html after validating the number selected
  function openComparisonPage() {
    if (selectedCompareIds.size < 2) {
      setMessage("Select at least two vehicles to compare.", "error");

      return;
    }

    saveCompareSelections();
    window.location.href = "compare.html";
  }

  //Resets all catalog controls
  function clearFilters() {
    vehicleSearch.value = "";
    brandFilter.value = "";
    priceFilter.value = "";
    sortFilter.value = "";
    hotDealsFilter.checked = false;

    clearMessage();
    applyFiltersAndRender();
  }

  //Updates the number of displayed vehicles
  function updateCatalogCount(displayedCount) {
    const totalCount = allVehicles.length;

    if (displayedCount === totalCount) {
      catalogCount.textContent = `${totalCount} ${
        totalCount === 1 ? "vehicle" : "vehicles"
      } available`;

      return;
    }

    catalogCount.textContent = `Showing ${displayedCount} of ${totalCount} vehicles`;
  }

  //Uses the custom vehicle ID first and MongoDB _id second
  function getVehicleIdentifier(vehicle) {
    return vehicle.vid || vehicle._id;
  }

  //Returns the local frontend image associated with a vehicle
  function getVehicleImage(vehicle) {
    return VEHICLE_IMAGES[vehicle.vid] || null;
  }

  //Formats a price as Canadian currency
  function formatCurrency(price) {
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice)) {
      return "Not available";
    }

    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(numericPrice);
  }

  //Formats mileage using comma separators
  function formatMileage(mileage) {
    const numericMileage = Number(mileage);

    if (!Number.isFinite(numericMileage)) {
      return "Not available";
    }

    return `${numericMileage.toLocaleString("en-CA")} km`;
  }

  //Returns readable text for missing values
  function displayValue(value) {
    if (value === undefined || value === null || String(value).trim() === "") {
      return "Not available";
    }

    return String(value);
  }

  //Displays a loading, empty, or failure state in the grid
  function renderEmptyState(message) {
    catalogContainer.innerHTML = `
            <div class="catalog-empty-state">
                <p>${escapeHtml(message)}</p>
            </div>
        `;
  }

  //Displays feedback above the vehicle grid
  function setMessage(message, type) {
    catalogMessage.textContent = message;
    catalogMessage.className = `catalog-message ${type}`;
  }

  //Removes the current feedback message
  function clearMessage() {
    catalogMessage.textContent = "";
    catalogMessage.className = "catalog-message";
  }

  //Prevents vehicle data from being interpreted as HTML
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});
