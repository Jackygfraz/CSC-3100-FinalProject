const express = require('express')
const cors = require('cors')
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

app.get("/", (req, res) => {
    //console.log("home") //debugging
});

/***********************LOGIN***********************/
// Validation of login credentials
app.get("/Login", (req, res) => {
    console.log("login validation endpoint hit"); // debugging
    res.send("Login validation hit"); // debugging
});

// create a session if login is successful
app.post("/Login", (req, res) => {
    console.log("login session creation endpoint hit");
    res.send("session creation hit"); // debugging

})

// ends the session if timed out or user logs out
app.put("/Login", (req, res) => {
    console.log("logout endpoint hit"); // debugging
    res.send("Logout endpoint hit"); // debugging

});

/***********************REGISTRATION***********************/
app.post("/Register", (req, res) => {
    console.log("register endpoint hit"); // debugging
    res.send("Register endpoint hit"); // debugging

});
app.put("Register", (req, res) => {
    console.log("update register endpoint hit"); // debugging
    res.send("Update Register endpoint hit"); // debugging
    
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
