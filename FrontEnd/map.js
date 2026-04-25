// Navaly center coordinates

const myHomeCoords = [9.70862976277358, 79.98787317658639]; 
const jaffnaCenter = [9.7150, 79.9950];

// Home Icon (Blue Color)
const homeIcon = L.divIcon({
    className: 'custom-home-marker',
    html: `<div class="marker-pin blue"></div><i class="fa-solid fa-house-chimney"></i>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40]
});

// initialize Map
const map = L.map('map', { zoomControl: false }).setView(jaffnaCenter, 11);
 


// Clean Modern Map Layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// 1. Custom Brown Icon Design (Top-la add panniyachu)
const brownIcon = L.divIcon({
    className: 'custom-brown-marker',
    html: `<div class="marker-pin"></div><i class="fa-solid fa-location-dot"></i>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40]
});

// Markers management
let markerGroup = L.layerGroup().addTo(map);
let allPlaces = [];

// ================= LOAD FROM DB =================
async function fetchMapData() {
    try {
        const res = await fetch("http://localhost:3000/places");
        allPlaces = await res.json();
        renderMapElements(allPlaces);
    } catch (error) {
        console.error("Error loading places for map:", error);
    }
}

function renderMapElements(data) {
    const sideList = document.getElementById('sidePlacesList');
    sideList.innerHTML = ""; 
    markerGroup.clearLayers(); 

    // முதலில் உங்கள் வீட்டை Map-ல் காட்டவும்
    const homeMarker = L.marker(myHomeCoords, { icon: homeIcon }).addTo(markerGroup);
    homeMarker.bindPopup("<b>My Home</b>");

    data.forEach(place => {
        const marker = L.marker([place.lat, place.lng], { icon: brownIcon });
        
        // Directions Link: உங்கள் வீட்டிலிருந்து அந்த இடத்திற்கு
        // renderMapElements-க்குள் இருக்கும் இந்த வரியை மட்டும் கவனமாக மாற்றவும்
const directionsURL = `https://www.google.com/maps/dir/?api=1&origin=${myHomeCoords[0]},${myHomeCoords[1]}&destination=${place.lat},${place.lng}&travelmode=driving`;

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
        
        markerGroup.addLayer(marker);

        // Sidebar Card Logic (பழையது போலவே)
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
            map.flyTo([place.lat, place.lng], 16, { animate: true, duration: 1.5 });
            marker.openPopup();
        };
        sideList.appendChild(card);
    });
}

function showSearchOnly() {
    document.querySelector(".map-sidebar")
        .classList.add("search-only");
}

function showFullList() {
    document.querySelector(".map-sidebar")
        .classList.remove("search-only");
}

// ================= SEARCH LOGIC =================
document.getElementById('mapSearch').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const filtered = allPlaces.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.category.toLowerCase().includes(term)
    );
    
    renderMapElements(filtered);
});

// Run app
fetchMapData();