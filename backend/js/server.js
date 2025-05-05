const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require("uuid");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// Generate a random secret key for JWT signing
const JWT_SECRET = crypto.randomBytes(32).toString('base64');

const saltRounds = 10;
const twelveHoursInMs = 12 * 60 * 60 * 1000;
const URL = "http://127.0.0.1:5500" // Replace with your frontend's URL
const PORT = 8000
var app = express()
app.use(cors({
    origin: [URL, "https://localhost:8000"], // Replace with your frontend's origin
    credentials: true
}));
app.use(express.json())


const sql = require('sqlite3').verbose()
const dbSource = "../finalProject.db"

const db = new sql.Database(dbSource, (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    }
    // console.log('Connected to the finalProject database.');

});


app.get("/", (req, res) => {
    //console.log("home") //debugging
});

/***********************LOGIN***********************/
// Validation of login credentials
app.post("/Login", (req, res) => {
    //console.log("login validation endpoint hit");

    if (!req.body || !req.body.Username || !req.body.Password) {
        return res.status(400).send("Username and password are required.");
    }

    const strUsername = req.body.Username.trim();
    const strPassword = req.body.Password;

    const validateQuery = `SELECT * FROM tblUsers WHERE strUsername = ?`; // Column: strUsername
    db.get(validateQuery, [strUsername], (err, row) => {
        if (err) {
            console.error('Error querying database: ' + err.message);
            return res.status(500).send("Internal server error.");
        }

        if (!row) {
            // console.log("Login failed for user:", strUsername);
            return res.status(401).send("No user found.");
        }

        const storedHashedPassword = row.strPassword;

        bcrypt.compare(strPassword, storedHashedPassword, (err, result) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).send("Internal server error.");
            }
            if (result) {
                console.log('Password is correct');

                const userID = row.UserID;

                // Generate a JWT
                const sessionID = uuidv4();
                const startTime = Date.now();
                const token = jwt.sign({ userID, sessionID }, JWT_SECRET, { expiresIn: '12h' });

                // successfully:", token);

                // Create a new session
                const insertSessionQuery = `INSERT INTO tblSessions (SessionID, UserID, start) VALUES (?, ?, ?)`; // Columns: SessionID, UserID, start
                db.run(insertSessionQuery, [sessionID, userID, startTime], function (err) {
                    if (err) {
                        console.error('Error creating session:', err.message);
                        return res.status(500).send("Internal server error.");
                    }
                    //console.log("Session created successfully with ID:", sessionID);

                    // Return the token and session ID
                    return res.status(200).json({ token, sessionID });
                });
            } else {
                // console.log("Invalid password for user:", strUsername);
                res.status(401).json({ error: 'Incorrect password' });
            }
        });
    });
});

// Route to check session validity and log out if expired
app.get("/Login", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        // console.log("No Authorization header found.");
        return res.status(401).send("No session found.");
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("JWT verification failed:", err.message);
            return res.status(401).send("Invalid or expired token.");
        }

        const sessionID = decoded.sessionID;
        const validateQuery = `SELECT * FROM tblSessions WHERE SessionID = ?`; // Column: SessionID
        db.get(validateQuery, [sessionID], (err, row) => {
            if (err) {
                console.error("Error querying session:", err.message);
                return res.status(500).send("Internal server error.");
            }

            if (!row) {
                //console.log("Session not found for ID:", sessionID);
                return res.status(401).send("Session not found.");
            }

            const currentTime = Date.now();
            if (row.End !== null || currentTime - row.start > twelveHoursInMs) {
                const endTime = currentTime;
                const updateEndQuery = `UPDATE tblSessions SET End = ? WHERE SessionID = ?`; // Columns: End, SessionID
                db.run(updateEndQuery, [endTime, sessionID], (updateErr) => {
                    if (updateErr) {
                        console.error("Error updating session end time:", updateErr.message);
                    }
                });
                //console.log("Session expired for ID:", sessionID);
                return res.status(401).send("Session expired.");
            }

            //    console.log("Session is valid for user:", decoded.userID);
            res.status(200).send("Session is valid.");
        });
    });
});

