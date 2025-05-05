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
   
    let strClassID = uuidv4()
    let datStartDate = req.body.startDate
    let datEndDate = req.body.endDate
    let strClassname = req.body.name
    let strClassDescription = req.body.description
    let strUserID = req.body.id
    let boolIsAdmin = req.body.isAdmin
    let boolIsActive = req.body.active
    let strcommand1 = `INSERT INTO tblClasses VALUES (?,?,?,?,?,?)`
    db.run(strcommand1, [strClassID,strClassname,strClassDescription,datStartDate,datEndDate , boolIsActive], function (err) {
        if(err){
            console.log(err)
            res.status(400).json({
                status:"error",
                message:err.message
            })
        } else {
           let strStuClassID = uuidv4()
           let strcommand2 = `INSERT INTO tblStuClass VALUES (?,?,?,?)`
           db.run(strcommand2, [strStuClassID,strUserID,strClassID,boolIsAdmin], function (err) {
            if(err){
                console.log(err)
                res.status(400).json({
                    status:"error",
                    message:err.message
                })
            } else {
                res.status(201).json({
                    status:"success"
                })
            }
           })

        }
})
})

app.put('/classes', (req, res, next) => {
    
})

app.get('/classes/instructorClasses', (req, res, next) => {
    
    let strUserID = req.body.id
    let boolIsAdmin = req.body.isAdmin
    let sql = `SELECT ClassName, Description,StartDate,EndDate,IsActive FROM tblClasses JOIN tblStuClass ON tblClasses.ClassID = tblStuClass.ClassID WHERE tblStuClass.UserID = ? AND tblStuClass.Instructor = ?;`

    db.all(sql, [strUserID, boolIsAdmin], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).json({ status: "error", message: err.message });
        } else {
            res.json(rows);
        }
    })
})

app.get('/',(req,res,next) => {
    res.status(200).json({message:"I am alive"})
})
app.listen(HTTP_PORT,() => {
    console.log('App listening on',HTTP_PORT)
})
