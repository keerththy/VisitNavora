// Selecting DOM elements from the HTML file using their unique IDs
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

// Pagination State Variables: Tracks current page index and item limit per page
let currentPage = 0;
const itemsPerPage = 3;

// Global array to store fetched data from the database
let places = []; 

// ================= LOAD FROM BACKEND =================
// Asynchronous function to fetch tourist places data from local API endpoint
async function loadPlaces() {
    const res = await fetch("http://localhost:3000/places");
    places = await res.json(); // Converting the raw response stream into readable JSON array

    showPage(currentPage); // Instantly rendering the first page of items
}

// Automatically executing the fetch sequence when the script loads
loadPlaces();

// ================= PAGINATION =================
// Core function handling the slicing and dynamic rendering of data per page slice
function showPage(page) {

    const container = document.getElementById("placesContainer");
    container.innerHTML = ""; // Clearing the HTML container grid to remove old cards

    // Mathematical formula to isolate 3 records based on target page number
    const start = page * itemsPerPage;
    const end = start + itemsPerPage;

    // Slicing out a subset array containing only 3 records for the current page view
    const pageItems = places.slice(start, end);

    // Iterating through the sliced items array to build and append modern dynamic HTML cards
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

               <button class="map-btn" onclick="openMap('${place.lat}', '${place.lng}', '${encodeURIComponent(place.name)}')">
                  <i class="fa-solid fa-location-dot"></i>
                </button>
            </div>
        </div>
        `;
    });

    // Smart UI Toggle: Hiding or showing pagination buttons based on position indices
    prevBtn.style.display = page === 0 ? "none" : "inline-block"; // Hide Prev button if on page 1
    nextBtn.style.display = end >= places.length ? "none" : "inline-block"; // Hide Next button if no data left
}

// ================= NAV BUTTONS =================
// Advances state tracker to next page step and smoothly scrolls window view back to top
nextBtn.addEventListener("click", () => {
    currentPage++;
    showPage(currentPage);

    window.scrollTo({ top: 0, behavior: "smooth" });
});

// Rewinds state tracker to previous page step and smoothly scrolls window view back to top
prevBtn.addEventListener("click", () => {
    currentPage--;
    showPage(currentPage);

    window.scrollTo({ top: 0, behavior: "smooth" });
});

// ================= SEARCH =================
// Master search engine logic analyzing input characters across multiple target object properties
function performSearch() {
    // takes the value from the search bar, converts it to lowercase, and removes unnecessary spaces.
    const value = searchInput.value.toLowerCase().trim();

    // checks whether the entered value matches the place name or category.
    const filtered = places.filter(p =>
        p.name.toLowerCase().includes(value) ||
        p.category.toLowerCase().includes(value)
    );

    const container = document.getElementById("placesContainer");
    container.innerHTML = ""; // Wiping out main target display grids

    //  IF NO PLACES MATCHED IN HOME SEARCH 
    // Injects a highly polished error placeholder block if matching query arrays return empty templates
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="no-result" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #6F4E37; width: 100%;">
                <i class="fa-solid fa-magnifying-glass-location" style="font-size: 44px; margin-bottom: 16px; opacity: 0.5; color: #2D1E13;"></i>
                <h3 style="margin: 0 0 6px 0; font-size: 18px; color: #2D1E13; font-weight: 700;">No Places Found</h3>
                <p style="margin: 0; font-size: 13.5px; opacity: 0.8; font-weight: 500;">We couldn't find any results matching "${searchInput.value}".</p>
            </div>
        `;
        prevBtn.style.display = "none"; //  hiding pagination elements on empty matches
        nextBtn.style.display = "none";
        return; // Terminating function execution pipeline cleanly
    }

    // Iterating over the matched filtered sub-array to inject matching places onto screens
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

                <button class="map-btn" onclick="openMap('${place.lat}', '${place.lng}', '${encodeURIComponent(place.name)}')">
                 <i class="fa-solid fa-location-dot"></i>
                </button>
            </div>
        </div>
        `;
    });

    // Forces pagination off during ongoing active search query reviews
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
}

// ================= EVENTS =================
// Triggers search filters whenever the glass structural button element takes user click inputs
searchBtn.addEventListener("click", performSearch);

// Event listener providing instant live typing reactions or enter-key shortcut support
searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        performSearch(); // Submits filter instantly when Enter key is struck
    } else if (searchInput.value === "") {
        currentPage = 0; // Automatically resets view screen grids back to full index views if search boxes empty out
        showPage(currentPage);
    }
});

// ================= HELPERS =================
// Transitions window views into deep descriptive page layers parsing items specific ID references
function goToPlace(id) {
    window.location.href = "places.html?place=" + id;
}

// Fixed openMap function for Home Page
function openMap(lat, lng, name) {
    const decodedName = decodeURIComponent(name);
    // Name, Latitude, Longitude ellaathaiyum safe-aa Google maps-ukku query-aa mathurathu
    window.open(`https://www.google.com/maps/search/?api=1&query=${decodedName}+(${lat},${lng})`, "_blank");
}

// Stores the absolute trace address record data inside standard operational browser Local Storage vectors
localStorage.setItem("lastPage", window.location.href);