// ================= DATA =================
let placesData = [];

// ================= GET PLACE FROM URL 🔥 NEW =================
function getPlaceFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("place");
}

// ================= LOAD =================
fetch("http://localhost:3000/places")
  .then(res => res.json())
  .then(data => {
    placesData = data.sort((a, b) => a.priority - b.priority);
    renderPlaces(placesData); // show ALL 10

    autoSelectPlace(); // 🔥 NEW (important)
  });

// ================= RENDER =================
function renderPlaces(data) {
  const container = document.getElementById("suggestedContainer");
  container.innerHTML = "";

  data.forEach(place => {
    container.innerHTML += createCard(place);
  });
}

// ================= CARD =================
function createCard(place) {
  return `
    <div class="place_card">
      <img src="${place.image}">
      <h4>${place.name}</h4>
      <label>
        <input type="checkbox" value="${place.id}">
        Select Place
      </label>
    </div>
  `;
}

// ================= 🔥 AUTO SELECT FUNCTION (NEW) =================
function autoSelectPlace() {

  const placeId = getPlaceFromURL();

  if (!placeId) return;

  // ❌ Uncheck all
  document.querySelectorAll("input[type='checkbox']").forEach(cb => {
    cb.checked = false;
    cb.closest(".place_card")?.classList.remove("selected");
  });

  // ✅ Select only clicked place
  const target = document.querySelector(`input[value="${placeId}"]`);

  if (target) {
    target.checked = true;
    target.closest(".place_card").classList.add("selected");

    // 🔥 optional smooth scroll
    target.closest(".place_card").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

// ================= SMART SCORE ENGINE 🔥 =================
function getScore(place, type) {

  let score = place.priority ? (3 - place.priority) : 1;

  if (type === "children") {
    if (place.category === "park") score += 3;
    if (place.category === "natural") score += 2;
    if (place.category === "religious") score += 1;
  }

  if (type === "adults") {
    if (place.category === "historical") score += 3;
    if (place.category === "landmark") score += 2;
    if (place.category === "religious") score += 1;
  }

  if (type === "family") {
    if (place.category === "park") score += 3;
    if (place.category === "natural") score += 2;
    if (place.category === "religious") score += 2;
  }

  return score;
}

// ================= USER TYPE SMART SUGGEST =================
document.getElementById("suggestBtn").addEventListener("click", () => {

  clearPlan();

  const type = document.getElementById("userType").value;

  let scored = placesData.map(p => ({
    ...p,
    score: getScore(p, type)
  }));

  scored.sort((a, b) => b.score - a.score);

  renderPlaces(scored);

  setTimeout(() => {

    const top5 = scored.slice(0, 5);

    top5.forEach(p => {
      const checkbox = document.querySelector(`input[value="${p.id}"]`);
      if (checkbox) {
        checkbox.checked = true;
        checkbox.closest(".place_card").classList.add("selected");
      }
    });

  }, 100);
});

// ================= CLEAR =================
function clearPlan() {
  document.querySelector(".morning_slot p").innerHTML = "Select places";
  document.querySelector(".afternoon_slot p").innerHTML = "Select places";
  document.querySelector(".evening_slot p").innerHTML = "Select places";
}

// ================= DISTANCE =================
function getDistance(a, b) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

// ================= ROUTE OPTIMIZE =================
function optimizeRoute(places) {

  if (places.length <= 1) return places;

  let result = [];
  let remaining = [...places];

  let current = remaining.shift();
  result.push(current);

  while (remaining.length) {

    let nearestIndex = 0;
    let minDist = getDistance(current, remaining[0]);

    for (let i = 1; i < remaining.length; i++) {
      let dist = getDistance(current, remaining[i]);

      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }

    current = remaining.splice(nearestIndex, 1)[0];
    result.push(current);
  }

  return result;
}

// ================= SMART PLAN (Updated to respect Best Time) =================
document.getElementById("finalPlanBtn").addEventListener("click", () => {
    const checked = document.querySelectorAll("input[type='checkbox']:checked");
    let selectedPlaces = [];

    checked.forEach(cb => {
        const place = placesData.find(p => p.id === cb.value);
        if (place) selectedPlaces.push(place);
    });

    if (!selectedPlaces.length) {
        alert("Select at least one place");
        return;
    }

    // 1. Best Time அடிப்படையில் இடங்களை பிரித்தல்
    let morningList = [];
    let afternoonList = [];
    let eveningList = [];

    selectedPlaces.forEach(p => {
        const timeAttr = p.bestTime ? p.bestTime.toLowerCase() : "morning";

        if (timeAttr.includes("morning")) {
            morningList.push(p);
        } else if (timeAttr.includes("afternoon")) {
            afternoonList.push(p);
        } else if (timeAttr.includes("evening") || timeAttr.includes("night")) {
            eveningList.push(p);
        } else {
            // ஒருவேளை எதுவுமே இல்லையென்றால் Morning-ல் சேர்க்கும்
            morningList.push(p);
        }
    });

    // 2. Route-ஐ Optimize செய்தல்
    const m = optimizeRoute(morningList);
    const a = optimizeRoute(afternoonList);
    const e = optimizeRoute(eveningList);

    // 3. நேரத்தை கணக்கிடுதல் (Helper function remains same)
    function generate(places, startHour) {
        let currentTime = startHour * 60;
        let list = [];

        places.forEach(p => {
            let h = Math.floor(currentTime / 60);
            let min = currentTime % 60;

            list.push({
                name: p.name,
                time: `🕒 ${h}:${min.toString().padStart(2, "0")}`
            });

            // அந்த இடத்திற்கு ஆகும் நேரத்தை (Duration) கூட்டுகிறது
            currentTime += (p.duration || 60); 
        });

        return list;
    }

    // 4. அந்தந்த ஸ்லாட்டில் காண்பித்தல்
    renderPlan("morning_slot", generate(m, 8));    // காலை 8 மணி முதல்
    renderPlan("afternoon_slot", generate(a, 12));  // மதியம் 12 மணி முதல்
    renderPlan("evening_slot", generate(e, 16));    // மாலை 4 மணி முதல்

    document.getElementById("planSection").scrollIntoView({
        behavior: "smooth"
    });
});

// ================= RENDER PLAN =================
function renderPlan(className, list) {

  const box = document.querySelector(`.${className} p`);

  if (!list.length) {
    box.innerHTML = "No places";
    return;
  }

  box.innerHTML = list.map(item => `
    <div class="plan_item">
      <span class="plan_time">${item.time}</span>
      <span class="plan_name">${item.name}</span>
    </div>
  `).join("");
}

// ================= CHECKBOX UI =================
document.addEventListener("change", (e) => {
  if (e.target.type === "checkbox") {
    const card = e.target.closest(".place_card");
    card.classList.toggle("selected", e.target.checked);
  }
});

localStorage.setItem("lastPage", window.location.href);