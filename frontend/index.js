

document.getElementById("loadCatalogBtn").addEventListener("click", async function() {
    const catalogDiv = document.getElementById("catalog");
    catalogDiv.textContent = "Loading vehicles...";

    try {
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/vehicles`);
        const data = await response.json();
        
        catalogDiv.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        catalogDiv.textContent = "Failed to load catalog from server.";
        console.error("Catalog Fetch Error:", error);
    }
});