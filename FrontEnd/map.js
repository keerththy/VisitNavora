// Navaly center GPS coordinates
const myHomeCoords = [9.70862976277358, 79.98787317658639]; 
const jaffnaCenter = [9.7150, 79.9950];

// Home Icon (Blue Color)
const homeIcon = L.divIcon({
    className: 'custom-home-marker',
    html: `<div class="marker-pin blue"></div><i class="fa-solid fa-house-chimney"></i>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40] // Popup opens 40px above the marker
});

// Creates a Leaflet map inside the HTML element with id="map"
// Map opens at Jaffna center, zoom level 11
const map = L.map('map', { zoomControl: false }).setView(jaffnaCenter, 11);

// Clean Modern Map Layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// 1. Custom Brown Icon Design 
const brownIcon = L.divIcon({
    className: 'custom-brown-marker',
    html: `<div class="marker-pin"></div><i class="fa-solid fa-location-dot"></i>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40]
});

// Markers management
let markerGroup = L.layerGroup().addTo(map);// holds all markers together
let allPlaces = []; // store place data from databse now emty 

// ================= LOAD FROM DB =================
async function fetchMapData() {
    try {
        // Goes to the server and asks for all places
        const res = await fetch("http://localhost:3000/places");
        allPlaces = await res.json(); // Converts the server reply into a JavaScript list
        renderMapElements(allPlaces);//Sends that list to be shown on the map
    } catch (error) {
        console.error("Error loading places for map:", error);
    }
}

function renderMapElements(data) {
    const sideList = document.getElementById('sidePlacesList');
    sideList.innerHTML = ""; 
    // Clears old markers from the map before adding new ones
    markerGroup.clearLayers(); 

    // Places a house marker at home location,
    //  shows "My Home" when clicked
    const homeMarker = L.marker(myHomeCoords, { icon: homeIcon }).addTo(markerGroup);
    homeMarker.bindPopup("<b>My Home</b>");

    //  IF NO PLACES FOUND LOGIC 
    if (data.length === 0) {
        sideList.innerHTML = `
            <div class="no-result">
                <i class="fa-solid fa-map-location-dot"></i>
                <p>No Places Found</p>
                <span>Try searching for another attraction or category</span>
            </div>
        `;
        return; // Exits function early so markers aren't processed empty
    }

    data.forEach(place => {
        //create a brown pin marker at its coordinates
        const marker = L.marker([place.lat, place.lng], { icon: brownIcon });

        //Google Maps directions link from home to that place
        const directionsURL = `https://www.google.com/maps/dir/?api=1&origin=${myHomeCoords[0]},${myHomeCoords[1]}&destination=${place.lat},${place.lng}&travelmode=driving`;

        //click the marker,
        //  a popup opens with image, name, category, and directions button

        marker.bindPopup(`
            <div style="text-align:center; min-width: 150px;">
                <img src="${place.image}" style="width:100%; border-radius:8px; margin-bottom:5px;">
                <h4 style="margin:0; font-size:14px;">${place.name}</h4>
                <p style="margin:5px 0; font-size:12px; color:#666;">${place.category}</p>
                <a href="${directionsURL}" target="_blank" style="display:inline-block; padding:5px 10px; background:#6F4E37; color:#fff; border-radius:4px; text-decoration:none; font-size:11px;">
                    <i class="fa-solid fa-route"></i> Get Directions from Home
                </a>
            </div>
        `);
        
        markerGroup.addLayer(marker);// adds the marker on to the map 

        // Sidebar Card Logic 
        //  for each place with image and info 
        const card = document.createElement('div');
        card.className = 'place-card';
        card.innerHTML = `
            <img src="${place.image}">
            <div class="place-info">
                <h4>${place.name}</h4>
                <p>${place.category} | ${place.bestTime}</p>
            </div>
        `;
        card.onclick = () => {
            // map smoothly flies to that place 
            map.flyTo([place.lat, place.lng], 16, { animate: true, duration: 1.5 });
            marker.openPopup();// opens its popup
        };
        sideList.appendChild(card);//Adds the card into the sidebar list
    });
}

function showSearchOnly() {
    //add search-only
    // search-only class hides the place list and shows only the search bar
    document.querySelector(".map-sidebar")
        .classList.add("search-only");
}

function showFullList() {
    // remove the search-only
    document.querySelector(".map-sidebar")
        .classList.remove("search-only");
}

// ================= SEARCH LOGIC =================
document.getElementById('mapSearch').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();// make case insensitive
    const filtered = allPlaces.filter(p => 
        // check the input with name and category 
        p.name.toLowerCase().includes(term) || 
        p.category.toLowerCase().includes(term)
    );
    
    renderMapElements(filtered);
});

// Run app
fetchMapData();