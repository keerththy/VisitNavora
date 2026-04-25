// ================= IMPORTS =================
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

// ================= APP SETUP =================
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve images from frontend folder
app.use("/images", express.static(path.join(__dirname, "../frontend/images")));

// ================= DATABASE =================
const db = new sqlite3.Database(
  path.join(__dirname, "places.db")
);

// ================= TABLES =================
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

  // USERS 🔐
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT,
      password TEXT
    )
  `);
});


// ================= GET ALL PLACES =================
app.get("/places", (req, res) => {
  db.all("SELECT * FROM places", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});


// ================= GET SINGLE PLACE =================
app.get("/places/:id", (req, res) => {
  const placeId = req.params.id;

  db.get(
    "SELECT * FROM places WHERE id = ?",
    [placeId],
    (err, place) => {
      if (err) return res.status(500).json(err);

      if (!place) {
        return res.status(404).json({ message: "Place not found" });
      }

      db.all(
        "SELECT image FROM place_images WHERE place_id = ?",
        [placeId],
        (err, images) => {
          if (err) return res.status(500).json(err);

          place.images = images.map(img => img.image);
          res.json(place);
        }
      );
    }
  );
});


// ================= GET PLACE IMAGES =================
app.get("/place-images/:id", (req, res) => {
  const id = req.params.id;

  db.all(
    "SELECT image FROM place_images WHERE place_id = ?",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      // ✅ FIX PATH
      const fixed = rows.map(r => ({
        image: "/images/" + r.image.replace("images/", "")
      }));

      res.json(fixed);
    }
  );
});


// ================= SIGNUP (VALIDATION + HASH) =================
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    // 1. Mandatory Fields Check
    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required!" });
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

                db.run(
                    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                    [username, email, hashedPassword],
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

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) return res.status(500).json(err);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      try {
        const match = await bcrypt.compare(password, user.password);

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


// ================= ADD NEW PLACE =================
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
            res.json({ message: "Place added successfully!" });
        }
    );
});

// ================= UPDATE PLACE =================
// ================= UPDATE PLACE =================
app.put("/places/:id", (req, res) => {
    const placeId = req.params.id; // இங்கே 'church' என்பது சரியாக வருகிறதா என்று பாருங்கள்
    const { name, category, image, description, suitable, bestTime, duration, priority, lat, lng } = req.body;

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
        
        
        if (this.changes === 0) {
            return res.status(404).json({ message: "Place not found in database" });
        }

        res.json({ message: "Place updated successfully!" });
    });
});

// ================= DELETE PLACE =================
app.delete("/places/:id", (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM places WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Delete failed" });
        res.json({ message: "Deleted successfully" });
    });
});


// ================= START SERVER =================
app.listen(3000, () => {
  console.log(" Server running on http://localhost:3000");
});