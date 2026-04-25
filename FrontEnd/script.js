const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentPage = 0;
const itemsPerPage = 3;

let places = []; // 🔥 now from DB

// ================= LOAD FROM BACKEND =================
async function loadPlaces() {
    const res = await fetch("http://localhost:3000/places");
    places = await res.json();

    showPage(currentPage);
}

loadPlaces();

// ================= PAGINATION =================
function showPage(page) {

    const container = document.getElementById("placesContainer");
    container.innerHTML = "";

    const start = page * itemsPerPage;
    const end = start + itemsPerPage;

    const pageItems = places.slice(start, end);

    pageItems.forEach(place => {
        container.innerHTML += `
        <div class="place">
            <div>
                <img src="${place.image}">
                <h3>${place.name}</h3>
                <p>${place.category}</p>
            </div>

            <div class="buttons">
                <button class="view-btn" onclick="goToPlace('${place.id}')">
                    <i class="fa-solid fa-eye"></i>
                </button>

                <button class="map-btn" onclick="openMap('${place.lat}', '${place.lng}')">
                    <i class="fa-solid fa-location-dot"></i>
                </button>
            </div>
        </div>
        `;
    });

    prevBtn.style.display = page === 0 ? "none" : "inline-block";
    nextBtn.style.display = end >= places.length ? "none" : "inline-block";
}

// ================= NAV BUTTONS =================
nextBtn.addEventListener("click", () => {
    currentPage++;
    showPage(currentPage);

    window.scrollTo({ top: 0, behavior: "smooth" });
});

prevBtn.addEventListener("click", () => {
    currentPage--;
    showPage(currentPage);

    window.scrollTo({ top: 0, behavior: "smooth" });
});

// ================= SEARCH =================
function performSearch() {
    const value = searchInput.value.toLowerCase().trim();

    const filtered = places.filter(p =>
        p.name.toLowerCase().includes(value) ||
        p.category.toLowerCase().includes(value)
    );

    const container = document.getElementById("placesContainer");
    container.innerHTML = "";

    filtered.forEach(place => {
        container.innerHTML += `
        <div class="place">
            <div>
                <img src="${place.image}">
                <h3>${place.name}</h3>
                <p>${place.category}</p>
            </div>

            <div class="buttons">
                <button class="view-btn" onclick="goToPlace('${place.id}')">
                   <i class="fa-solid fa-eye"></i>
                </button>

                <button class="map-btn" onclick="openMap('${place.lat}', '${place.lng}')">
                   <i class="fa-solid fa-location-dot"></i>
                </button>
            </div>
        </div>
        `;
    });

    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
}

// ================= EVENTS =================
searchBtn.addEventListener("click", performSearch);

searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        performSearch();
    } else if (searchInput.value === "") {
        currentPage = 0;
        showPage(currentPage);
    }
});

// ================= HELPERS =================
function goToPlace(id) {
    window.location.href = "places.html?place=" + id;
}

function openMap(lat, lng) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
}

localStorage.setItem("lastPage", window.location.href);