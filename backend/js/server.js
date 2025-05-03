const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require("uuid")
const saltRounds = 10;
const twelveHoursInMs = 12 * 60 * 60 * 1000;
const PORT = 8000
var app = express()
app.use(cors())
app.use(express.json())
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

function validateSession(sessionID){
    // Function to validate session
    console.log("Validating session with ID:", sessionID);
    const validateQuery = `SELECT * FROM tblSessions WHERE sessionID = ?`;
    db.get(validateQuery, [sessionID], (err, row) => {
        if (err) {
            console.error('Error querying database: ' + err.message);
            return -1;
        }
        if (row) {
            console.log("Session Found... DATE "+ row.end);
            const dateCurrent= Date.now()
            if (dateCurrent - row.end > twelveHoursInMs) {
                console.log("Session has expired.");
                return -2; // Session has expired
            }

            return 1; // Session is valid

        } else {
            console.log("Session is invalid.");
            return -3; // Session is invalid
        }
    });
}



function createSession(userID) {
    // Function to create a session
    // check if session already exists for the user
    const checkSessionQuery = `SELECT * FROM tblSessions WHERE userID = ?`;
    db.get(checkSessionQuery, [userID], (err, row) => {
        if (err) {
            console.error('Error querying database: ' + err.message);
            return;
        }
        if (row) {
            console.log("Session already exists for user ID:", userID);
            return;
        }})
    // If no session exists, create a new one
    const sessionID = uuidv4(); // Generate a unique session ID
    const startTime = Date.now();
    const queryInsertSession = `INSERT INTO tblSessions (sessionID, userID, start) VALUES (?, ?, ?)`;
    db.run(queryInsertSession, [sessionID, userID, startTime], (err,row) => {
        //console.log("Session created with ID:", sessionID);
        if (err) {
            console.error('Error inserting session: ' + err.message);
            return;
        }
    console.log("Session created");
})
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
                console.log("User ID: " + row.UserID);
                createSession(row.UserID);
                return res.status(200).send("Login successful.");
            } else {
                console.log("Invalid password for user:", strUsername);
                return res.status(401).send("Invalid username or password.");
            }
        });
    });
});


// ends the session if timed out or user logs out
app.put("/Login", (req, res) => {
    console.log("logout endpoint hit"); // debugging
    //res.send("Logout endpoint hit"); // debugging

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
