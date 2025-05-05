const URL = "http://localhost:8000"; // Base URL for the backend API
// LOGIN VALIDATION
async function validateUser(strUsername, strPassword) {
    try {
        const response = await fetch(`${URL}/Login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Ensure cookies are included in the request
            body: JSON.stringify({
                Username: strUsername,
                Password: strPassword
            })
        });

        if (response.status === 401) {
            const data = await response.json();
            throw new Error(data.error || 'Invalid credentials');
        }

        if (!response.ok) {
            throw new Error(`Unexpected error: ${response.status}`);
        }

        // Parse the response to get the JWT token
        const result = await response.json();
        const token = result.token;

        // Store the JWT in localStorage
        localStorage.setItem('jwt', token);

        Swal.fire({
            title: "Valid Login",
            icon: "success",
        }).then(() => {
            window.location.href = "../frontend/studentDashboard.html"; // Redirect after successful login
        });

    } catch (error) {
        console.error('Error during login:', error.message);
        Swal.fire({
            title: "Login Failed",
            html: "<p class='mb-0 mt-0 text-primary'>Invalid Username or Password</p>",
            icon: "error"
        });
    }
}

async function registerUser(userData) {
    //console.log("Registering user:", userData); // debug
    try {
        const response = await fetch(`${URL}/Users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error(`Unexpected error: ${response.status}`);
        }
        Swal.fire({
            title: "Valid Registration",
            icon: "success",
        }).then(() => {
            $('#frmRegister').slideUp('slow');
            $('#frmLogin').slideDown('fast');
            document.getElementById('frmRegister').reset(); // Reset the registration form

        }
        );

    } catch (error) {
        console.error('Error during Registration', error.message);
        Swal.fire({
            title: "Registration Failed",
            icon: "error"
        });
    }
}

document.querySelector('#btnLogin').addEventListener('click', (e) => {
    const regEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Valid email regex
    const regEduEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu$/; // valid email ending in edu

    const regPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W]).{6,20}$/; // password of 6-20 char, special char, uppercase and number

    let strUsername = document.getElementById('txtLoginUsername').value
    let strPassword = document.getElementById('txtLoginPassword').value
    //console.log(strUsername)
   //console.log(strPassword)
    let boolError = false
    let strMessage = ""

    // email validation
    if (!regEmail.test(strUsername)) {
        boolError = true
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Email, Try again</p>"
    }
    else{ // new check for .edu domain if entering a normal email
        if (!regEduEmail.test(strUsername)) {
            boolError = true
            strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Email, a .edu Email  is Required</p>"
        }
    }
    if (!regPassword.test(strPassword)) {
        boolError = true
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Password, try again</p>"
    }
    if (boolError == true) {
        Swal.fire({
            title: "Oh No! You Have an error!",
            html: strMessage,
            icon: "error",
        })
    }
    else {  // valid login case        
        validateUser(strUsername, strPassword)
            .catch(error => {
                console.error("Login failed:", error.message);
            });
        
    }
})

// open registration from login
document.querySelector('#btnRegisterPage').addEventListener('click', (e) => {
    $('#frmLogin').slideUp('slow')
    $('#frmRegister').slideDown('fast')
})

// open login from student registration
document.querySelector('#btnLoginPage').addEventListener('click', (e) => {
    $('#frmRegister').slideUp('slow')
    $('#frmLogin').slideDown('fast')
});

// registered student account validation
document.querySelector("#btnRegister").addEventListener('click', (e) => {
    e.preventDefault()
    const regEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Valid email 
    const regPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W]).{6,20}$/; // password of 6-20 char, special char, uppercase and number
    const regPhone = /^\d{3}\d{3}\d{4}$/
    //const regDiscord = /^ [\w\d]{ 2, 32}#\d{ 4}$/ // discord username of length 2-32 and has 4 digits after #


    // Variables from registration input
    let strFirstName = document.getElementById('txtFirstName').value.trim()
    let strMiddleName = document.getElementById('txtMiddleName').value.trim()
    let strLastName = document.getElementById('txtLastName').value.trim()
    let strEmail = document.getElementById('txtEmail').value
    let strPassword = document.getElementById('txtPassword').value
    let telPhone = document.getElementById('telPhoneNumber').value
    let strDiscordUsername = document.getElementById('txtDiscordUsername').value
    let strTeamsEmail = document.getElementById('txtTeamsUsername').value
    let intFirstNameLen = document.getElementById('txtFirstName').value.trim().length
    let intLastNameLen = document.getElementById('txtLastName').value.trim().length
    let strMessage = ''
    let boolError = false

    // Validating input 
    if (!regEmail.test(strEmail)) { // invalid email
        boolError = true
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Email</p>"
    }
    if (!regPassword.test(strPassword)) { // invalid password
        boolError = true
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Password</p>"
    }

    // Validate Contact info. Mobile, Discord, Teams. These are optional so a check for null is needed
    if (telPhone.trim().length > 0 && !regPhone.test(telPhone)) { // invalid phone number
        boolError = true
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Phone Number</p>"
    } 

    // if (strDiscordUsername.trim().length > 0 && !regDiscord.test(strDiscordUsername)) {
    //     boolError = true;
    //     strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Discord Handle</p>";
    // }

    if (strTeamsEmail.trim().length > 0 && !regEmail.test(strTeamsEmail)){
        boolError = true;
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Teams Username</p>";

    }
    if (intFirstNameLen < 1 || intLastNameLen < 1) { // invalid name
        boolError = true
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Name input</p>"
    }

    if (boolError == true) // failed registration, tells which input is wrong
    {
        Swal.fire({
            title: "Oh No! You Have an error!",
            html: strMessage,
            icon: "error",
        })
    }
    else {
        // successful  pop up
        // strMessage = "Success!";
        // Swal.fire({
        //     title: "Successful Registration",
        //     html: strMessage,
        //     icon: "success",
        // })

            const userData = {
                Email: strEmail,
                Password: strPassword,
                PhoneNumber: telPhone,
                Discord: strDiscordUsername,
                Teams: strTeamsEmail,
                FirstName: strFirstName,
                MiddleName: strMiddleName,
                LastName: strLastName
            };
            registerUser(userData)
     
                
                .catch(error => {
                    console.error("Registration failed:", error.message);
                });
                        
    }

})


