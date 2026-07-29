

let selectedRating = 0;

function initializeReviewPopup(vehicleId) {

    const modal = document.getElementById("reviewModal");
    const reviewButton = document.getElementById("reviewBtn");
    const closeButton = document.getElementById("closeReviewModal");
    const cancelButton = document.getElementById("cancelReviewBtn");
    const submitButton = document.getElementById("submitReviewBtn");
    const stars = document.querySelectorAll(".star");
    const comment = document.getElementById("reviewComment");
    const ratingText = document.getElementById("selectedRating");

    reviewButton.addEventListener("click", () => {
        modal.style.display = "flex";
    });

    closeButton.addEventListener("click", closeModal);

    if (cancelButton) {
        cancelButton.addEventListener("click", closeModal);
    }

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    stars.forEach(star => {
        star.addEventListener("click", () => {
            selectedRating = Number(star.dataset.value);
            highlightStars(selectedRating);
            ratingText.textContent = "Rating: " + selectedRating + "/5";
        });
    });

    submitButton.addEventListener("click", async () => {

        const reviewText = comment.value.trim();

        if (selectedRating === 0) {
            alert("Please select a rating.");
            return;
        }

        if (reviewText === "") {
            alert("Please enter a review.");
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            alert("Please log in first.");
            return;
        }

        try {

            const response = await fetch(
                `https://ecodrive-c6ds.onrender.com/api/vehicles/${vehicleId}/reviews`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        rating: selectedRating,
                        comment: reviewText
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to submit review.");
            }

            alert("Review submitted successfully.");

            closeModal();

            if (typeof loadVehicleReviews === "function") {
                loadVehicleReviews(vehicleId);
            }

        } catch (error) {
            alert(error.message);
        }

    });

    function closeModal() {
        modal.style.display = "none";
        clearReviewPopup();
    }

}

function highlightStars(rating) {

    const stars = document.querySelectorAll(".star");

    stars.forEach(star => {

        if (Number(star.dataset.value) <= rating) {
            star.classList.add("selected");
        } else {
            star.classList.remove("selected");
        }

    });

}

function clearReviewPopup() {

    selectedRating = 0;

    document.getElementById("reviewComment").value = "";

    const ratingText = document.getElementById("selectedRating");
    if (ratingText) {
        ratingText.textContent = "Select a rating";
    }

    highlightStars(0);

}

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const vehicleId = params.get("id");
    if (!vehicleId){
        console.error("Vehicle ID is missing");
        return;
    }
    initializeReviewPopup(vehicleId);
});