// ================= DATA =================
let placesData = [];

// ================= GET PLACE FROM URL =================
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
    autoSelectPlace(); 
  });

// ================= RENDER =================
function renderPlaces(data) {
  const container = document.getElementById("suggestedContainer");
  if (!container) return;
  container.innerHTML = "";
  data.forEach(place => {
    container.innerHTML += createCard(place);
  });
}

// ================= CARD =================
function createCard(place) {
  // Keeping exact structure and adding distance visibility metrics to choice panels
  return `
    <div class="place_card" data-id="${place.id}">
      <img src="${place.image}">
      <h4>${place.name}</h4>
      ${place.distance ? `<div style="font-size: 12px; color: #8B6F47; font-weight:600; margin-bottom:8px;">📍 ${place.distance}</div>` : ""}
      <label>
        <input type="checkbox" value="${place.id}">
        Select Place
      </label>
    </div>
  `;
}

// ================= AUTO SELECT FUNCTION =================
function autoSelectPlace() {
  const placeId = getPlaceFromURL();
  if (!placeId) return;

  document.querySelectorAll("input[type='checkbox']").forEach(cb => {
    cb.checked = false;
    cb.closest(".place_card")?.classList.remove("selected");
  });

  const target = document.querySelector(`input[value="${placeId}"]`);
  if (target) {
    target.checked = true;
    target.closest(".place_card")?.classList.add("selected");
    target.closest(".place_card")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

// ================= SMART SCORE ENGINE =================
function getScore(place, type) {
  //Start with a base score. If priority is 1 → score = 2, priority 2 → score = 1. 
  let score = place.priority ? (3 - place.priority) : 1;
  
  if (type === "children") {
    if (place.category === "park") score += 10;     // park and natural places get +10 score
    if (place.category === "natural") score += 10;  // they go to top  
    // Maththa categories-ku extra score ethuvum kidaikaathu, so low priority aagidum
  }
  if (type === "adults") {
    if (place.category === "historical") score += 3;//gets extra 3 score 
    if (place.category === "landmark") score += 2; // gets 2 
    if (place.category === "religious") score += 1; // add 1 
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

  // Score athiga irukura order-la arrange aagum (Moththa 10 cards-um render aagum, ethuvum hide ஆகாது)
  scored.sort((a, b) => b.score - a.score);
  renderPlaces(scored);

  setTimeout(() => {
    scored.forEach(p => {
      const checkbox = document.querySelector(`input[value="${p.id}"]`);
      if (checkbox) {
        if (type === "children") {
          // Children-ku, category dynamic-a check panni 'park' or 'natural' mattumae checked aagum
          if (p.category === "park" || p.category === "natural") {
            checkbox.checked = true;
            checkbox.closest(".place_card")?.classList.add("selected");
          } else {
            checkbox.checked = false;
            checkbox.closest(".place_card")?.classList.remove("selected");
          }
        } else {
          // Adults matrum Family-ku unga pazhaya Top 5 select aagura logic appadiye work aagum
          const top5 = scored.slice(0, 5);
          const isTop5 = top5.some(topPlace => topPlace.id === p.id);
          if (isTop5) {
            checkbox.checked = true;
            checkbox.closest(".place_card")?.classList.add("selected");
          }
        }
      }
    });
  }, 100);
});

// ================= CLEAR =================
function clearPlan() {
  document.querySelectorAll(".morning_slot .slot_items_container, .morning_slot p").forEach(el => el.innerHTML = "Select places");
  document.querySelectorAll(".afternoon_slot .slot_items_container, .afternoon_slot p").forEach(el => el.innerHTML = "Select places");
  document.querySelectorAll(".evening_slot .slot_items_container, .evening_slot p").forEach(el => el.innerHTML = "Select places");
}

// ================= DISTANCE =================
function getDistance(a, b) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

// ================= ROUTE OPTIMIZE =================
function optimizeRoute(places) {
  // If only one place selected, just return the place  no need to optimize
  if (places.length <= 1) return places;

  let result = []; // final sorted list (empty at start)
  let remaining = [...places]; //all selected places 
  let current = remaining.shift(); //Take the first place out of remaining 
  result.push(current); // make it our starting point, add it to result.

  while (remaining.length) {
    
    let nearestIndex = 0;
    //Assume the first place in remaining is the nearest one
    let minDist = getDistance(current, remaining[0]); 
    

    //Check all other remaining places 
    //  if any place is closer than current nearest, update it 
    
    for (let i = 1; i < remaining.length; i++) {
      let dist = getDistance(current, remaining[i]);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }
    //Remove that nearest place from remaining list,
    //  add it to result. Now it becomes our new current location
    current = remaining.splice(nearestIndex, 1)[0];
    result.push(current);
  }
  return result;
}

// ================= SMART PLAN (Universal Dynamic 3-Way Auto Balancing) =================
document.getElementById("finalPlanBtn").addEventListener("click", () => {
    const checked = document.querySelectorAll("input[type='checkbox']:checked");
    let selectedPlaces = [];

    checked.forEach(cb => {
        const place = placesData.find(p => p.id === cb.value);
        if (place) {
            selectedPlaces.push({ ...place, note: "" }); 
        }
    });

    if (!selectedPlaces.length) {
        alert("Select at least one place");
        return;
    }
    
    let morningList = [];
    let afternoonList = [];
    let eveningList = [];

    // Step 1: First split all selected places into 3 lists
    //  based on their bestTime value from database. If no bestTime, default to morning
    selectedPlaces.forEach(p => {
        const timeAttr = p.bestTime ? p.bestTime.toLowerCase() : "morning";

        if (timeAttr.includes("morning")) {
            morningList.push(p);
        } else if (timeAttr.includes("afternoon")) {
            afternoonList.push(p);
        } else if (timeAttr.includes("evening") || timeAttr.includes("night")) {
            eveningList.push(p);
        } else {
            morningList.push(p);
        }
    });

    // Step 2: UNIVERSAL 3-WAY BALANCING ENGINE
    if (selectedPlaces.length >= 3) {
        let attempts = 0;
        while ((morningList.length === 0 || afternoonList.length === 0 || eveningList.length === 0) && attempts < 3) {

          //If morning is empty, 
            
            if (morningList.length === 0) {
                if (afternoonList.length > 1) {
                  //  steal one place from afternoon — but only if afternoon has more than 1
                    let shifted = afternoonList.shift();
                    //add a note so user knows this place was moved
                    shifted.note = `💡 Best in ${shifted.bestTime || 'Afternoon'}`;
                    morningList.push(shifted); 
                } else if (eveningList.length > 1) {
                    let shifted = eveningList.shift();
                    shifted.note = `💡 Best in ${shifted.bestTime || 'Evening'}`;
                    morningList.push(shifted);
                }
            }

            if (afternoonList.length === 0) {
                if (morningList.length > 1) {
                    let shifted = morningList.pop();
                    shifted.note = `💡 Best in ${shifted.bestTime || 'Morning'}`;
                    afternoonList.push(shifted);
                } else if (eveningList.length > 1) {
                    let shifted = eveningList.shift();
                    shifted.note = `💡 Best in ${shifted.bestTime || 'Evening'}`;
                    afternoonList.push(shifted);
                }
            }

            if (eveningList.length === 0) {
                if (afternoonList.length > 1) {
                    let shifted = afternoonList.pop();
                    shifted.note = `💡 Best in ${shifted.bestTime || 'Afternoon'}`;
                    eveningList.push(shifted);
                } else if (morningList.length > 1) {
                    let shifted = morningList.pop();
                    shifted.note = `💡 Best in ${shifted.bestTime || 'Morning'}`;
                    eveningList.push(shifted);
                }
            }
            
            attempts++;
        }
    }

    // Step 3: Route optimization execution inside calibrated timeline brackets
    const m = optimizeRoute(morningList);
    const a = optimizeRoute(afternoonList);
    const e = optimizeRoute(eveningList);

    // Step 4: Time block scheduler algorithm matrix
    function generate(places, startHour) {
      // Convert start hour to minutes
        let currentTime = startHour * 60;
        let list = [];

        places.forEach(p => {
            let h = Math.floor(currentTime / 60);
            let min = currentTime % 60;

            //For each place, calculate its time slot and push to list.
            //  Add the place's duration to currentTime for next place.
            //  If no duration in database, assume 60 minutes

            list.push({
                name: p.name,
                time: `🕒 ${h}:${min.toString().padStart(2, "0")}`,
                distance: p.distance || "0.0 km", // Injection of real distance from node
                note: p.note || "" 
            });

            currentTime += (p.duration || 60); 
        });

        return list;
    }

    // Morning starts at 8am, afternoon at 12pm, evening at 4pm — render each slot
    renderPlan("morning_slot", generate(m, 8));    
    renderPlan("afternoon_slot", generate(a, 12));  
    renderPlan("evening_slot", generate(e, 16));    

    document.getElementById("planSection")?.scrollIntoView({
        behavior: "smooth"
    });
});

// ================= RENDER PLAN (Supporting Connected Nodes & Pure Typography) =================
function renderPlan(className, list) {

  // Find the container div for that time slot. If not found, stop
  const box = document.querySelector(`.${className} .slot_items_container`);
  if (!box) return;

  // If no places in this slot, show Relax message instead of empty box

  if (!list.length) {
    box.innerHTML = `<div style="color: #A38A75; padding: 12px; font-size: 13px; font-style: italic; font-weight: 500; text-align: center;">Relax / Free Time</div>`;
    return;
  }

  // Purely rendering time, name, and best-time notes when available 
  box.innerHTML = list.map(item => `
    <div class="plan_item">
      <span class="plan_time">${item.time}</span>
      <span class="plan_name">${item.name}</span>
      ${item.note ? `<span style="font-size: 11px; color: #8B6F47; font-weight: 600; display: block; margin-top: 2px;">${item.note}</span>` : ""}
    </div>
  `).join(""); // combine all div 
}

// ================= CHECKBOX UI =================
document.addEventListener("change", (e) => {
  if (e.target.type === "checkbox") {
    const card = e.target.closest(".place_card");
    card?.classList.toggle("selected", e.target.checked);
  }
});

localStorage.setItem("lastPage", window.location.href);