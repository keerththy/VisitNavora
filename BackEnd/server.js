// ================= IMPORTS =================
const express = require("express"); //Framework to create the server and handle routes
const sqlite3 = require("sqlite3").verbose();// connect and use the database
const cors = require("cors"); // Allows frontend to talk to backend 
const path = require("path"); // Helps build file/folder paths correctly
const bcrypt = require("bcrypt"); // Used to hash passwords 

const SALT_ROUNDS = 10;// 

// ================= APP SETUP =================
const app = express(); // Creates the server app
app.use(cors()); //Allows frontend to call this server 
app.use(express.json()); // Allows server to read JSON data sent from frontend

//  Serve images from frontend folder
// Makes the images folder publicly accessible via
app.use("/images", express.static(path.join(__dirname, "../frontend/images")));

// ================= DATABASE =================

// Connects to the SQLite database file places.db
const db = new sqlite3.Database(
  path.join(__dirname, "places.db")
);

// ================= TABLES =================

// create table
// Runs all table creation one by one in order
db.serialize(() => {

  // PLACES
  db.run(`
    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      description TEXT,
      suitable TEXT,
      bestTime TEXT,
      duration INTEGER,
      priority INTEGER,
      lat REAL,
      lng REAL,
      image TEXT
    )
  `);

  // PLACE IMAGES
  db.run(`
    CREATE TABLE IF NOT EXISTS place_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT,
      image TEXT
    )
  `);

  // USERS 🔐 (Updated with securityAnswer column tracking matrix mapping system)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT,
      password TEXT,
      securityAnswer TEXT
    )
  `);
});


// ================= GET ALL PLACES =================

// When frontend calls /places  fetch all places from database
app.get("/places", (req, res) => {
  db.all("SELECT * FROM places", [], (err, rows) => {
    if (err) return res.status(500).json(err); // If error  send error response
    res.json(rows); // Sends all places back to frontend as JSON
  });
});


// ================= GET SINGLE PLACE =================

//Gets the id from the URL
app.get("/places/:id", (req, res) => {
  const placeId = req.params.id; //Reads that id value

 // Gets one matching place
  db.get(
    "SELECT * FROM places WHERE id = ?",
    [placeId],
    (err, place) => {
      if (err) return res.status(500).json(err);

      //If not found sends 404 not found
      if (!place) {
        return res.status(404).json({ message: "Place not found" });
      }

      //Then gets all images for that place from place_images table
      db.all(
        "SELECT image FROM place_images WHERE place_id = ?",
        [placeId],
        (err, images) => {
          if (err) return res.status(500).json(err);

          //Converts image rows into a simple array
          place.images = images.map(img => img.image);
          res.json(place); // Sends place and images together to frontend
        }
      );
    }
  );
});


// ================= GET PLACE IMAGES =================
//Gets all images for a specific place
app.get("/place-images/:id", (req, res) => {
  const id = req.params.id;

  db.all(
    "SELECT image FROM place_images WHERE place_id = ?",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      //  FIX PATH
      const fixed = rows.map(r => ({
        image: "/images/" + r.image.replace("images/", "")
      }));

      res.json(fixed);
    }
  );
});


// ================= SIGNUP (VALIDATION + HASH) =================
app.post("/signup", async (req, res) => {
    // Gets all signup fields sent from frontend
    const { username, email, password, securityAnswer } = req.body;

    // 1. Mandatory Fields Check
    if (!username || !email || !password || !securityAnswer) {
        return res.status(400).json({ message: "All fields including recovery answer are required!" });
    }

    // 2. Email Format Check (Server Side)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format!" });
    }

    // 3. Password Length Check (Server Side)
    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters!" });
    }

    try {
        // Check if user or email already exists
        //Sends specific error for which one is duplicate
        db.get(
            "SELECT * FROM users WHERE username = ? OR email = ?",
            [username, email],
            async (err, existingUser) => {
                if (err) return res.status(500).json({ message: "Database error" });

                if (existingUser) {
                    // Check specific existing field
                    if (existingUser.username === username) {
                        return res.status(400).json({ message: "Username already taken!" });
                    } else {
                        return res.status(400).json({ message: "Email already registered!" });
                    }
                }

                // Hash Password
                const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
                
                // Store answer safely into lowercase 
                const safeAnswer = securityAnswer.trim().toLowerCase();

                //Inserts all data into users table
                db.run(
                    "INSERT INTO users (username, email, password, securityAnswer) VALUES (?, ?, ?, ?)",
                    [username, email, hashedPassword, safeAnswer],
                    function (err) {
                        if (err) return res.status(500).json({ message: "Signup failed!" });
                        res.json({ message: "Signup successful!" });
                    }
                );
            }
        );
    } catch (err) {
        res.status(500).json({ message: "Error processing signup" });
    }
});

// ================= LOGIN (COMPARE HASH) =================
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  //Searches database for that username 
  // If not found give 401 unauthorized error
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) return res.status(500).json(err);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      try {
        //  Compares typed password with hashed password in DB
        const match = await bcrypt.compare(password, user.password);

        //If match login success, send user data back
        // If no match  Invalid password error

        if (!match) {
          return res.status(401).json({ message: "Invalid password" });
        }

        res.json({ message: "Login success", user });

      } catch (err) {
        res.status(500).json({ message: "Error comparing password" });
      }
    }
  );
});


// ================= 🔐 PASSWORD RECOVERY ENDPOINT =================
app.post("/recover-password", (req, res) => {
  // Gets username and security answer from frontend
    const { username, securityAnswer } = req.body;

    if (!username || !securityAnswer) {
        return res.status(400).json({ message: "Username and Answer are required!" });
    }

    const safeAnswer = securityAnswer.trim().toLowerCase();

   

    db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        (err, user) => {
            if (err) return res.status(500).json({ message: "Database query error" });

            if (!user) {
                return res.status(404).json({ message: "User not found!" });
            }

            //Finds user in DB  compares the security answer
            if (user.securityAnswer === safeAnswer) {
                return res.status(200).json({ message: "Verification successful!" });
            } else {
                return res.status(400).json({ message: "Secret Answer is incorrect!" });
            }
        }
    );
});


// =================  PASSWORD RESET UPDATE =================
app.post("/reset-password", async (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
        return res.status(400).json({ message: "Username and New Password are required!" });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters!" });
    }

    try {
        // Hashing the new password layer before updating SQLite target parameters
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        db.run(
          // Replaces old password in database
            "UPDATE users SET password = ? WHERE username = ?",
            [hashedPassword, username],
            function (err) {
                if (err) return res.status(500).json({ message: "Database update error" });
                // If no rows updated user not found
                if (this.changes === 0) {
                    return res.status(404).json({ message: "User not found!" });
                }

                res.json({ message: "Password updated successfully! ✅" });
            }
        );
    } catch (err) {
        res.status(500).json({ message: "Error processing password reset" });
    }
});


// ================= ADD NEW PLACE =================
// Gets all place details from frontend
app.post("/places", (req, res) => {
    const {
        id,
        name,
        category,
        image,
        description,
        suitable,
        bestTime,
        duration,
        priority,
        lat,
        lng
    } = req.body;

    // Inserts new place into database

    const query = `
      INSERT INTO places 
      (id, name, category, image, description, suitable, bestTime, duration, priority, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query,
        [id, name, category, image, description, suitable, bestTime, duration, priority, lat, lng],
        (err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Error adding place" });
            }
            // Sends success message back
            res.json({ message: "Place added successfully!" });
        }
    );
});


