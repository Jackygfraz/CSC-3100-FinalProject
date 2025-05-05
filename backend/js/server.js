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




// ROUTES FROM NICK AND SPENCER 



//initializeSampleData()
// Function to initialize sample data
function initializeSampleData() {
    const alterTableQuery = `ALTER TABLE tblStuAnswers ADD COLUMN survey TEXT`;

    db.run(alterTableQuery, (err) => {
        if (err) {
            console.log("Error altering tblStuAnswers table:", err.message);
        } else {
            console.log("Column 'survey' added to tblStuAnswers table successfully.");
        }
    });


}

db.serialize(() => {

}); // Initialize sample data
// Initialize the database and sample data


// Endpoint to get all surveys for the classes a user is enrolled in
app.get('/survey', (req, res) => {


    const sql = `
        Select * from tblSurvey;
    `;

    db.all(sql, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.status(200).json(rows);
    });
});

// Endpoint to get details of a specific survey
app.get('/survey/:surveyId', (req, res) => {
    const surveyId = req.params.surveyId;

    // Query to get survey details
    const sqlSurvey = `SELECT Name, ClassID FROM tblSurvey WHERE SurveyID = ?`;

    // Query to get survey questions and their answer choices
    const sqlQuestions = `
        SELECT q.QuestionID, q.Question, q.Type, 
               GROUP_CONCAT(a.Answer) AS AnswerChoices
        FROM tblSurveyQuestions q
        LEFT JOIN tblAnswers a ON q.QuestionID = a.QuestionID
        WHERE q.SurveyID = ?
        GROUP BY q.QuestionID
    `;

    db.get(sqlSurvey, [surveyId], (err, survey) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        if (!survey) {
            res.status(404).json({ error: 'Survey not found' });
            return;
        }

        db.all(sqlQuestions, [surveyId], (err, questions) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }

            // Format the questions and parse answer choices into arrays
            const formattedQuestions = questions.map(q => ({
                questionID: q.QuestionID,
                questionTitle: q.Question,
                questionType: q.Type,
                answerChoices: q.AnswerChoices ? q.AnswerChoices.split(',') : []
            }));

            res.status(200).json({
                surveyId,
                name: survey.Name,
                classId: survey.ClassID,
                questions: formattedQuestions
            });
        });
    });
});

app.get('/survey/:surveyId/responses', (req, res) => {
    const surveyId = req.params.surveyId;

    // Query to get survey questions
    const sqlQuestions = `
        SELECT q.QuestionID, q.Question, q.Type
        FROM tblSurveyQuestions q
        WHERE q.SurveyID = ?
    `;

    // Query to get student responses
    const sqlResponses = `
        SELECT sa.QuestionID, sa.Contents, sa.UserID, u.Name AS StudentName, sa.UserID AS UserID
        FROM tblStuAnswers sa
        INNER JOIN tblUsers u ON sa.UserID = u.UserID
        INNER JOIN tblAnswers a ON sa.AnswerID = a.AnswerID
        WHERE a.QuestionID IN (SELECT QuestionID FROM tblSurveyQuestions WHERE SurveyID = ?)
    `;

    db.all(sqlQuestions, [surveyId], (err, questions) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch survey questions', details: err.message });
        }

        db.all(sqlResponses, [surveyId], (err, responses) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch survey responses', details: err.message });
            }

            // Combine questions with their responses
            const surveyData = questions.map(question => ({
                questionId: question.QuestionID,
                questionTitle: question.Question,
                questionType: question.Type,
                responses: responses
                    .filter(response => response.QuestionID === question.QuestionID)
                    .map(response => ({
                        studentName: response.StudentName,
                        userId: response.UserID,
                        contents: response.Contents,
                    })),
            }));

            res.status(200).json(surveyData);
        });
    });
});

app.get('/survey/:surveyId/response', (req, res) => {
    const surveyId = req.params.surveyId;

    // Query to get survey questions
    const sqlQuestions = `
        SELECT q.QuestionID, q.Question, q.Type, 
               GROUP_CONCAT(a.Answer) AS AnswerChoices
        FROM tblSurveyQuestions q
        LEFT JOIN tblAnswers a ON q.QuestionID = a.QuestionID
        WHERE q.SurveyID = ?
        GROUP BY q.QuestionID
    `;

    // Query to get student responses
    const sqlResponses = `
        SELECT sa.QuestionID, sa.Contents, sa.UserID, u.Name AS StudentName
        FROM tblStuAnswers sa
        LEFT JOIN tblUsers u ON sa.UserID = u.UserID
        WHERE sa.survey = ?
    `;

    db.all(sqlQuestions, [surveyId], (err, questions) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch survey questions', details: err.message });
        }

        db.all(sqlResponses, [surveyId], (err, responses) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch survey responses', details: err.message });
            }

            // Combine questions with their responses
            const surveyData = questions.map(question => ({
                questionId: question.QuestionID,
                questionTitle: question.Question,
                questionType: question.Type,
                answerChoices: question.AnswerChoices ? question.AnswerChoices.split(',') : [],
                responses: responses
                    .filter(response => response.QuestionID === question.QuestionID)
                    .map(response => ({
                        studentName: response.StudentName,
                        contents: response.Contents,
                    })),
            }));

            res.status(200).json(surveyData);
        });
    });
});

