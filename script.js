const places = document.querySelectorAll(".place");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentPage = 0;
const itemsPerPage = 3;

function showPage(page) {
    places.forEach(place => {
        place.style.display = "none";
    });

    const start = page * itemsPerPage;
    const end = start + itemsPerPage;

    for (let i = start; i < end; i++) {
        if (places[i]) {
            places[i].style.display = "inline-block";
        }
    }

    prevBtn.style.display = page === 0 ? "none" : "inline-block";
    nextBtn.style.display = end >= places.length ? "none" : "inline-block";
}

nextBtn.addEventListener("click", () => {
    currentPage++;
    showPage(currentPage);
});

prevBtn.addEventListener("click", () => {
    currentPage--;
    showPage(currentPage);
});

showPage(currentPage);

// VIEW BUTTON FUNCTION
const viewButtons = document.querySelectorAll(".view-btn");

viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        alert("Go to detailed page (we will build this next)");
    });
});

// MAP BUTTON FUNCTION
const mapButtons = document.querySelectorAll(".map-btn");

mapButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        window.open("https://www.google.com/maps", "_blank");
    });
});

// SEARCH function
function performSearch() {
    const value = searchInput.value.toLowerCase().trim();

    places.forEach(place => {
        const text = place.innerText.toLowerCase();
        place.style.display = text.includes(value) ? "inline-block" : "none";
    });

    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
}

// Click search icon
searchBtn.addEventListener("click", performSearch);

// Press Enter
searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        performSearch();
    } else if (searchInput.value === "") {
        currentPage = 0; // reset pagination
        showPage(currentPage);
    }
});

