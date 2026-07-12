document.getElementById("loadCatalogBtn").addEventListener("click", async function() {
    const response = await fetch("/api/vehicles");
    const data = await response.json();
    document.getElementById("catalog").textContent = JSON.stringify(data, null, 2);
});