app.get('/enrolledClassses/:userId', (req, res) => {
    const userId = req.params.userId;

    const sql = `
        SELECT c.ClassName
        FROM tblClasses c
        INNER JOIN tblStuClass sc ON c.ClassID = sc.ClassID
        WHERE sc.UserID = ? 
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        // Return only the class names in an array format
        const classNames = rows.map(row => row.ClassName);
        res.status(200).json(classNames);
    });
});

app.get('/classes/:userId', (req, res) => {
    const userId = req.params.userId;

    const sql = `
        SELECT c.ClassName
        FROM tblClasses c
        INNER JOIN tblStuClass sc ON c.ClassID = sc.ClassID
        WHERE sc.UserID = ? AND sc.Instructor = 1
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        // Return only the class names in an array format
        const classNames = rows.map(row => row.ClassName);
        res.status(200).json(classNames);
    });
});

app.get('/test', (req, res) => {
    const { survey, userID } = req.query;

    if (!survey || !userID) {
        return res.status(400).json({ error: 'Missing required query parameters: survey and userID' });
    }

    const sql = `SELECT * FROM tblStuAnswers WHERE survey = ? AND UserID = ?`;

    db.all(sql, [survey, userID], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

app.get('/classId/:surveyId', (req, res) => {
    const surveyId = req.params.surveyId;

    const sql = `SELECT ClassID FROM tblSurvey WHERE SurveyID = ?`;

    db.get(sql, [surveyId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch ClassID', details: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        res.status(200).json({ classId: row.ClassID });
    });
});


app.get('/completed-surveys/:userId', (req, res) => {
    const sql = `
        SELECT DISTINCT 
            tblStuAnswers.UserID, 
            tblUsers.Name AS Student, 
            tblSurvey.Name AS SurveyName, 
            tblSurvey.SurveyID
        FROM tblStuAnswers
        LEFT JOIN tblUsers ON tblStuAnswers.UserID = tblUsers.UserID
        LEFT JOIN tblSurvey ON tblStuAnswers.survey = tblSurvey.SurveyID
        WHERE tblStuAnswers.UserID = ?;
    `;

    db.all(sql, [req.params.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch completed surveys', details: err.message });
        }

        const completedSurveys = rows.map(row => ({
            userId: row.UserID || null,
            student: row.Student || 'Unknown Student',
            surveyName: row.SurveyName || 'Unknown Survey',
            surveyId: row.SurveyID || null,
        }));

        res.status(200).json(completedSurveys);
    });
});
app.get('/answers/:userId/:surveyId', (req, res) => {
    const { userId, surveyId } = req.params;

    const sql = `
        SELECT * 
        FROM tblStuAnswers 
        WHERE UserID = ? AND survey = ?
    `;

    db.all(sql, [userId, surveyId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch answers', details: err.message });
        }

        res.status(200).json(rows);
    });
});

app.get('/distinct-surveys/:userId', (req, res) => {
    const userId = req.params.userId;

    const sql = `
        SELECT DISTINCT survey AS SurveyID
        FROM tblStuAnswers
        WHERE UserID = ?
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch distinct surveys', details: err.message });
        }

        const surveyIds = rows.map(row => row.SurveyID);
        res.status(200).json(surveyIds);
    });
});


app.get('/survey/:surveyId/student/:userId', (req, res) => {
    const { surveyId, userId } = req.params;

    // Query to fetch student details for the given survey and user
    const sql = `
        SELECT contents
        FROM tblStuAnswers sa
        WHERE Survey = ? AND UserID = ?
    `;

    db.all(sql, [surveyId, userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch student details', details: err.message });
        }

        // Return the student details
        res.status(200).json(rows);
    });

});
app.get('/survey/:surveyId/student/:userId/answers', (req, res) => {
    const { surveyId, userId } = req.params;

    const sql = `
        SELECT sa.Contents, q.Question, q.Type
        FROM tblStuAnswers sa
        INNER JOIN tblSurveyQuestions q ON sa.QuestionID = q.QuestionID
        WHERE sa.Survey = ? AND sa.UserID = ?
    `;

    db.all(sql, [surveyId, userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch student answers', details: err.message });
        }

        res.status(200).json(rows);
    });
});

app.post('/survey', (req, res) => {
    const { Name, ClassID, Questions } = req.body;

    if (!Name || !ClassID || !Questions || !Array.isArray(Questions)) {
        return res.status(400).json({ error: 'Missing required fields or invalid data' });
    }

    // Insert survey into the database
    const surveyID = uuidv4();
    const sqlSurvey = `INSERT INTO tblSurvey (SurveyID, Name, ClassID) VALUES (?, ?, ?)`;
    db.run(sqlSurvey, [surveyID, Name, ClassID], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Insert questions and answer choices into the database
        const sqlQuestion = `INSERT INTO tblSurveyQuestions (QuestionID, SurveyID, Question, Type) VALUES (?, ?, ?, ?)`;
        const sqlAnswer = `INSERT INTO tblAnswers (AnswerID, QuestionID, Answer) VALUES (?, ?, ?)`;
        const stmtQuestion = db.prepare(sqlQuestion);
        const stmtAnswer = db.prepare(sqlAnswer);

        Questions.forEach(question => {
            const questionID = uuidv4();
            stmtQuestion.run([questionID, surveyID, question.questionTitle, question.questionType]);

            if (question.questionType === 'multipleChoice' && question.answerChoices) {
                question.answerChoices.forEach(choice => {
                    stmtAnswer.run([uuidv4(), questionID, choice]);
                });
            }
        });

        stmtQuestion.finalize();
        stmtAnswer.finalize();
        res.status(201).json({ message: 'Survey created successfully', SurveyID: surveyID });
    });
});




app.post('/survey/submit', (req, res) => {
    const { surveyId, responses, userId } = req.body;

    // Validate input
    if (!surveyId || !responses || !userId || !Array.isArray(responses)) {
        return res.status(400).json({ error: 'Missing required fields or invalid data' });
    }

    console.log('Received responses:', responses);
    const query = `INSERT INTO tblStuAnswers (ID, UserID, AnswerID, Contents, survey) VALUES (?, ?, ?, ?, ?)`;

    const stmt = db.prepare(query);
    const errors = [];

    const processResponse = (response, callback) => {
        const { answerId, contents } = response;

        if (!answerId && contents === undefined) {
            errors.push({ error: 'Invalid response data' });
            return callback();
        }

        // If the response includes an AnswerID, store it directly

        if (answerId) {
            const id = uuidv4();
            stmt.run([id, userId, answerId, contents, surveyId || null], err => {
                if (err) {
                    errors.push({ answerId, error: err.message });
                }
                callback();
            });
        } else {
            // If no AnswerID is provided, store the contents for short-answer or Likert questions
            const id = uuidv4();
            stmt.run([id, userId, null, contents, surveyId], err => {
                if (err) {
                    errors.push({ error: err.message });
                }
                callback();
            });
        }
    };

    // Process each response sequentially
    let processedCount = 0;
    responses.forEach(response => {
        processResponse(response, () => {
            processedCount++;
            if (processedCount === responses.length) finalize();
        });
    });

    const finalize = () => {
        stmt.finalize(err => {
            if (err) {
                return res.status(500).json({ error: 'Failed to finalize database operation', details: err.message });
            }

            if (errors.length > 0) {
                return res.status(400).json({ message: 'Some responses failed to save', errors });
            }

            res.status(201).json({ message: 'Responses submitted successfully' });
        });
    };
});

app.get(('/responses/:surveyid'), (req, res) => {
    const sql = `SELECT * FROM tblStuAnswers `;
    const surveyId = req.query.surveyId; // Get the surveyId from the query parameters

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch responses', details: err.message });
        }

        res.status(200).json(rows);
    });
});
/***********************GROUP***********************/

//creates a new group ID
app.post('/group', (req, res) => {
    const groupID = uuidv4();
    const class_id = req.body.class_id
    const max = req.body.max

    db.run(
        `INSERT INTO tblGroups VALUES (?, ?, ?)`,
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
    const user_id = req.body.user_id
    const group_id = req.body.group_id
    const is_active = req.body.is_active
    db.run(
        `INSERT INTO tblStuGroup VALUES (?, ?, ?, ?)`,
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
    const is_active = req.body.is_active;
    const { id } = req.params;
  
    // Convert the boolean to SQLite-compatible integer
    const activeValue = is_active === true ? 1 : 0;
  
    // Update the IsActive field in stu_group
    db.run(
      `UPDATE tblStuGroup SET IsActive = ? WHERE stu_groupID = ?`,
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