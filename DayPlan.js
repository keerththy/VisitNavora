// ================= DATA =================
let placesData = [];
let placesLoaded = false;

// ================= LOAD =================
fetch("places.json")
  .then(res => res.json())
  .then(data => {
    placesData = data;
    renderPlaces(data);
    placesLoaded = true;
  });




// ================= RENDER =================
function renderPlaces(data) {
  const suggestedContainer = document.getElementById("suggestedContainer");
  const otherContainer = document.getElementById("otherContainer");

  suggestedContainer.innerHTML = "";
  otherContainer.innerHTML = "";

  data.forEach(place => {
    suggestedContainer.innerHTML += createCard(place);
  });

  document.getElementById("otherSection").style.display = "none";
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

// ================= CATEGORY FILTER =================
function filterByCategory(category) {
  if (!category || category === "All") return placesData;
  return placesData.filter(p => p.category === category);
}

// ================= SUGGEST BUTTON =================
document.getElementById("suggestBtn").addEventListener("click", () => {

   clearPlan();
  const category = document.getElementById("categorySelect").value;
  const filtered = filterByCategory(category);

  const suggestedContainer = document.getElementById("suggestedContainer");
  const otherContainer = document.getElementById("otherContainer");

  suggestedContainer.innerHTML = "";
  otherContainer.innerHTML = "";

  placesData.forEach(place => {

    const card = createCard(place);

    if (filtered.includes(place)) {
      suggestedContainer.innerHTML += card;
    } else {
      otherContainer.innerHTML += card;
    }
  });

  document.getElementById("otherSection").style.display = "block";

  document.getElementById("suggestedSection")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});


// ================= TIME GENERATOR =================
function getTime(slot, index) {

  const base = {
    morning: 8,
    afternoon: 12,
    evening: 16
  };

  const hour = base[slot] + index;
  const min = index % 2 === 0 ? "00" : "30";

  return `🕒 ${hour}:${min}`;
}


function clearPlan() {

  document.querySelector(".morning_slot p").innerHTML = "Select places to generate plan";
  document.querySelector(".afternoon_slot p").innerHTML = "Select places to generate plan";
  document.querySelector(".evening_slot p").innerHTML = "Select places to generate plan";

}

// ================= PLAN BUTTON =================
document.getElementById("finalPlanBtn").addEventListener("click", () => {

  const timeSlot = document.getElementById("timeSlot").value;
  const checked = document.querySelectorAll("input[type='checkbox']:checked");

  let selectedPlaces = [];

  checked.forEach(cb => {
    const place = placesData.find(p => p.id === cb.value);
    if (place) selectedPlaces.push(place);
  });

  // ================= SINGLE SLOT MODE =================
  if (timeSlot === "morning") {

    const list = selectedPlaces.map((p, i) => ({
      name: p.name,
      time: `🕒 ${8 + i}:00 AM`
    }));

    renderPlan("morning_slot", list);
    hideBox("afternoon_slot");
    hideBox("evening_slot");
  }

  else if (timeSlot === "afternoon") {

    const list = selectedPlaces.map((p, i) => ({
      name: p.name,
      time: `🕒 ${12 + i}:00 PM`
    }));

    renderPlan("afternoon_slot", list);
    hideBox("morning_slot");
    hideBox("evening_slot");
  }

  else if (timeSlot === "evening") {

    const list = selectedPlaces.map((p, i) => ({
      name: p.name,
      time: `🕒 ${16 + i}:00 PM`
    }));

    renderPlan("evening_slot", list);
    hideBox("morning_slot");
    hideBox("afternoon_slot");
  }

  // ================= FULL DAY MODE =================
  else {

    const n = selectedPlaces.length;

    const morningCount = Math.ceil(n / 3);
    const afternoonCount = Math.ceil((n - morningCount) / 2);

    const morningPlaces = selectedPlaces.slice(0, morningCount);
    const afternoonPlaces = selectedPlaces.slice(morningCount, morningCount + afternoonCount);
    const eveningPlaces = selectedPlaces.slice(morningCount + afternoonCount);

    const morning = morningPlaces.map((p, i) => ({
      name: p.name,
      time: `🕒 ${8 + i}:00 AM`
    }));

    const afternoon = afternoonPlaces.map((p, i) => ({
      name: p.name,
      time: `🕒 ${12 + i}:00 PM`
    }));

    const evening = eveningPlaces.map((p, i) => ({
      name: p.name,
      time: `🕒 ${16 + i}:00 PM`
    }));

    renderPlan("morning_slot", morning);
    renderPlan("afternoon_slot", afternoon);
    renderPlan("evening_slot", evening);
  }

 
  setTimeout(() => {
  const section = document.getElementById("planSection");

  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}, 50);

  

});

window.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);
  const selectedPlace = params.get("place");

  if (!selectedPlace) return;

  const timer = setInterval(() => {

    if (!placesLoaded) return; // ✅ wait for data

    const checkbox = document.querySelector(
      `input[value="${selectedPlace}"]`
    );

    if (checkbox) {
      checkbox.checked = true;

      const card = checkbox.closest(".place_card");
      if (card) {
        card.classList.add("selected");
        card.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }

      clearInterval(timer);
    }

  }, 150);

});

// ================= RENDER PLAN =================
function renderPlan(className, list) {

  const box = document.querySelector(`.${className} p`);

  if (!list.length) {
    box.innerHTML = "Select places to generate plan";
    return;
  }

  box.innerHTML = list.map(item => `
    <div class="plan_item">
      <span class="plan_time">${item.time}</span>
      <span class="plan_name">${item.name}</span>
    </div>
  `).join("");
}