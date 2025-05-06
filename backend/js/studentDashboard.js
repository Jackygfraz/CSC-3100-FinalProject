const URL = "http://localhost:8000"; // Base URL for the backend API


const sessionData = JSON.parse(localStorage.getItem('jwt')); // Parse the stored session data
const token = sessionData?.token; // Extract the token

fetch(`${URL}/fuck`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Include the JWT in the Authorization header
    }
}).then(response => {
    if (response.ok) {
        return response.json();
    } else {
        throw new Error('Network response was not ok');
    }
}).then(data => {
    console.log(data); // Handle the fetched data
}).catch(error => {
    console.error('Error fetching data:', error); // Handle errors
});


// Parse the JWT from localStorage
const sessionData = JSON.parse(localStorage.getItem('jwt')); // Parse the stored session data
const token = sessionData?.token; // Extract the token

if (!token) {
    Swal.fire({
        title: "Unauthorized",
        text: "You must be logged in to access this page.",
        icon: "error",
        confirmButtonText: "Login",
        allowOutsideClick: false,
    }).then(() => {
        window.location.href = "../frontend/index.html"; // Redirect to login page
    });
} else {
    validateToken(); // Validate the token on page load
}

async function validateToken() {
    try {
        const response = await fetch(`${URL}/ValidateToken`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Include the JWT in the Authorization header
            },
        });

        if (!response.ok) {
            throw new Error("Invalid or expired token.");
        }

        const result = await response.json();
        if (result.message !== 'Token and session are valid.') {
            throw new Error("Invalid or expired token.");
        }
    } catch (error) {
        console.error("Error during token validation:", error);
        Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "error",
            confirmButtonText: "Login",
            allowOutsideClick: false,
        }).then(() => {
            localStorage.removeItem('jwt'); // Clear the JWT from storage
            window.location.href = "../frontend/index.html"; // Redirect to login page
        });
    }
}

fetchUserData(); // Fetch user data on page load

document.getElementById('btnSaveSettings').addEventListener('click', async (e) => {
    e.preventDefault();

    const updatedData = {
        Name: document.getElementById('profileName').value,
        Email: document.getElementById('profileEmail').value,
        Teams: document.getElementById('msTeamsContact').value,
        Discord: document.getElementById('discordContact').value,
        PhoneNumber: document.getElementById('phoneNumberContact').value,
    };
   // console.log("Updated Data:", updatedData); // debug

    // Validate that all field
    const regEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Valid email 
    const regPhone = /^\d{3}\d{3}\d{4}$/
    let boolError = false
    let strMessage = ""; // Initialize message string

    if (updatedData.Email.trim().length > 0 && !regEmail.test(updatedData.Email)) { // invalid email
        boolError = true
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Email</p>"
    }
    // Validate Contact info. Mobile, Discord, Teams. These are optional so a check for null is needed
    if (updatedData.PhoneNumber.trim().length > 0 && !regPhone.test(updatedData.PhoneNumber)) { // invalid phone number
        boolError = true
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Phone Number</p>"
    }

    if (updatedData.Teams.trim().length > 0 && !regEmail.test(updatedData.Teams)) {
        boolError = true;
        strMessage += "<p class='mb-0 mt-0 text-primary'>Invalid Teams Username</p>";

    }


    if (boolError == true) // failed registration, tells which input is wrong
    {
        Swal.fire({
            title: "Invalid Fields",
            html: strMessage,
            icon: "error",
        })
        return; // Stop execution if validation fails
    }
  

    try {
        const response = await fetch(`${URL}/Users`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Include the JWT in the Authorization header
            },
            body: JSON.stringify(updatedData),
        });

        if (response.ok) {
           // console.log(response);
            Swal.fire('Success', 'Profile updated successfully!', 'success').then(() => {
                window.location.href = "../frontend/studentDashboard.html"; // Redirect after successful update
            });
        } else {
            Swal.fire('Error', 'Failed to update profile.', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'An error occurred while updating the profile.', 'error');
    }
});

// Function to fetch user data from the backend to fill the profile form
async function fetchUserData() {
    try {
        const response = await fetch(`${URL}/Users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Include the JWT in the Authorization header
            },
        });

        if (!response.ok) {
            throw new Error(`Unexpected error: ${response.status}`);
        }

        const userData = await response.json();
        // console.log("Fetched User Data:", userData); // debug

        // Fill the form with user data
        if (!userData.strName) userData.strName = 'N/A';
        if (!userData.strUsername) userData.strUsername = 'N/A';
        if (!userData.strTeams) userData.strTeams = 'N/A';
        if (!userData.strDiscord) userData.strDiscord = 'N/A';
        if (!userData.strPhoneNumber) userData.strPhoneNumber = 'N/A';

        document.getElementById('displayName').innerHTML = userData.strName || '';
        document.getElementById('displayEmail').innerHTML = userData.strUsername || '';
        document.getElementById('lstDisplayContacts').innerHTML = `
            <li class="list-group-item">MS Teams: ${userData.strTeams}</li>
            <li class="list-group-item">Discord: ${userData.strDiscord}</li>
            <li class="list-group-item">Phone Number: ${userData.strPhoneNumber}</li>
        `;
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

document.getElementById('dropdownLogout').addEventListener('click', async (e) => {
    e.preventDefault();

    try {
        const response = await fetch(`${URL}/Logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Include the JWT in the Authorization header
            },
        });

        if (!response.ok) {
            throw new Error("Failed to log out.");
        }

        localStorage.removeItem('jwt'); // Clear the JWT from storage
        Swal.fire({
            title: "Logged Out",
            icon: "success",
        }).then(() => {
            window.location.href = "../frontend/index.html"; // Redirect to login page
        });
    } catch (error) {
        console.error("Error during logout:", error);
        Swal.fire('Error', 'An error occurred while logging out.', 'error');
    }
});