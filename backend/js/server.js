const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require("uuid");
const cookieParser = require('cookie-parser');
const saltRounds = 10;
const twelveHoursInMs = 12 * 60 * 60 * 1000;
const PORT = 8000
var app = express()
app.use(cors())
app.use(express.json())

app.use(cookieParser());

const sql = require('sqlite3').verbose()
const dbSource = "../finalProject.db"

const db = new sql.Database(dbSource, (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the finalProject database.');
    }
});

function closeDB() {
    db.close((err) => {
        if (err) {
            console.error('Error closing database ' + err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
}

function validateSession(sessionID, callback) {
    const validateQuery = `SELECT * FROM tblSessions WHERE sessionID = ?`;
    db.get(validateQuery, [sessionID], (err, row) => {
        if (err) return callback(-1);
        if (!row) return callback(-3); // invalid session

        const dateCurrent = Date.now();
        if (dateCurrent - row.start > twelveHoursInMs) {
            // Update the end time when the session has expired
            const endTime = Date.now();
            const updateEndQuery = `UPDATE tblSessions SET end = ? WHERE sessionID = ?`;
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





function createSession(userID, callback) {
    const checkSessionQuery = `SELECT * FROM tblSessions WHERE userID = ?`;
    db.get(checkSessionQuery, [userID], (err, row) => {
        if (err) {
            console.error('Error querying database: ' + err.message);
            return callback(err, null);
        }

        if (row) {
            console.log("Session already exists for user ID:", userID);
            return callback(null, row.sessionID); // Return existing session
        }

        const sessionID = uuidv4();
        const startTime = Date.now();
        const queryInsertSession = `INSERT INTO tblSessions (sessionID, userID, start) VALUES (?, ?, ?)`;
        db.run(queryInsertSession, [sessionID, userID, startTime], function (err) {
            if (err) {
                console.error('Error inserting session: ' + err.message);
                return callback(err, null);
            }
            console.log("Session created");
            callback(null, sessionID);
        });
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
                createSession(row.UserID, (err, sessionID) => {
                    if (err) {
                        return res.status(500).send("Could not create session.");
                    }
                    // Set cookie
                    res.cookie('sessionID', sessionID, {
                        httpOnly: true,
                        maxAge: twelveHoursInMs,
                        sameSite: 'Strict',
                        secure: false // set to true in production with HTTPS
                    });
                    return res.status(200).send("Login successful.");
                });
            }
             else {
                console.log("Invalid password for user:", strUsername);
                return res.status(401).send("Invalid username or password.");
            }
        });
    });
});


// ends the session if timed out or user logs out
app.put("/Login", (req, res) => {
    const sessionID = req.cookies.sessionID;
    if (!sessionID) {
        return res.status(400).send("No session to logout.");
    }

    // Get current time to mark the session's end
    const endTime = Date.now();

    // Update the session to set the `end` field
    const updateQuery = `UPDATE tblSessions SET end = ? WHERE sessionID = ?`;
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
    console.log("register endpoint hit"); // debugging

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
                console.log("User registered successfully with ID:", keyUserID);
                res.status(201).send("User registered successfully.");
            });

        }
    });
});

// Update user registration information
app.put("/Users", (req, res) => {
    console.log("update register endpoint hit"); // debugging

});



// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
