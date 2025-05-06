const URL = "http://localhost:8000"; // Base URL for the backend API

// Retrieve the JWT from localStorage
const sessionData = JSON.parse(localStorage.getItem('jwt'));
const token = sessionData?.token;

// Check if the user is logged in by verifying the JWT token
if (!token) {
    Swal.fire({
        title: "Unauthorized",
        text: "You must be logged in to access this page.",
        icon: "error",
        confirmButtonText: "Login",
        allowOutsideClick: false,
    }).then(() => {
        localStorage.removeItem('jwt'); // Clear any invalid session data
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

        if (response.ok) {
            const result = await response.json();
            // console.log("Token validation response:", result); // Debugging log
            if (result.message !== 'Token and session are valid.') { // Check the message field
                throw new Error("Invalid or expired token.");
            }
        } else {
            console.error("Token validation failed with status:", response.status); // Debugging log
            throw new Error("Invalid or expired token.");
        }
    } catch (error) {
        console.error("Error during token validation:", error); // Debugging log
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

document.getElementById('btnLogout').addEventListener('click', async (e) => {
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