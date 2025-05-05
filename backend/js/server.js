const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require("uuid");
const cookieParser = require('cookie-parser');
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

app.use(cookieParser());

const sql = require('sqlite3').verbose()
const dbSource = "../finalProject.db"

const db = new sql.Database(dbSource, (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    }
       // console.log('Connected to the finalProject database.');
    
});

function validateSession(sessionID, callback) {
    const validateQuery = `SELECT * FROM tblSessions WHERE SessionID = ?`;
    db.get(validateQuery, [sessionID], (err, row) => {
        if (err) return callback(-1);
        if (!row) return callback(-3); // invalid session

        const dateCurrent = Date.now();
        
        if (row.End !== null) {
            //console.log("Session already ended for session ID:", sessionID);
            return callback(-4); // session already ended
        }
        if (dateCurrent - row.start > twelveHoursInMs) {
            // Update the end time when the session has expired
            const endTime = Date.now();
            const updateEndQuery = `UPDATE tblSessions SET end = ? WHERE SessionID = ?`;
            db.run(updateEndQuery, [endTime, sessionID], (updateErr) => {
                if (updateErr) {
                    console.error('Error updating session end time on expiration:', updateErr.message);
                }
            });

            return callback(-2); // expired
        }

        callback(1); // valid session
    });
}


app.get("/", (req, res) => {
    //console.log("home") //debugging
});

/***********************LOGIN***********************/
// Validation of login credentials
app.post("/Login", (req, res) => {
    console.log("login validation endpoint hit");

    if (!req.body || !req.body.Username || !req.body.Password) {
        return res.status(400).send("Username and password are required.");
    }

    const strUsername = req.body.Username.trim();
    const strPassword = req.body.Password;

    const validateQuery = `SELECT * FROM tblUsers WHERE strUsername = ?`;
    db.get(validateQuery, [strUsername], (err, row) => {
        if (err) {
            console.error('Error querying database: ' + err.message);
            return res.status(500).send("Internal server error.");
        }

        if (!row) {
            console.log("Login failed for user:", strUsername);
            return res.status(401).send("No user found.");
        }

        const storedHashedPassword = row.strPassword; // assuming column is named strPassword

        bcrypt.compare(strPassword, storedHashedPassword, (err, result) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).send("Internal server error.");
            }
            if (result) {
                console.log('Password is correct');

                // Inline session creation logic
                const userID = row.UserID;
                const checkSessionQuery = `SELECT * FROM tblSessions WHERE UserID = ? AND End IS NULL`;

                db.get(checkSessionQuery, [userID], (err, sessionRow) => {
                    if (err) {
                        console.error('Error querying sessions:', err.message);
                        return res.status(500).send("Internal server error.");
                    }

                    let sessionID;
                    if (sessionRow) {
                        console.log("Active session already exists for user ID:", userID);
                        sessionID = sessionRow.SessionID; // Use the existing active session ID
                    } else {
                        // Create a new session if none exists
                        sessionID = uuidv4();
                        const startTime = Date.now();
                        const queryInsertSession = `INSERT INTO tblSessions (SessionID, UserID, start) VALUES (?, ?, ?)`;
                        db.run(queryInsertSession, [sessionID, userID, startTime], function (err) {
                            if (err) {
                                console.error('Error inserting session:', err.message);
                                return res.status(500).send("Internal server error.");
                            }
                            console.log("New session created with ID:", sessionID);
                        });
                    }

                    // Send the session ID as a cookie
                    res.cookie('SessionID', sessionID, {
                        maxAge: twelveHoursInMs,
                        httpOnly: true, // Prevent client-side access to the cookie
                        sameSite: 'Strict', // Adjust based on your cross-origin needs
                        secure: false // Set to true if using HTTPS
                    });

                    console.log("Session created successfully with ID:", sessionID);
                    return res.status(200).send("Login successful.");
                });
            } else {
                console.log("Invalid password for user:", strUsername);
                res.status(401).json({ error: 'Incorrect password' });
            }
        });
    });
});

