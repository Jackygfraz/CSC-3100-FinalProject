
// LOGIN VALIDATION
document.querySelector('#btnLogin').addEventListener('click', (e) => {
    const regEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Valid email regex
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
    if (!regPassword.test(strPassword.value)) {
        boolError = true
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Password, try again</p>"
    }
    if (boolError == true) {
        Swal.fire({
            title: "Oh No! You Have an error!",
            html: strMessage,
            icon: "error",
            draggable: true
        })
    }
    else {
        //strMessage = "<p class='mb-0 mt-0 text-primary'></p>"

        // true valid login
        Swal.fire({
            title: "Valid Login",
            //html: strMessage,
            icon: "success",
            draggable: true
        })
    }
})

// open registration from login
document.querySelector('#btnRegisterPage').addEventListener('click', (e) => {
    $('#frmLogin').slideUp('slow')
    $('#frmRegister').slideDown('fast')

})

// open login from registration
document.querySelector('#btnLoginPage').addEventListener('click', (e) => {
    $('#frmRegister').slideUp('slow')
    $('#frmLogin').slideDown('fast')
});



// registered account validation
document.querySelector("#btnRegister").addEventListener('click', (e) => {
    e.preventDefault()
    const regEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Valid email 
    const regPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W]).{6,20}$/; // password of 6-20 char, special char, uppercase and number
    const regPhone = /^\d{3}\d{3}\d{4}$/

    // Variables from registration input
    let strEmail = document.getElementById('txtEmail').value
    let strPassword = document.getElementById('txtPassword').value
    let intFirstNameLen = document.getElementById('txtFirstName').value.trim().length
    let intLastNameLen = document.getElementById('txtLastName').value.trim().length
    let strMessage = ''
    let boolError = false
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
            draggable: true
        })
    }
    else {
        // successful login pop up
        strMessage = "Success!";
        Swal.fire({
            title: "Successful Registration",
            html: strMessage,
            icon: "success",
            draggable: true
        }).then(result => { // submit or "clear" the form then moves the login box back in view
            document.getElementById("frmRegister").submit()
            $('#frmRegister').slideUp('slow')
            $('#frmLogin').slideDown('fast')

        })
    }

})


// ADD DATABASE ACCESS TO STORE USERS 