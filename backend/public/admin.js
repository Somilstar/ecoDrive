document.getElementById("loadSalesBtn").addEventListener("click", async function() {
    const token = localStorage.getItem("token");
    const response = await fetch("api/admin/sales-report", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    const data = await response.json();
    document.getElementById("salesReport").textContent = JSON.stringify(data, null, 2);
    
});