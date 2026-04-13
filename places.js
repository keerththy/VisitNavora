// Open map
const mapButtons = document.querySelectorAll(".map-btn");

mapButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const url = btn.getAttribute("data-map");
        window.open(url, "_blank");
    });
});
// Highlight logic
const params = new URLSearchParams(window.location.search);
const placeId = params.get("place");

if (placeId) {
    const element = document.getElementById(placeId);

    if (element) {
        element.classList.add("highlight");

        // scroll to that place
        element.scrollIntoView({
           behavior: "smooth",
           block: "start"
        });
    }
}

const sliders = document.querySelectorAll(".slider");

sliders.forEach((slider) => {
    const slides = slider.querySelectorAll(".slide");
    const nextBtn = slider.querySelector(".next");
    const prevBtn = slider.querySelector(".prev");

    if (slides.length === 0) return;

    let index = 0;

    function showSlide(i) {
    if (slides.length > 0) {
      slides.forEach(s => s.classList.remove("active"));
       slides[i].classList.add("active");
    }

    
}
    // ✅ ADD THIS LINE (VERY IMPORTANT)
    showSlide(0);

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            index = (index + 1) % slides.length;
            showSlide(index);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            index = (index - 1 + slides.length) % slides.length;
            showSlide(index);
        });
    }
});


const filter = document.getElementById("categoryFilter");

if (filter) {
    const placeBoxes = document.querySelectorAll(".place-box");

    filter.addEventListener("change", () => {
        const value = filter.value;

        placeBoxes.forEach(place => {
            const category = place.getAttribute("data-category");

            if (value === "all" || value === category) {
              place.style.display = "block";

              // 🔥 ADD THIS
             const slider = place.querySelector(".slider");
              if (slider) {
                const slides = slider.querySelectorAll(".slide");
                slides.forEach(s => s.classList.remove("active"));
                slides[0].classList.add("active");
              }

            } else {
               place.style.display = "none";
            }
        });
    });
}