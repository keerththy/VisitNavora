// ================= LOGIN =================
const form = document.getElementById("loginForm");

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorBox = document.getElementById("errorMsg");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // 🔥 clear old message
    errorBox.innerText = "";

    // 🔒 VALIDATION
    if (!username || !password) {
        errorBox.innerText = "Enter username & password!";
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        // 🔥 handle non-json safely
        let data;
        try {
            data = await res.json();
        } catch {
            throw new Error("Invalid server response");
        }

        if (res.ok) {
            // ✅ SAVE LOGIN
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("user", JSON.stringify(data.user));

            // பயனர் லொகின் வெற்றியடைந்த பிறகு (Success Response)
          localStorage.setItem("adminUsername", usernameInput.value);
          window.location.href = "admin.html";

            // 🔁 redirect
            window.location.href = "admin.html";

        } else {
            errorBox.innerText = data.message || "Login failed!";
        }

    } catch (err) {
        console.error("Login error:", err);

        // 🔥 better error messages
        if (err.message.includes("Failed to fetch")) {
            errorBox.innerText = "⚠️ Server not running!";
        } else {
            errorBox.innerText = "⚠️ Something went wrong!";
        }
    }
});


// ================= BACK BUTTON =================
function goBack() {
    const lastPage = localStorage.getItem("lastPage");

    if (lastPage) {
        window.location.href = lastPage;
    } else {
        window.location.href = "HomePage.html";
    }
}