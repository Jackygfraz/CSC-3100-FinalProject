const URL = "http://localhost:8000"; // Base URL for the backend API

if (localStorage.getItem('jwt') === null) {
    Swal.fire({
        title: "Unauthorized",
        text: "You must be logged in to access this page.",
        icon: "error",
        confirmButtonText: "Login",
        allowOutsideClick: false,
    }).then(() => {
        window.location.href = "../frontend/index.html"; // Redirect to login page
    });
}
// Retrieve the JWT from localStorage
const token = localStorage.getItem('jwt'); // Ensure the token is stored securely

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
    console.log("Updated Data:", updatedData); // debug

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
            console.log(response);
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
        const response = await fetch(`${URL}/UserSettings`, {
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
        if (!userData.strEmail) userData.strEmail = 'N/A';
        if (!userData.strTeams) userData.strTeams = 'N/A';
        if (!userData.strDiscord) userData.strDiscord = 'N/A';
        if (!userData.strPhoneNumber) userData.strPhoneNumber = 'N/A';

        document.getElementById('displayName').innerHTML = userData.strName || '';
        document.getElementById('displayEmail').innerHTML = userData.strEmail || '';
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

    // Simply remove the token from localStorage to "log out"
    localStorage.removeItem('jwt'); // Clear the JWT from storage

    Swal.fire({
        title: "Logged Out",
        icon: "success",
    }).then(() => {
        window.location.href = "../frontend/index.html"; // Redirect to login page
    });
});