const express = require('express')
const cors = require('cors')
const {v4:uuidv4} = require('uuid')
const sqlite3 = require('sqlite3').verbose()


const dbSource = "finalproject.db"
const HTTP_PORT = 8000
const db = new sqlite3.Database(dbSource)

var app = express()
app.use(cors())
app.use(express.json())

app.post('/classes', (req, res, next) => {

})
app.put('/classes', (req, res, next) => {
    
})
app.get('/classes', (req, res, next) => {
    
})

app.get('/',(req,res,next) => {
    res.status(200).json({message:"I am alive"})
})
app.listen(HTTP_PORT,() => {
    console.log('App listening on',HTTP_PORT)
})