// ends the session if timed out or user logs out
app.put("/Login", (req, res) => {
    const sessionID = req.cookies.SessionID;
    if (!sessionID) {
        return res.status(400).send("No session to logout.");
    }

    // Get current time to mark the session's end
    const endTime = Date.now();

    // Update the session to set the `end` field
    const updateQuery = `UPDATE tblSessions SET end = ? WHERE SessionID = ?`;
    db.run(updateQuery, [endTime, sessionID], function (err) {
        if (err) {
            console.error('Error updating session end time:', err.message);
            return res.status(500).send("Failed to logout.");
        }

        res.clearCookie('sessionID');
        res.send("Logged out successfully.");
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
    const strFullName = strFirstName+" "+ strMiddleName+" "+ strLastName
    // validate req then hash the password before storing it
    if (!strEmail || !strPassword || !strFirstName || !strLastName) {
        return res.status(400).send("Email, password, first name, and last name are required.");
    }

    bcrypt.hash(strPassword, saltRounds, (err, hash) => {
        if (err) throw err;

        if(hash){
            // Insert the new user into the database
            const insertQuery = `INSERT INTO tblUsers (UserID, strUsername, strPassword, strTeams, strPhone, strDiscord, strName) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.run(insertQuery, [keyUserID, strEmail, hash, strTeams, intPhoneNumber, strDiscord, strFullName], function(err) {
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

// Route to check session validity and log out if expired
app.get("/CheckSession", (req, res) => {
    const sessionID = req.cookies.SessionID;
    if (!sessionID) {
        console.log("No session ID found in cookies.");
        return res.status(401).send("No session found.");
    }

    console.log("Session ID received:", sessionID); // Debugging

    validateSession(sessionID, (status) => {
        if (status === -1) {
            console.log("Error validating session.");
            return res.status(500).send("Error validating session.");
        } else if (status === -3) {
            console.log("Invalid session.");
            return res.status(401).send("Invalid session.");
        } else if (status === -2) {
            console.log("Session expired.");
            const endTime = Date.now();
            const updateQuery = `UPDATE tblSessions SET end = ? WHERE SessionID = ?`;
            db.run(updateQuery, [endTime, sessionID], function (err) {
                if (err) {
                    console.error('Error updating session end time:', err.message);
                    return res.status(500).send("Failed to log out expired session.");
                }

                res.clearCookie('sessionID');
                res.status(401).send("Session expired. Logged out.");
            });
        } else if (status === -4) {
            console.log("Session already ended.");
            return res.status(401).send("Session already ended.");
        } else if (status === 1) {
            console.log("Session is valid.");
            res.status(200).send("Session is valid.");
        }
    });
});

// Update user Settings information
app.put("/Users", (req, res) => {

    console.log("update user settings endpoint hit");
    if (!req.body) {
        return res.status(400).send("Request body is required.");
    }
    if (!req.cookies || !req.cookies.SessionID) {
        console.log("No session ID found in cookies.");
        return res.status(401).send("No session found.");
    }    
    const sessionID = req.cookies.SessionID;

    validateSession(sessionID, (status) => {
        if (status !== 1) {
            return res.status(401).send("Invalid or expired session.");
        }

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

        // First, retrieve the UserID associated with the given SessionID
        const getUserIDQuery = `SELECT UserID FROM tblSessions WHERE SessionID = ? AND End IS NULL`;
        db.get(getUserIDQuery, [sessionID], (err, row) => {
            if (err) {
                console.error('Error retrieving user ID:', err.message);
                return res.status(500).send("Internal server error.");
            }
            if (!row) {
                return res.status(401).send("Invalid or expired session.");
            }

            const userID = row.UserID;
            console.log("UserID retrieved:", userID);
            // Dynamically build the update query based on the fields to update
            const fields = Object.keys(updatedData).map(key => `${key} = ?`).join(", ");
            const values = Object.values(updatedData);
            values.push(userID); // Add userID to the end for the WHERE clause

            const updateQuery = `UPDATE tblUsers SET ${fields} WHERE UserID = ?`;
            db.run(updateQuery, values, function(err) {
                if (err) {
                    console.error('Error updating user:', err.message);
                    return res.status(500).send("Internal server error.");
                }
                console.log("User settings updated successfully.");
                res.status(200).json({ message: "User settings updated successfully." });
            });
        });
    });
});

app.get("/UserSettings", (req, res) => {     
    console.log("user settings endpoint hit");
    if (!req.cookies) {
        return res.status(401).send("No session found.");
    }
    const sessionID = req.cookies.SessionID;


    // validateSession(sessionID, (status) => {
    //     if (status !== 1) {
    //         return res.status(401).send("Invalid or expired session.");
    //     }

        // Retrieve the UserID associated with the given SessionID
        const getUserIDQuery = `SELECT UserID FROM tblSessions WHERE SessionID = ? AND End IS NULL`;
        db.get(getUserIDQuery, [sessionID], (err, row) => {
            if (err) {
                console.error('Error retrieving user ID:', err.message);
                return res.status(500).send("Internal server error.");
            }
            if (!row) {
                return res.status(401).send("Invalid or expired session.");
            }

            const userID = row.UserID;
            console.log("UserID retrieved:", userID);

            // Retrieve user settings based on UserID
            const getUserSettingsQuery = `SELECT * FROM tblUsers WHERE UserID = ?`;
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
    const checkSessionsQuery = `SELECT * FROM tblSessions WHERE End IS NULL`;
    db.all(checkSessionsQuery, [], (err, rows) => {
        if (err) {
            console.error('Error querying sessions:', err.message);
            return;
        }

        const currentTime = Date.now();
        rows.forEach((session) => {
            if (currentTime - session.start > twelveHoursInMs) {
                const endTime = currentTime;
                const updateEndQuery = `UPDATE tblSessions SET End = ? WHERE SessionID = ?`;
                db.run(updateEndQuery, [endTime, session.sessionID], (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating session end time:', updateErr.message);
                    } else {
                        console.log(`Session ${session.sessionID} has been automatically logged out.`);
                    }
                });
            }
        });
    });
}

// Run the autoLogoutExpiredSessions function every 5 minutes
setInterval(autoLogoutExpiredSessions, 5 * 60 * 1000);

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
