
// ================= SLIDER =================
function initializeSlider(placeBox) {
    const slidesContainer = placeBox.querySelector(".slides");
    const imgs = slidesContainer.querySelectorAll("img");
    const nextBtn = placeBox.querySelector(".next");
    const prevBtn = placeBox.querySelector(".prev");

    if (!imgs.length) return;

    let currentIndex = 0;

    function showSlide(index) {
        imgs.forEach(img => img.classList.remove("active"));
        imgs[index].classList.add("active");
    }

    showSlide(0);

    if (nextBtn) {
        nextBtn.onclick = () => {
            currentIndex = (currentIndex + 1) % imgs.length;
            showSlide(currentIndex);
        };
    }

    if (prevBtn) {
        prevBtn.onclick = () => {
            currentIndex = (currentIndex - 1 + imgs.length) % imgs.length;
            showSlide(currentIndex);
        };
    }
}

// ================= LOAD IMAGES =================
async function loadAllPlaceImages() {
    const allPlaces = document.querySelectorAll(".place-box");

    for (let box of allPlaces) {
        const placeId = box.id;

        try {
            const res = await fetch(`http://localhost:3000/place-images/${placeId}`);
            const images = await res.json();

            const slidesDiv = box.querySelector(".slides");
            if (!slidesDiv) continue;

            slidesDiv.innerHTML = "";

            if (!images.length) {
                slidesDiv.innerHTML = `<img src="images/placeholder.jpg" class="active">`;
                continue;
            }

            images.forEach((img, index) => {
                const imageEl = document.createElement("img");

                let path = img.image;
                path = path.replace(/^\/+/, "");

                if (!path.startsWith("images/")) {
                    path = "images/" + path;
                }

                imageEl.src = `http://localhost:3000/${path}`;
                imageEl.classList.add("slide");

                if (index === 0) imageEl.classList.add("active");

                imageEl.onerror = () => {
                    console.log("Image not found:", imageEl.src);
                };

                slidesDiv.appendChild(imageEl);
            });

            initializeSlider(box);

        } catch (err) {
            console.log("Error loading images for:", placeId, err);
        }
    }
}

// ================= PAGE LOAD =================
document.addEventListener("DOMContentLoaded", () => {

    loadAllPlaceImages();

    // highlight from URL
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

    // ================= FILTER =================
    const filter = document.getElementById("categoryFilter");

    if (filter) {
        const placeBoxes = document.querySelectorAll(".place-box");

        filter.addEventListener("change", () => {
            const value = filter.value;

            placeBoxes.forEach(place => {
                const category = place.getAttribute("data-category");

                place.style.display =
                    value === "all" || value === category
                        ? "block"
                        : "none";
            });
        });
    }

    // ================= MAP BUTTONS =================
    document.querySelectorAll(".map-btn").forEach(btn => {
        btn.onclick = () => {
            window.open(btn.getAttribute("data-map"), "_blank");
        };
    });

});

localStorage.setItem("lastPage", window.location.href);