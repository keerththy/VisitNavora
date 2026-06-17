// ================= IMAGE SLIDER FUNCTION =================
// pass one place card as input
function initializeSlider(placeBox) {
    // get images and next, previous button for the selected place 
    const slidesContainer = placeBox.querySelector(".slides");
    const imgs = slidesContainer.querySelectorAll("img");
    const nextBtn = placeBox.querySelector(".next");
    const prevBtn = placeBox.querySelector(".prev");

    // If there are no images, stop the function
    if (!imgs.length) return;

    let currentIndex = 0; // keep track the current image 

    //  remove active class from ALL images — so everything hides.
    //  Then we add active only to the image we want 
    function showSlide(index) {
        imgs.forEach(img => img.classList.remove("active"));
        imgs[index].classList.add("active");
    }
    
    // When page loads, Show the first image by default
    showSlide(0);

    // Go to next image when Next button is clicked
    if (nextBtn) {
        nextBtn.onclick = () => {
            // add 1 to index. The % makes it loop back 
            currentIndex = (currentIndex + 1) % imgs.length;
            
            showSlide(currentIndex);
        };
    }

    // Go to previous image when Prev button is clicked
    if (prevBtn) {
        prevBtn.onclick = () => {
            // minus 1. add imgs.length before % to avoid negative numbers
            currentIndex = (currentIndex - 1 + imgs.length) % imgs.length;
            showSlide(currentIndex);
        };
    }
}

// ================= ASYNC API IMAGE LOADER =================
// Fetches image paths from the backend server and inserts them into HTML
async function loadAllPlaceImages() {
    const allPlaces = document.querySelectorAll(".place-box");

    // Loop through each place card on the page
    for (let box of allPlaces) {
        const placeId = box.id; // take id 

        try {
            // Fetch images array from Node.js backend using place ID
            // sends a request to the backend
            const res = await fetch(`http://localhost:3000/place-images/${placeId}`); 
            const images = await res.json();

            const slidesDiv = box.querySelector(".slides");// get slides inthe card 
            if (!slidesDiv) continue; // if doesn't exit skip and go to next 

            // Clear any existing hardcoded html content inside slides div
            slidesDiv.innerHTML = "";

            // If no images found in database, show a placeholder image
            if (!images.length) {
                slidesDiv.innerHTML = `<img src="images/placeholder.jpg" class="active">`;
                continue;
            }

            // Create <img> element dynamically,  for each image path received
            images.forEach((img, index) => {
                const imageEl = document.createElement("img");

                // Clean the path string format
                // remove extra slashes at the start. 
                // Make sure path always starts with images/ folder"
                let path = img.image;
                path = path.replace(/^\/+/, "");

                if (!path.startsWith("images/")) {
                    path = "images/" + path;
                }

                // Set full image source URL
                imageEl.src = `http://localhost:3000/${path}`;
                imageEl.classList.add("slide"); //Add slide class to all images.

                // Make the first image visible initially
                if (index === 0) imageEl.classList.add("active");

                // Error handler if image fails to load
                imageEl.onerror = () => {
                    console.log("Image not found:", imageEl.src);
                };

                slidesDiv.appendChild(imageEl); //Add this image element into the slides div in HTML
            });

            // Start the slider logic for this place card
            initializeSlider(box);

        } catch (err) {
            console.log("Error loading images for:", placeId, err);
        }
    }
}

// ================= TRAVEL ESTIMATE MODAL SYSTEM =================
// Calculates travel times based on distance and displays it inside a modal popup
function openTravelEstimate(placeId) {
    // get the place card using the id. If card not found, stop function
    const cardElement = document.getElementById(placeId);
    if (!cardElement) return;

    // Get place name and distance from HTML attributes
    const placeName = cardElement.querySelector("h3").innerText;
    const distance = parseFloat(cardElement.getAttribute("data-distance"));

    let carTime = "";
    let walkTime = "";
    let localTip = "";

    const rowBus = document.getElementById("rowBus");

    // Logic for short distance time = distance / speed  (less than 1 km)
    if (distance < 1) {
        carTime = "1 min";
        // multiply by 12 because average walking speed is about 5km/h,
        //  so small distances in minutes
        walkTime = `${Math.round(distance * 12)} mins`;
        localTip = "This place is exceptionally close! A short walk is highly recommended for an eco-friendly and healthy journey.";
        
        // Hide bus row completely for very close locations
        if (rowBus) rowBus.style.display = "none";
    } else {
        // Logic for longer distances
        carTime = `${Math.round((distance / 35) * 60)} mins`;// car average speed 35km/h, for minutes 
        
        // if distance more than 5km,
        //  show walk time in hours. If less, show in minutes. 
        walkTime = distance > 5 ? `${(distance / 5).toFixed(1)} hrs` : `${Math.round((distance / 5) * 60)} mins`;
        
        // average speed 22 km/h , add 5 extra minutes for bus stops and waiting time
        let busCalc = Math.round((distance / 22) * 60) + 5;
        const timeBusEl = document.getElementById("timeBus");
        if (timeBusEl) timeBusEl.innerText = `${busCalc} mins`;

        if (rowBus) rowBus.style.display = "flex";

        if (distance > 10) {
            localTip = "The distance is quite significant. A personal car, bike ride, or hired vehicle is the most comfortable choice.";
        } else {
            localTip = "Standard pathways via main suburban roads. Smooth travel with clear directions can be expected.";
        }
    }

    // Insert calculated data directly into the Modal elements
    document.getElementById("modalPlaceName").innerText = placeName;
    document.getElementById("timeCar").innerText = carTime;
    document.getElementById("timeWalk").innerText = walkTime;
    document.getElementById("modalLocalTip").innerText = localTip;

    // Open the modal by adding the active class
    document.getElementById("travelModal").classList.add("active");
}

// Closes the modal popup
function closeTravelModal() {
    const modal = document.getElementById("travelModal");
    if (modal) modal.classList.remove("active");
}

// ================= GLOBAL EVENT LISTENERS ON PAGE LOAD =================
document.addEventListener("DOMContentLoaded", () => {

    // 1. Fetch and load all images from server
    loadAllPlaceImages();

    // 2. Auto-scroll and highlight a place if specified in the URL query string (?place=id)
    const params = new URLSearchParams(window.location.search);
    const placeId = params.get("place");

    if (placeId) {
        const element = document.getElementById(placeId);

        if (element) {
            element.classList.add("highlight");

            setTimeout(() => {
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }, 500);
        }
    }

    // 3. Category Filter Logic
    // Get the dropdown element
    const filter = document.getElementById("categoryFilter");

    if (filter) {
        //  get all place cards
        const placeBoxes = document.querySelectorAll(".place-box");

        filter.addEventListener("change", () => {
            // Every time user changes the dropdown,  get the selected value
            const value = filter.value;

            // Loop through every place card.
            placeBoxes.forEach(place => {
                const category = place.getAttribute("data-category");

                 //  If selected value is all OR matches that card's category,
                 //  show it with flex. Otherwise hide it with none
                place.style.display =
                    value === "all" || value === category
                        ? "flex"
                        : "none";
            });
        });
    }

    // 4. Open External Maps Link in a new tab
    document.querySelectorAll(".map-btn").forEach(btn => {
        btn.onclick = () => {
            window.open(btn.getAttribute("data-map"), "_blank");
        };
    });

    // 5. Close travel modal if "Escape" key is pressed
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeTravelModal();
    });

});

// Save current URL to localStorage to track user's last visited page
localStorage.setItem("lastPage", window.location.href);