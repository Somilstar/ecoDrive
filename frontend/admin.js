document.addEventListener("DOMContentLoaded", () => {
    const userString = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !userString) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userString);

    if (user.role !== 'admin') {
        window.location.href = "index.html";
        return;
    }

    fetch(`${CONFIG.API_BASE_URL}/api/admin/sales-report`, {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'Success') {
                document.getElementById("totalSales").textContent = data.totalSalesRevenue.toLocaleString();
                document.getElementById("vehiclesSold").textContent = data.totalVehiclesSold;
                document.getElementById("activeAccounts").textContent = data.totalActiveAccounts;

                const tbody = document.getElementById("salesReportBody");
                tbody.innerHTML = "";
                data.salesByBrand.forEach(brand => {
                    const row = document.createElement("tr");
                    row.innerHTML = `<td>${brand.brand}</td><td>${brand.vehiclesSold}</td>`;
                    tbody.appendChild(row);
                });
            }
        })
        .catch(error => console.error('Sales report fetch failed:', error));

    fetch(`${CONFIG.API_BASE_URL}/api/admin/visit-report`, {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'Success') {
                document.getElementById("ordersPlaced").textContent = data.trafficMetrics.PURCHASE;
                document.getElementById("vehiclesViewed").textContent = data.trafficMetrics.VIEW;
                document.getElementById("reviewsSubmitted").textContent = data.totalReviewsSubmitted;
            }
        })
        .catch(error => console.error('Visit report fetch failed:', error));
});

document.getElementById("logoutBtn").addEventListener("click", (event) => {
    event.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});
