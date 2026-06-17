let editMode = false;
let editId = null;
let currentFormStep = 1; // 💡 Dynamic Stepper State Manager

// 🔐 BLOCK UNAUTHORIZED ACCESS (ACCURATE REFERRER TRACKING)
if (localStorage.getItem("isLoggedIn") !== "true") {
    // Dashboard access panna muyarsikkum munnadi user entha page-il irundhaaro athai track seiyum engine
    let referrerPage = document.referrer; 
    
    if (!referrerPage || referrerPage.includes("admin.html") || referrerPage.includes("login.html")) {
        referrerPage = "HomePage.html"; // Default fallback boundary
    } else {
        // Absolute URL-il irundhu file name-ai mattum pirithu yedukkum split logic
        referrerPage = referrerPage.substring(referrerPage.lastIndexOf("/") + 1);
    }

    localStorage.setItem("lastPage", referrerPage);
    window.location.href = "login.html";
}

// Global DOM Selectors
const list = document.getElementById("adminList");
const modal = document.getElementById("placeModal");
const placeForm = document.getElementById("placeForm");

// ==========================================================================
// 1. MULTI-STEP CUTE VISUAL ENGINE WIZARD
// ==========================================================================
function goToStep(stepTarget) {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const dot1 = document.getElementById('dot1');
    const dot2 = document.getElementById('dot2');
    const stepLine = document.getElementById('stepLine');

    //  Step 1-il required fields fill pannaamal Step 2-vukku sella thadaikkum interceptor
    if (stepTarget === 2) {
        const pName = document.getElementById('pName');
        const pCategory = document.getElementById('pCategory');
        const pImage = document.getElementById('pImage');
        const pDesc = document.getElementById('pDesc');

        if (!pName.checkValidity() || !pCategory.checkValidity() || !pImage.checkValidity() || !pDesc.checkValidity()) {
            pName.reportValidity() || pCategory.reportValidity() || pImage.reportValidity() || pDesc.reportValidity();
            return;
        }
    }

    currentFormStep = stepTarget;

    if (currentFormStep === 1) {
        step1.classList.add('active');
        step2.classList.remove('active');
        dot2.classList.remove('active');
        stepLine.classList.remove('active');
    } else {
        step1.classList.remove('active');
        step2.classList.add('active');
        dot2.classList.add('active');
        stepLine.classList.add('active');
    }
}

// ==========================================================================
// 2. LOAD PLACES SYSTEM FROM DATABASE
// ==========================================================================
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

// ==========================================================================
// 3. INITIALIZATION ON DOM LOADED
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const loggedInUser = localStorage.getItem("adminUsername"); 
    const welcomeHeading = document.getElementById("welcomeText");

    if (welcomeHeading) {
        if (loggedInUser && loggedInUser !== "undefined") {
            welcomeHeading.innerText = `Welcome back, ${loggedInUser} 👋`;
        } else {
            welcomeHeading.innerText = `Welcome back, Admin 👋`;
        }
    }

    loadPlaces();

    // Add button handler configuration
    const addBtn = document.querySelector(".add-btn");
    if (addBtn) {
        addBtn.onclick = function() {
            editMode = false;
            editId = null;
            document.getElementById("modalTitle").innerText = "Add New Place";
            
            const submitBtn = document.getElementById("submitFormBtn");
            if (submitBtn) submitBtn.innerText = "Save Place";
            
            goToStep(1); // Enforce Step 1 sequence initially
            modal.classList.add("show"); 
        };
    }
});

// ==========================================================================
// 4. SANITIZE & CLOSE MODAL INTERFACE Completely
// ==========================================================================
function closeModal() {
    modal.classList.remove("show");
    placeForm.reset();
    document.getElementById("pName").disabled = false;

    editMode = false;
    editId = null;

    // Reset components seamlessly back to base state
    currentFormStep = 1;
    document.getElementById('step1').classList.add('active');
    document.getElementById('step2').classList.remove('active');
    document.getElementById('dot2').classList.remove('active');
    document.getElementById('stepLine').classList.remove('active');
}

// Close via screen boundaries backdrop triggers
window.onclick = function(event) {
    if (event.target === modal) {
        closeModal();
    }
};

// ==========================================================================
// 5. ASYNC DATABASE CONTROLLER ENGINE (SAVE / UPDATE HANDLER)
// ==========================================================================
placeForm.onsubmit = async function(e) {
    e.preventDefault();
    console.log("Form Submission Started...");

    const pNameValue = document.getElementById("pName").value;
    // collect all field values build a place object. ID is auto generated from name
    const newPlace = {
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

    let url = "http://localhost:3000/places";
    let method = "POST";

    if (editMode && editId) {
        url = `http://localhost:3000/places/${editId}`;
        method = "PUT";
    }

    console.log("Sending Request:", method, url); 
    console.log("Payload:", newPlace);

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPlace)
        });

        if (res.ok) {
            alert(editMode ? "Updated Successfully! ✅" : "Added Successfully! ✅");
            closeModal();
            loadPlaces(); 
        } else {
            const errorText = await res.text();
            console.error("Server Response Error:", errorText);
            alert(`Error: ${res.status} - ${res.statusText}`);
        }
    } catch (err) {
        console.error("Network/Fetch Error:", err);
        alert("Server couldn't connect! (Check Console)");
    }
};

// ==========================================================================
// 6. EDIT PLACE METRICS INITIALIZER
// ==========================================================================
function editPlace(p) {
    editMode = true;
    editId = p.id;

    document.getElementById("modalTitle").innerText = "Edit Place";
    
    const submitBtn = document.getElementById("submitFormBtn");
    if (submitBtn) submitBtn.innerText = "Update Place"; // Dynamic injection handler
    
    // Auto populate existing metrics trace arrays
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

    goToStep(1); // Enforce Step 1 sequence inside edit sequence safely initially
    modal.classList.add("show");
}

// ==========================================================================
// 7. RECORD DELETION PIPELINES
// ==========================================================================
async function deletePlace(id) {
    if (!confirm("Delete this place?")) return;

    try {
        const res = await fetch(`http://localhost:3000/places/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            alert("Deleted! 🗑️");
            loadPlaces();
        }
    } catch (err) {
        console.error("Delete sequence breakdown error:", err);
    }
}

// ==========================================================================
// 8. SESSION TERMINATOR (LOGOUT)
// ==========================================================================
function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("adminUsername");
    window.location.href = "login.html";
}