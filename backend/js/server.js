const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require("uuid")

const saltRounds = 10;

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

function createSession() {
    // Function to create a session
    // This is a placeholder function, implement session management as needed
    console.log("Session created");
}


app.get("/", (req, res) => {
    //console.log("home") //debugging
});

/***********************LOGIN***********************/
// Validation of login credentials
app.post("/Login", (req, res) => {
    console.log("login validation endpoint hit"); // debugging

    if (!req.body) {
        return res.status(400).send("Username and password are required.");
    }
    else if (!req.body.Username || !req.body.Password) {
        return res.status(400).send("Username and password are required.");
    }

    const strUsername = req.body.Username
    const strPassword = req.body.Password 
    const storedHashedPassword = ''; // Retrieved from database


    // validate credentials against the database
    const validateQuery = `SELECT * FROM tblUsers WHERE strUsername = ?`;
    db.get(validateQuery, [strUsername], (err, row) => {
        if (err) {
            console.error('Error querying database: ' + err.message);
            return res.status(500).send("Internal server error.");
        }
        if (row) {
            // User found, check password 
            bcrypt.compare(strPassword, storedHashedPassword, (err, result) => {
                if (err) throw err;

                if (result) {
                    console.log('Password is correct');
                    // Password matches, proceed with session creation
                    createSession();
                    return res.status(200).send("Login successful.");


                } else {
                    return res.status(401).send("Invalid password.");
                    //console.log('Invalid password');
                }
            });
            console.log("Login successful for user:", strUsername);

        } else {
            // User not found or credentials do not match
            console.log("Login failed for user:", strUsername);
            return res.status(401).send("Invalid username or password.");
        }
    });
    //res.send("Login validation hit"); // debugging
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
    res.send("Update Register endpoint hit"); // debugging

});

/***********************GROUP***********************/

//creates a new group ID
app.post('/group', (req, res) => {
    const groupID = uuidv4();
    const { class_id, max } = req.body;

    db.run(
        `INSERT INTO tblGroups (GroupID, ClassID, Max) VALUES (?, ?, ?)`,
        [groupID, class_id, max],
        function (err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({ GroupID: groupID, status: 'created' });
          }
        );
});

//creates a new group in relation to student pov (IE adding a student to a group)
 app.post('/group/member', (req, res) => {
    const stuGroupID = uuidv4();
    const { user_id, group_id, is_active } = req.body;
    db.run(
        `INSERT INTO stu_group (stu_groupID, UserID, GroupID, IsActive) VALUES (?, ?, ?, ?)`,
        [stuGroupID, user_id, group_id, is_active ? 1 : 0],
        function (err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({ stu_groupID: stuGroupID, status: 'user added' });
          }
        );
});

//update on IsActive field whenever a student is removed
app.put('/group/member/:id', (req, res) => {
    const { is_active } = req.body;
    const { id } = req.params;
  
    // Convert the boolean to SQLite-compatible integer
    const activeValue = is_active === true ? 1 : 0;
  
    // Update the IsActive field in stu_group
    db.run(
      `UPDATE stu_group SET IsActive = ? WHERE stu_groupID = ?`,
      [activeValue, id],
      function (err) {
        if (err) {
          // Return error if update fails
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          // No row was updated — ID may not exist
          return res.status(404).json({ error: 'stu_groupID not found' });
        }
        // Respond with updated status
        res.json({ stu_groupID: id, status: 'updated', is_active });
      }
    );
  });
    
  

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
