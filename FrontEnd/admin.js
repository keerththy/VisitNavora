let editMode = false;
let editId = null;

// 🔐 BLOCK UNAUTHORIZED ACCESS
if (localStorage.getItem("isLoggedIn") !== "true") {
    localStorage.setItem("lastPage", "admin.html");
    window.location.href = "login.html";
}

// Variables
const list = document.getElementById("adminList");
const modal = document.getElementById("placeModal");
const placeForm = document.getElementById("placeForm");

// 1. Load Places
async function loadPlaces() {
    try {
        const res = await fetch("http://localhost:3000/places");
        const data = await res.json();

        list.innerHTML = "";

        data.forEach(p => {
         list.innerHTML += `
         <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td class="action-cell">
                <button onclick='editPlace(${JSON.stringify(p)})' class="edit-btn">
                    <i class="fa fa-edit"></i>
                </button>

                <button onclick="deletePlace('${p.id}')" class="delete-btn">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
         </tr>
       `;
    });
    } catch (err) {
        console.error("Data load error:", err);
    }
}

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
    const loggedInUser = localStorage.getItem("adminUsername"); 
    const welcomeHeading = document.getElementById("welcomeText");

    if (welcomeHeading) {
        // பெயர் இருந்தால் அதைக் காட்டு, இல்லையென்றால் வெறும் 'Admin' எனக் காட்டு
        if (loggedInUser && loggedInUser !== "undefined") {
            welcomeHeading.innerText = `Welcome back, ${loggedInUser} 👋`;
        } else {
            welcomeHeading.innerText = `Welcome back, Admin 👋`;
        }
    }

    loadPlaces();

    const addBtn = document.querySelector(".add-btn");

    if (addBtn) {
        addBtn.onclick = function() {
            modal.classList.add("show"); // ✅ FIX
        };
    }
});

// CLOSE MODAL
function closeModal() {
    modal.classList.remove("show");
    placeForm.reset();
    document.getElementById("pName").disabled = false;

    editMode = false;
    editId = null;
}
// Outside click close
window.onclick = function(event) {
    if (event.target === modal) {
        closeModal();
    }
};


// SAVE PLACE - Updated with Event Listener
placeForm.onsubmit = async function(e) {
    e.preventDefault();
    console.log("Form Submission Started...");

    // 1. தரவுகளைச் சேகரித்தல்
    const pNameValue = document.getElementById("pName").value;
    
    const newPlace = {
        // Edit mode-ல் இருந்தால் editId-யை அப்படியே பயன்படுத்த வேண்டும்
        id: editMode ? editId : pNameValue.toLowerCase().replace(/\s+/g, '-'),
        name: pNameValue,
        category: document.getElementById("pCategory").value,
        description: document.getElementById("pDesc").value,
        suitable: document.getElementById("pSuitable").value, 
        bestTime: document.getElementById("pBestTime").value, 
        duration: parseInt(document.getElementById("pDuration").value) || 0, 
        priority: parseInt(document.getElementById("pPriority").value) || 0, 
        lat: parseFloat(document.getElementById("pLat").value) || 0,
        lng: parseFloat(document.getElementById("pLng").value) || 0,
        image: document.getElementById("pImage").value
    };

    // 2. URL மற்றும் Method தீர்மானித்தல்
    let url = "http://localhost:3000/places";
    let method = "POST";

    if (editMode && editId) {
        url = `http://localhost:3000/places/${editId}`;
        method = "PUT";
    }

    console.log("Sending Request:", method, url); // இது Console-ல் சரியாக வருகிறதா எனப் பாருங்கள்
    console.log("Payload:", newPlace);

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPlace)
        });

        // 3. Response-ஐக் கையாளுதல்
        if (res.ok) {
            const result = await res.json();
            alert(editMode ? "Updated Successfully! ✅" : "Added Successfully! ✅");
            closeModal();
            loadPlaces(); 
        } else {
            // Server Error மெசேஜைப் பிடித்தல்
            const errorText = await res.text();
            console.error("Server Response Error:", errorText);
            alert(`Error: ${res.status} - ${res.statusText}`);
        }
    } catch (err) {
        console.error("Network/Fetch Error:", err);
        alert("Server உடன் இணைக்க முடியவில்லை! (Check Console)");
    }
};

function editPlace(p) {
    editMode = true;
    editId = p.id;

    document.getElementById("modalTitle").innerText = "Edit Place";
    
    // தரவுகளை input fields-ல் நிரப்புதல்
    document.getElementById("pName").value = p.name || "";
    document.getElementById("pCategory").value = p.category || "";
    document.getElementById("pImage").value = p.image || "";
    document.getElementById("pDesc").value = p.description || "";
    document.getElementById("pSuitable").value = p.suitable || "";
    document.getElementById("pBestTime").value = p.bestTime || "";
    document.getElementById("pDuration").value = p.duration || 0;
    document.getElementById("pPriority").value = p.priority || 0;
    document.getElementById("pLat").value = p.lat || 0;
    document.getElementById("pLng").value = p.lng || 0;

    modal.classList.add("show");
}

async function deletePlace(id) {
    if (!confirm("Delete this place?")) return;

    const res = await fetch(`http://localhost:3000/places/${id}`, {
        method: "DELETE"
    });

    if (res.ok) {
        alert("Deleted!");
        loadPlaces();
    }
}

// LOGOUT
function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("adminUsername");
    window.location.href = "login.html";
}