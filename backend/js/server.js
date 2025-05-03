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
}
);

// Function to create tables
function createTables() {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        userType TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Error creating users table: ' + err.message);
        } else {
            console.log('Users table created or already exists.');
        }
    });
}



createTables();
// Close the database connection
db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Closed the database connection.');
});

app.get("/", (req, res) => {
    console.log("home")
    createTables();
});

app.post("/Login", (req, res) => {
   let strUsername =  req.body.username
   let strPassword = req.body.password

    //console.log("login endpoint hit");
})

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
