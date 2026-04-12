const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

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

    // 🔥 ADD THIS (scroll to top)
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

prevBtn.addEventListener("click", () => {
    currentPage--;
    showPage(currentPage);

    // 🔥 ADD THIS (scroll to top)
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

showPage(currentPage);

// VIEW BUTTON FUNCTION
const viewButtons = document.querySelectorAll(".view-btn");

viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const place = btn.getAttribute("onclick").match(/'(.+?)'/)[1];
        window.location.href = "places.html?place=" + place;
    });
});

// MAP BUTTON FUNCTION
const mapButtons = document.querySelectorAll(".map-btn");

mapButtons.forEach((btn, index) => {

    const mapLinks = [
        "https://www.google.com/maps?q=Navaly+St+Peter+Church",
        "https://www.google.com/maps?q=Pannai+Beach",
        "https://www.google.com/maps?q=Jaffna+Fort",
        "https://www.google.com/maps?q=Jaffna+Library",
        "https://www.google.com/maps?q=Nallur+Kovil",
        "https://www.google.com/maps?q=Subramaniyam+Park",
        "https://www.google.com/maps?q=Jaffna+Clock+Tower",
        "https://www.google.com/maps?q=Keerimalai",
        "https://www.google.com/maps?q=Casuarina+Beach",
        "https://www.google.com/maps?q=Maruthadi+Pillayar+Kovil"
    ];

    btn.addEventListener("click", () => {
        window.open(mapLinks[index], "_blank");
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

