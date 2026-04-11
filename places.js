// Open map
function openMap() {
    window.open("https://www.google.com/maps", "_blank");
}

// Highlight logic
const params = new URLSearchParams(window.location.search);
const placeId = params.get("place");

if (placeId) {
    const element = document.getElementById(placeId);

    if (element) {
        element.classList.add("highlight");

        // scroll to that place
        element.scrollIntoView({ behavior: "smooth" });
    }
}

const sliders = document.querySelectorAll(".slider");

sliders.forEach((slider) => {
    const slides = slider.querySelectorAll(".slide");
    const nextBtn = slider.querySelector(".next");
    const prevBtn = slider.querySelector(".prev");

    let index = 0;

    function showSlide(i) {
        slides.forEach(slide => slide.classList.remove("active"));
        slides[i].classList.add("active");
    }

    nextBtn.addEventListener("click", () => {
        index = (index + 1) % slides.length;
        showSlide(index);
    });

    prevBtn.addEventListener("click", () => {
        index = (index - 1 + slides.length) % slides.length;
        showSlide(index);
    });
});

const filter = document.getElementById("categoryFilter");
const placeBoxes = document.querySelectorAll(".place-box");

filter.addEventListener("change", () => {
    const value = filter.value;

    placeBoxes.forEach(place => {
        const category = place.getAttribute("data-category");

        if (value === "all" || value === category) {
            place.style.display = "block";
        } else {
            place.style.display = "none";
        }
    });
});