// Route to validate JWT and session
app.get("/ValidateToken", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send("Authorization header is required.");
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("JWT verification failed:", err.message);
            return res.status(401).send("Invalid or expired token.");
        }

        const sessionID = decoded.sessionID;
        const validateQuery = `SELECT * FROM tblSessions WHERE SessionID = ?`; // Column: SessionID
        db.get(validateQuery, [sessionID], (err, row) => {
            if (err) {
                console.error("Error querying session:", err.message);
                return res.status(500).send("Internal server error.");
            }

            if (!row) {
                return res.status(401).send("Session not found.");
            }

            const currentTime = Date.now();
            if (row.End !== null || currentTime - row.start > twelveHoursInMs) {
                const endTime = currentTime;
                const updateEndQuery = `UPDATE tblSessions SET End = ? WHERE SessionID = ?`; // Columns: End, SessionID
                db.run(updateEndQuery, [endTime, sessionID], (updateErr) => {
                    if (updateErr) {
                        console.error("Error updating session end time:", updateErr.message);
                    }
                });
                return res.status(401).send("Session expired.");
            }

            res.status(200).json({ message: "Token and session are valid.", userID: decoded.userID });
        });
    });
});
/***********************USERS***********************/
// register a new user
app.post("/Users", (req, res) => {
    // console.log("register endpoint hit"); // debugging

    if (!req.body || !req.body.Email || !req.body.Password || !req.body.FirstName || !req.body.LastName) {
        return res.status(400).send("Request body is required.");
    }
    //console.log("Request body:", req.body);
    const keyUserID = uuidv4() // generates a unique user ID
    const strEmail = req.body.Email; // is the users email address
    const strPassword = req.body.Password;
    const strTeams = req.body.Teams
    const intPhoneNumber = req.body.PhoneNumber;
    const strDiscord = req.body.Discord;
    const strFirstName = req.body.FirstName;
    const strMiddleName = req.body.MiddleName;
    const strLastName = req.body.LastName;
    const strFullName = strFirstName + " " + strMiddleName + " " + strLastName
    // validate req then hash the password before storing it
    if (!strEmail || !strPassword || !strFirstName || !strLastName) {
        return res.status(400).send("Email, password, first name, and last name are required.");
    }

    bcrypt.hash(strPassword, saltRounds, (err, hash) => {
        if (err) throw err;

        if (hash) {
            // Insert the new user into the database
            const insertQuery = `INSERT INTO tblUsers (UserID, strUsername, strPassword, strTeams, strPhone, strDiscord, strName) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            // Columns: UserID, strUsername, strPassword, strTeams, strPhone, strDiscord, strName
            db.run(insertQuery, [keyUserID, strEmail, hash, strTeams, intPhoneNumber, strDiscord, strFullName], function (err) {
                if (err) {
                    console.error('Error inserting user: ' + err.message);
                    return res.status(500).send("Internal server error.");
                }
                //console.log("User registered successfully with ID:", keyUserID);
                res.status(201).json({ message: "User registered successfully." });

            });

        }
    });
});



// Update user Settings information
app.put("/Users", (req, res) => {
    //console.log("update user settings endpoint hit");
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send("Authorization header is required.");
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("JWT verification failed:", err.message);
            return res.status(401).send("Invalid or expired token.");
        }

        // Ensure at least one field is provided
        if (!req.body.Name && !req.body.Email && !req.body.Teams && !req.body.Discord && !req.body.PhoneNumber) {
            return res.status(400).send("At least one field is required to update.");
        }
        const userID = decoded.userID;

        // Filter out only the fields that are not null or empty
        const updatedData = {};
        if (req.body.Name) updatedData.strName = req.body.Name;
        if (req.body.Email) updatedData.strUsername = req.body.Email;
        if (req.body.Teams) updatedData.strTeams = req.body.Teams;
        if (req.body.Discord) updatedData.strDiscord = req.body.Discord;
        if (req.body.PhoneNumber) updatedData.strPhone = req.body.PhoneNumber;

        if (Object.keys(updatedData).length === 0) {
            return res.status(400).send("No valid fields to update.");
        }

        // Dynamically build the update query based on the fields to update
        const fields = Object.keys(updatedData).map(key => `${key} = ?`).join(", ");
        const values = Object.values(updatedData);
        values.push(userID); // Add userID to the end for the WHERE clause

        const updateQuery = `UPDATE tblUsers SET ${fields} WHERE UserID = ?`; // Column: UserID
        db.run(updateQuery, values, function (err) {
            if (err) {
                console.error('Error updating user:', err.message);
                return res.status(500).send("Internal server error.");
            }
            console.log("User settings updated successfully.");
            res.status(200).json({ message: "User settings updated successfully." });
        });
    });
});

// Retrieve user settings based on UserID
app.get("/Users", (req, res) => {
    // console.log("user settings endpoint hit");

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send("Authorization header is required.");
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("JWT verification failed:", err.message);
            return res.status(401).send("Invalid or expired token.");
        }

        const userID = decoded.userID;

        // Retrieve user settings based on UserID
        const getUserSettingsQuery = `SELECT * FROM tblUsers WHERE UserID = ?`; // Column: UserID
        db.get(getUserSettingsQuery, [userID], (err, userRow) => {
            if (err) {
                console.error('Error retrieving user settings:', err.message);
                return res.status(500).send("Internal server error.");
            }
            if (!userRow) {
                return res.status(404).send("User not found.");
            }

            // Send the user settings as a response
            res.status(200).json(userRow);
        });
    });
});

function autoLogoutExpiredSessions() {
    const checkSessionsQuery = `SELECT * FROM tblSessions WHERE End IS NULL`; // Columns: End
    db.all(checkSessionsQuery, [], (err, rows) => {
        if (err) {
            console.error('Error querying sessions:', err.message);
            return;
        }

        const currentTime = Date.now();
        if (rows.length === 0) {
            // console.log("No active sessions found.");
            return;
        }

        rows.forEach((session) => {
            if (currentTime - session.start > twelveHoursInMs) {
                const endTime = currentTime;
                //console.log(`Session ${session.SessionID} has expired. Logging out...`);
                const updateEndQuery = `UPDATE tblSessions SET End = ? WHERE SessionID = ?`; // Columns: End, SessionID
                db.run(updateEndQuery, [endTime, session.SessionID], (updateErr) => {
                    if (updateErr) {
                        console.error(`Error updating session ${session.SessionID} end time:`, updateErr.message);
                    } else {
                        console.log(`Session ${session.SessionID} has been automatically logged out.`);
                    }
                });
            } else {
                //console.log(`Session ${session.SessionID} is still active.`);
            }
        });
    });
}

// Run the autoLogoutExpiredSessions function every 5 minutes
setInterval(autoLogoutExpiredSessions, 5 * 60 * 1000);
autoLogoutExpiredSessions()

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});