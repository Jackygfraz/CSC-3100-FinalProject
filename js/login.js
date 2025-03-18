
// LOGIN VALIDATION
document.querySelector('#btnLogin').addEventListener('click', (e) => {
    const regEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Valid email regex
    const regEduEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu$/; // valid email ending in edu

    const regPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W]).{6,20}$/; // password of 6-20 char, special char, uppercase and number

    let strUsername = document.getElementById('txtLoginUsername')
    let strPassword = document.getElementById('txtLoginPassword')
    //console.log(strPassword.value)
    let boolError = false
    let strMessage = ""

    // email validation
    if (!regEmail.test(strUsername.value)) {
        boolError = true
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Email, Try again</p>"
    }
    else{ // new check for .edu domain if entering a normal email
        if (!regEduEmail.test(strUsername.value)) {
            boolError = true
            strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Email, a .edu Email  is Required</p>"
        }
    }
    if (!regPassword.test(strPassword.value)) {
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
    else {
        // true valid login
        Swal.fire({
            title: "Valid Login",
            icon: "success",
        })
    }
})

// open registration from login
document.querySelector('#btnRegisterPage').addEventListener('click', (e) => {
    // Adding option for student or Instructor, possibly through sweet alert
    // using template found at https://sweetalert2.github.io/
    Swal.fire({
        title: "Register a student or Instructor?",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Student",
        denyButtonText: `Instructor`
    }).then((result) => {
        if (result.isConfirmed) {
            $('#frmLogin').slideUp('slow')
            $('#frmStudentRegister').slideDown('fast')
        } else if (result.isDenied) {
            $('#frmLogin').slideUp('slow')
            $('#frmInstructorRegister').slideDown('fast')
        }
    });
    

})

// open login from student registration
document.querySelector('#btnStudentLoginPage').addEventListener('click', (e) => {
    $('#frmStudentRegister').slideUp('slow')
    $('#frmLogin').slideDown('fast')
});

// open login from Instructor registration
document.querySelector('#btnInstructorLoginPage').addEventListener('click', (e) => {
    $('#frmInstructorRegister').slideUp('slow')
    $('#frmLogin').slideDown('fast')
});



// registered student account validation
document.querySelector("#btnStudentRegister").addEventListener('click', (e) => {
    e.preventDefault()
    const regEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Valid email 
    const regPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W]).{6,20}$/; // password of 6-20 char, special char, uppercase and number
    const regPhone = /^\d{3}\d{3}\d{4}$/
    const regDiscord = /^ [\w\d]{ 2, 32}#\d{ 4}$/ // discord username of length 2-32 and has 4 digits after #


    // Variables from registration input
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

    if (strDiscordUsername.trim().length > 0 && !regDiscord.test(strDiscordUsername)) {
        boolError = true;
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Discord Handle</p>";
    }

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
        // successful login pop up
        strMessage = "Success!";
        Swal.fire({
            title: "Successful Registration",
            html: strMessage,
            icon: "success",
        }).then(result => { // submit or "clear" the form then moves the login box back in view
            document.getElementById("frmRegister").submit()
            $('#frmRegister').slideUp('slow')
            $('#frmLogin').slideDown('fast')

        })
    }

})
// registered Instructor account validation
document.querySelector("#btnInstructorRegister").addEventListener('click', (e) => {
    e.preventDefault()
    const regEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Valid email 
    const regPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W]).{6,20}$/; // password of 6-20 char, special char, uppercase and number


    // Variables from registration input
    let strEmail = document.getElementById('txtInstructorEmail').value
    let strPassword = document.getElementById('txtInstructorPassword').value
    let intFirstNameLen = document.getElementById('txtInstructorFirstName').value.trim().length
    let intLastNameLen = document.getElementById('txtInstructorLastName').value.trim().length
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
        // successful login pop up
        strMessage = "Success!";
        Swal.fire({
            title: "Successful Registration",
            html: strMessage,
            icon: "success"
        }).then(result => { // submit or "clear" the form then moves the login box back in view
            document.getElementById("frmRegister").submit()
            $('#frmRegister').slideUp('slow')
            $('#frmLogin').slideDown('fast')

        })
    }

})

// ADD DATABASE ACCESS TO STORE USERS 