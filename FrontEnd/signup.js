document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("new-username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("new-password").value.trim();
    const errorBox = document.getElementById("signupErrorMsg");

    // Clear old messages
    errorBox.innerText = "";
    errorBox.style.color = "#ff4d4d"; // Red color for errors

    // 1. BLANK FIELD CHECK (Empty-ah iruntha)
    if (!username) {
        errorBox.innerText = "Please fill in the Username!";
        return;
    }
    if (!email) {
        errorBox.innerText = "Please fill in the Email!";
        return;
    }
    if (!password) {
        errorBox.innerText = "Please fill in the Password!";
        return;
    }

    // 2. EMAIL VALIDATION (Email format sariya nu check panna)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorBox.innerText = "Invalid email format! (e.g. user@gmail.com)";
        return;
    }

    // 3. PASSWORD LENGTH CHECK
    if (password.length < 8) {
        errorBox.innerText = "Password must be at least 8 characters long!";
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // Success
            errorBox.style.color = "#28a745"; // Green color
            errorBox.innerText = "✅ Signup successful! Redirecting...";
            
           
            window.location.replace("login.html");
           


        } else {
            // Server side errors (User already exists, etc.)
            errorBox.innerText = data.message || "Signup failed!";
        }

    } catch (err) {
        console.error(err);
        if (err.message.includes("Failed to fetch")) {
            errorBox.innerText = "⚠️ Server is not running!";
        } else {
            errorBox.innerText = "⚠️ Something went wrong!";
        }
    }
});

function goBack() {
    window.history.back();
}