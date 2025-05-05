



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
            stmt.run([id, userId, answerId, contents,surveyId || null], err => {
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

app.get(('/responses/:surveyid') , (req, res) => {
    const sql = `SELECT * FROM tblStuAnswers `;
    const surveyId = req.query.surveyId; // Get the surveyId from the query parameters

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch responses', details: err.message });
        }

        res.status(200).json(rows);
    });
});