// ================= UPDATE PLACE =================
//Gets place id from URL
app.put("/places/:id", (req, res) => {
    const placeId = req.params.id; 
    const { name, category, image, description, suitable, bestTime, duration, priority, lat, lng } = req.body;

    // Updates all fields of that place in database
    const query = `
        UPDATE places 
        SET name = ?, category = ?, image = ?, description = ?, suitable = ?, bestTime = ?, duration = ?, priority = ?, lat = ?, lng = ?
        WHERE id = ?
    `;

    db.run(query, [name, category, image, description, suitable, bestTime, duration, priority, lat, lng, placeId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Update failed" });
        }
        
        // If nothing updated place doesn't exist
        if (this.changes === 0) {
            return res.status(404).json({ message: "Place not found in database" });
        }

        res.json({ message: "Place updated successfully!" });
    });
});

// ================= DELETE PLACE =================
//Gets id from URL
app.delete("/places/:id", (req, res) => {
    const id = req.params.id;
    // Deletes that place from database
    db.run("DELETE FROM places WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Delete failed" });
        res.json({ message: "Deleted successfully" });// Sends success message
    });
});


// ================= START SERVER =================
//Starts the server on port 3000
app.listen(3000, () => {
  //Prints message in terminal to confirm server is running
  console.log(" Server running on http://localhost:3000");
});