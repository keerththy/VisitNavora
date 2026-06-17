// ================= LOGIN SYSTEM =================
//Gets the login form from HTML
const form = document.getElementById("loginForm");

form.addEventListener("submit", async function (e) {
    //Stops the page from refreshing 
    e.preventDefault();

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorBox = document.getElementById("errorMsg");

    //Removes extra spaces from start and end
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    errorBox.innerText = "";

    // validation check if empty username and pasword
    if (!username || !password) {
        errorBox.innerText = "Enter username & password!";
        return; // stop function
    }

    try {
        const res = await fetch("http://localhost:3000/login", {
            //Sends username and  password to the server using POST request
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })// Converts JS object into JSON text to send
        });

        let data;
        try {
            data = await res.json();
        } catch {
            throw new Error("Invalid server response");
        }

        // If server says login success
        if (res.ok) {
            //Saves login info in localStorage
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("adminUsername", usernameInput.value);
            localStorage.removeItem("lastPage");
            window.location.href = "admin.html";//Redirects to admin page
        } else {
            errorBox.innerText = data.message || "Login failed!";
        }

    } catch (err) {
        //If server is offline or crashed  shows warning message
        console.error("Login error:", err);
        if (err.message && err.message.includes("Failed to fetch")) {
            errorBox.innerText = "⚠️ Server not running!";
        } else {
            errorBox.innerText = "⚠️ Something went wrong!";
        }
    }
});

// ================= BACK NAVIGATION BUTTON =================
function goBack() {
    //ckeck localStorage for the last visited page
    const lastPage = localStorage.getItem("lastPage");
    //If last page was not admin/login goes back to that page
    if (lastPage && lastPage !== "admin.html" && lastPage !== "login.html") {
        window.location.href = lastPage;
    } else {
        // goes to HomePage as default
        window.location.href = "HomePage.html";
    }
}

// ==========================================================================
// 🔐 PASSWORD RECOVERY & RESET INTERFACE CONTROL LOGIC
// ==========================================================================

function openRecoveryModal() {
    //Finds the recovery modal (popup box) in HTML
    const recModal = document.getElementById("recoveryModal");
    if (recModal) recModal.style.display = "flex";// change  display felx , make it visible 
}

function closeRecovery() {
    document.getElementById("recoveryModal").style.display = "none";//Hides the modal
    // Clears all input fields inside both forms
    document.getElementById("recoveryForm").reset();
    document.getElementById("resetForm").reset();
    document.getElementById("recoveryResult").innerText = "";
    
    // UI layout configuration structural reset sequence
    document.getElementById("recoveryForm").style.display = "block";// show recovery
    document.getElementById("resetForm").style.display = "none";// hide reset 
    document.getElementById("modalTitle").innerText = "Recover Password";// chenge title 
    document.getElementById("modalDesc").innerText = "Enter details to verify admin account";// change description
}

//Click Outside to Close
function closeRecoveryViaOverlay(event) {
    //makes sure clicking inside the modal doesn't close it
    if (event.target === document.getElementById("recoveryModal")) {
        closeRecovery();
    }
}

//  STEP 1: ADMIN SECRET ANSWER VERIFICATION HANDLER
async function handleRecovery(e) {
    // Stops page from refreshing when form is submitted
    e.preventDefault();

    // Gets what user typed in username field and secret answer field
    const username = document.getElementById("recUsername").value.trim();
    const securityAnswer = document.getElementById("recAnswer").value.trim();
    // Gets the error/success message box element
    const resultBox = document.getElementById("recoveryResult");

    //Clears any old message 
    resultBox.innerText = "";

    // If any field is empty  show red error message

    if (!username || !securityAnswer) {
        
        resultBox.style.color = "#C0392B";
        resultBox.innerText = "Please fill in all fields! ";
        return; // stop the funtion , server request won't be sent
    }

    try {
        //Sends username and secret answer to server for checking
        const res = await fetch("http://localhost:3000/recover-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, securityAnswer })// Converts JS object to JSON text to send
        });

        //Waits for server to reply and converts reply to JS object
        const data = await res.json();

        //if is it correct answer
        if (res.ok) {
            resultBox.innerText = "";
            //hide recovery form (1st form)
            document.getElementById("recoveryForm").style.display = "none"; 
            document.getElementById("resetForm").style.display = "block";// show reset form (2nd form)
            //Changes modal title and description text
            document.getElementById("modalTitle").innerText = "Setup New Password";
            document.getElementById("modalDesc").innerText = "Create a strong password for your account";
        } else {
            //Use server's message, if no message use default tex
            resultBox.style.color = "#C0392B";
            resultBox.innerText = data.message || "Invalid Username or Answer! ";
        }
    } catch (err) {
        //If server is offline or internet problem show warning
        resultBox.style.color = "#C0392B";
        resultBox.innerText = "⚠️ Unable to connect to server!";
    }
}

// 💡 STEP 2: DYNAMIC DATABASE UPDATE PIPELINE
async function handlePasswordReset(e) {
    e.preventDefault();

    // get username password confirm password recovery result
    const username = document.getElementById("recUsername").value.trim(); 
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const resultBox = document.getElementById("recoveryResult");

    //If both passwords don't match  show error, stop function
    if (newPassword !== confirmPassword) {
        resultBox.style.color = "#C0392B";
        resultBox.innerText = "Passwords do not match! ❌";
        return;
    }

    //If password is less than 8 characters
    if (newPassword.length < 8) {
        resultBox.style.color = "#C0392B";
        resultBox.innerText = "Password must be at least 8 characters! ❌";
        return;
    }

    try {
        //Sends username and  new password to server to update in database
        const res = await fetch("http://localhost:3000/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, newPassword })
        });

        const data = await res.json();

        if (res.ok) {
            resultBox.style.color = "#27AE60";
            resultBox.innerText = "Password updated successfully! 🎉";
            
            setTimeout(() => {
                closeRecovery();
            }, 1500);// Wait 1.5 seconds, then close the modal automatically
        } else {
            // if faied to update show error message
            resultBox.style.color = "#C0392B";
            resultBox.innerText = data.message || "Reset failed!";
        }
    } catch (err) {
        // If server is offline show warning message
        resultBox.style.color = "#C0392B";
        resultBox.innerText = "⚠️ Error updating password!";
    }
}

//  EYE BUTTON  (SHOW/HIDE TOGGLE)
function togglePasswordVisibility(inputId, eyeIcon) {
    //Finds the password input field using the id
    const passwordInput = document.getElementById(inputId);

    //If password is hidden
    if (passwordInput.type === "password") {
        passwordInput.type = "text";// show password
        eyeIcon.classList.remove("fa-eye-slash"); // remove close eye
        eyeIcon.classList.add("fa-eye");// add open eye
    } else {
        //If password is visible
        passwordInput.type = "password"; // hide the password
        eyeIcon.classList.remove("fa-eye"); // change the open eye to close eye 
        eyeIcon.classList.add("fa-eye-slash");
    }
}