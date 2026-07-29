document.addEventListener("DOMContentLoaded", () => {
  const vehicleSelects = [
    document.getElementById("vehicleSelect1"),
    document.getElementById("vehicleSelect2"),
    document.getElementById("vehicleSelect3"),
  ];

  const compareBtn = document.getElementById("compareBtn");
  const compareMessage = document.getElementById("compareMessage");
  const compareResults = document.getElementById("compareResults");
  const authLink = document.getElementById("authLink");


  let availableVehicles = [];

  //Starts the page
  initializePage();

  function initializePage() {
    configureAuthenticationLink();
    attachEventListeners();
    loadVehicles();
  }

  //Adds event listeners to the page controls
  function attachEventListeners() {
    compareBtn.addEventListener("click", compareSelectedVehicles);

    vehicleSelects.forEach((selectElement) => {
      selectElement.addEventListener("change", () => {
        updateDisabledVehicleOptions();
        clearMessage();
      });
    });
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
      localStorage.removeItem("compareVehicleIds");

      window.location.href = "login.html";
    });
  }

  //Retrieves all vehicles from the backend catalog
  async function loadVehicles() {
    setMessage("Loading available vehicles...", "loading");
    compareBtn.disabled = true;

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

      availableVehicles = [...hotDeals, ...regularVehicles];

      if (availableVehicles.length === 0) {
        setMessage(
          "There are currently no vehicles available to compare.",
          "error",
        );

        showEmptyState("No vehicles are currently available in the catalog.");

        return;
      }

      populateVehicleDropdowns();
      restoreSavedSelections();
      updateDisabledVehicleOptions();

      compareBtn.disabled = false;
      clearMessage();
    } catch (error) {
      console.error("Vehicle Catalog Loading Error:", error);

      setMessage(
        error.message || "Failed to load vehicles from the server.",
        "error",
      );

      showEmptyState(
        "The vehicle catalog could not be loaded. Please try again later.",
      );
    }
  }

  //Adds every available vehicle to each dropdown
  function populateVehicleDropdowns() {
    vehicleSelects.forEach((selectElement, index) => {
      selectElement.innerHTML = createPlaceholderOption(index);

      availableVehicles.forEach((vehicle) => {
        const option = document.createElement("option");

        option.value = getVehicleIdentifier(vehicle);
        option.textContent = createVehicleOptionLabel(vehicle);

        selectElement.appendChild(option);
      });
    });
  }

  //Creates the correct placeholder for each dropdown
  function createPlaceholderOption(index) {
    const placeholders = [
      "Select first vehicle",
      "Select second vehicle",
      "Select third vehicle",
    ];

    return `
            <option value="">
                ${placeholders[index]}
            </option>
        `;
  }

  //Creates readable dropdown text.
  function createVehicleOptionLabel(vehicle) {
    const year = vehicle.modelYear || "";
    const brand = vehicle.brand || "";
    const model = vehicle.model || vehicle.name || "Unnamed Vehicle";

    return `${year} ${brand} ${model}`.replace(/\s+/g, " ").trim();
  }

  //Uses the custom vehicle ID when available
  function getVehicleIdentifier(vehicle) {
    return vehicle.vid || vehicle._id;
  }

  //Prevents the same vehicle from being selected in multiple dropdowns
  function updateDisabledVehicleOptions() {
    const selectedValues = vehicleSelects
      .map((selectElement) => selectElement.value)
      .filter((value) => value !== "");

    vehicleSelects.forEach((currentSelect) => {
      Array.from(currentSelect.options).forEach((option) => {
        if (option.value === "") {
          option.disabled = false;
          return;
        }

        const selectedSomewhereElse = vehicleSelects.some(
          (otherSelect) =>
            otherSelect !== currentSelect && otherSelect.value === option.value,
        );

        option.disabled = selectedSomewhereElse;
      });
    });

    console.debug("Selected compare vehicles:", selectedValues);
  }

  //Restores selections saved by the future catalog page. The catalog can later save vehicle IDs under compareVehicleIds
  function restoreSavedSelections() {
    const storedSelections = localStorage.getItem("compareVehicleIds");

    if (!storedSelections) {
      return;
    }

    try {
      const selectedVehicleIds = JSON.parse(storedSelections);

      if (!Array.isArray(selectedVehicleIds)) {
        return;
      }

      selectedVehicleIds.slice(0, 3).forEach((vehicleId, index) => {
        const idExists = availableVehicles.some(
          (vehicle) =>
            String(getVehicleIdentifier(vehicle)) === String(vehicleId),
        );

        if (idExists && vehicleSelects[index]) {
          vehicleSelects[index].value = vehicleId;
        }
      });
    } catch (error) {
      console.error("Saved Comparison Data Error:", error);
      localStorage.removeItem("compareVehicleIds");
    }
  }

  //Validates the selections and requests comparison data
  async function compareSelectedVehicles() {
    const selectedVehicleIds = vehicleSelects
      .map((selectElement) => selectElement.value)
      .filter((vehicleId) => vehicleId !== "");

    if (selectedVehicleIds.length < 2) {
      setMessage("Please select at least two vehicles to compare.", "error");

      return;
    }

    const uniqueVehicleIds = new Set(selectedVehicleIds);

    if (uniqueVehicleIds.size !== selectedVehicleIds.length) {
      setMessage(
        "The same vehicle cannot be selected more than once.",
        "error",
      );

      return;
    }

    localStorage.setItem(
      "compareVehicleIds",
      JSON.stringify(selectedVehicleIds),
    );

    setMessage("Comparing selected vehicles...", "loading");
    showEmptyState("Loading vehicle comparison...");
    compareBtn.disabled = true;

    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/api/vehicles/compare`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vehicleIds: selectedVehicleIds,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to compare the selected vehicles.",
        );
      }

      if (!Array.isArray(data.vehicles) || data.vehicles.length === 0) {
        throw new Error("No matching vehicles were returned by the server.");
      }

      const orderedVehicles = orderVehiclesBySelection(
        data.vehicles,
        selectedVehicleIds,
      );

      renderComparisonTable(orderedVehicles);
      clearMessage();
    } catch (error) {
      console.error("Vehicle Comparison Error:", error);

      setMessage(
        error.message || "Failed to compare the selected vehicles.",
        "error",
      );

      showEmptyState(
        "The comparison could not be completed. Please try again.",
      );
    } finally {
      compareBtn.disabled = false;
    }
  }

  //Reorders backend results to match the dropdown selection order
  function orderVehiclesBySelection(vehicles, selectedVehicleIds) {
    const vehicleMap = new Map();

    vehicles.forEach((vehicle) => {
      if (vehicle.vid) {
        vehicleMap.set(String(vehicle.vid), vehicle);
      }

      if (vehicle._id) {
        vehicleMap.set(String(vehicle._id), vehicle);
      }
    });

    return selectedVehicleIds
      .map((vehicleId) => vehicleMap.get(String(vehicleId)))
      .filter(Boolean);
  }

  //Creates the side-by-side comparison table
  function renderComparisonTable(vehicles) {
    const vehicleHeaders = vehicles
      .map((vehicle) => {
        const vehicleId = getVehicleIdentifier(vehicle);

        return `
                    <th scope="col" class="comparison-vehicle-heading">
                        <span class="comparison-vehicle-name">
                            ${escapeHtml(vehicle.name || "Unnamed Vehicle")}
                        </span>

                        <span class="comparison-vehicle-model">
                            ${escapeHtml(
                              `${vehicle.modelYear || ""} ${
                                vehicle.brand || ""
                              } ${vehicle.model || ""}`
                                .replace(/\s+/g, " ")
                                .trim(),
                            )}
                        </span>

                        ${
                          vehicle.isHotDeal
                            ? `
                                    <span class="comparison-hot-deal">
                                        Hot Deal
                                    </span>
                                `
                            : ""
                        }
                    </th>
                `;
      })
      .join("");

    const rows = [
      {
        label: "Price",
        getValue: (vehicle) => formatCurrency(vehicle.price),
      },
      {
        label: "Mileage",
        getValue: (vehicle) => formatMileage(vehicle.mileage),
      },
      {
        label: "Year",
        getValue: (vehicle) => vehicle.modelYear,
      },
      {
        label: "Brand",
        getValue: (vehicle) => vehicle.brand,
      },
      {
        label: "Model",
        getValue: (vehicle) => vehicle.model,
      },
      {
        label: "Body Type",
        getValue: (vehicle) => vehicle.shape,
      },
      {
        label: "Exterior Colour",
        getValue: (vehicle) => vehicle.exteriorColor,
      },
      {
        label: "Interior Colour",
        getValue: (vehicle) => vehicle.interiorColor,
      },
      {
        label: "Interior Fabric",
        getValue: (vehicle) => vehicle.interiorFabric,
      },
      {
        label: "Accident History",
        getValue: (vehicle) =>
          vehicle.historyReport?.hasAccidents
            ? "Accident reported"
            : "No accidents reported",
      },
      {
        label: "Damage Details",
        getValue: (vehicle) => vehicle.historyReport?.damageDescription,
      },
    ];

    const comparisonRows = rows
      .map((row) => {
        const vehicleCells = vehicles
          .map((vehicle) => {
            const value = row.getValue(vehicle);

            return `
                            <td>
                                ${escapeHtml(displayValue(value))}
                            </td>
                        `;
          })
          .join("");

        return `
                    <tr>
                        <th scope="row" class="comparison-row-label">
                            ${escapeHtml(row.label)}
                        </th>

                        ${vehicleCells}
                    </tr>
                `;
      })
      .join("");

    const detailLinks = vehicles
      .map((vehicle) => {
        const vehicleId = encodeURIComponent(getVehicleIdentifier(vehicle));

        return `
                    <td>
                        <a
                            href="vehicle-detail.html?id=${vehicleId}"
                            class="comparison-details-link"
                        >
                            View Details
                        </a>
                    </td>
                `;
      })
      .join("");

    compareResults.innerHTML = `
            <div class="comparison-table-wrapper">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th
                                scope="col"
                                class="comparison-row-label comparison-corner"
                            >
                                Vehicle Information
                            </th>

                            ${vehicleHeaders}
                        </tr>
                    </thead>

                    <tbody>
                        ${comparisonRows}

                        <tr class="comparison-actions-row">
                            <th scope="row" class="comparison-row-label">
                                Details
                            </th>

                            ${detailLinks}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
  }

  //Formats a vehicle price as Canadian currency
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

  //Formats mileage with commas and a km label
  function formatMileage(mileage) {
    const numericMileage = Number(mileage);

    if (!Number.isFinite(numericMileage)) {
      return "Not available";
    }

    return `${numericMileage.toLocaleString("en-CA")} km`;
  }

  //Replaces missing values with readable text
  function displayValue(value) {
    if (value === undefined || value === null || String(value).trim() === "") {
      return "Not available";
    }

    return String(value);
  }

  //Displays an initial, loading, or error message in the result area
  function showEmptyState(message) {
    compareResults.innerHTML = `
            <div class="compare-empty-state">
                <p>${escapeHtml(message)}</p>
            </div>
        `;
  }

  //Displays feedback above the results
  function setMessage(message, type) {
    compareMessage.textContent = message;
    compareMessage.className = `compare-message ${type}`;
  }

  //Removes the current feedback message
  function clearMessage() {
    compareMessage.textContent = "";
    compareMessage.className = "compare-message";
  }

  //Prevents backend text from being interpreted as HTML
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});