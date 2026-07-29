

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

async function loadVehicleReviews(vehicleId) { const reviewList =
document.getElementById("reviewList");

    if (!reviewList) {
        console.error("The reviewList element was not found.");
        return;
    }

    reviewList.innerHTML = "<p>Loading reviews...</p>";

    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/vehicles/${vehicleId}/reviews`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load reviews.");
        }

        displayVehicleReviews(data);

    } catch (error) {
        console.error("Error loading reviews:", error);

        reviewList.innerHTML = "";

        const errorMessage = document.createElement("p");
        errorMessage.textContent = error.message;

        reviewList.appendChild(errorMessage);
    }

}

function displayVehicleReviews(data) { const reviewList =
document.getElementById("reviewList");

    reviewList.innerHTML = "";

    if (!data.reviews || data.reviews.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent =
            "No reviews yet. Be the first to review this vehicle.";

        reviewList.appendChild(emptyMessage);
        return;
    }

    const reviewSummary = document.createElement("div");
    reviewSummary.classList.add("review-summary");

    const averageStars = document.createElement("span");
    averageStars.classList.add("review-rating");
    averageStars.textContent = createStarRating(data.averageRating);

    const averageText = document.createElement("span");
    averageText.textContent =
        ` ${data.averageRating}/5 (${data.reviewCount} ${data.reviewCount === 1 ? "review" : "reviews"})`;

    reviewSummary.appendChild(averageStars);
    reviewSummary.appendChild(averageText);

    reviewList.appendChild(reviewSummary);

    data.reviews.forEach((review) => {
        const reviewCard = document.createElement("article");
        reviewCard.classList.add("review-card");

        const reviewHeader = document.createElement("div");
        reviewHeader.classList.add("review-card-header");

        const reviewerName = document.createElement("h3");

        const firstName = review.user?.firstName || "";
        const lastName = review.user?.lastName || "";

        reviewerName.textContent =
            `${firstName} ${lastName}`.trim() || "EcoDrive Customer";

        const rating = document.createElement("span");
        rating.classList.add("review-rating");
        rating.textContent = createStarRating(review.rating);

        reviewHeader.appendChild(reviewerName);
        reviewHeader.appendChild(rating);

        const comment = document.createElement("p");
        comment.classList.add("review-comment");
        comment.textContent = review.comment;

        const date = document.createElement("small");
        date.classList.add("review-date");
        date.textContent = review.createdAt
            ? new Date(review.createdAt).toLocaleDateString("en-CA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
              })
            : "";

        reviewCard.appendChild(reviewHeader);
        reviewCard.appendChild(comment);
        reviewCard.appendChild(date);

        reviewList.appendChild(reviewCard);
    });

}

function createStarRating(rating) { const roundedRating =
Math.round(Number(rating));

    return "★".repeat(roundedRating) +
           "☆".repeat(5 - roundedRating);

}


document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const vehicleId = params.get("id");
    if (!vehicleId){
        console.error("Vehicle ID is missing");
        return;
    }
    initializeReviewPopup(vehicleId);
    loadVehicleReviews(vehicleId);
});