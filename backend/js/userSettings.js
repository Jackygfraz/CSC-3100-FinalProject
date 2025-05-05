const URL = "http://localhost:8000"; // Base URL for the backend API

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedData = {
        Name: document.getElementById('profileName').value,
        Email: document.getElementById('profileEmail').value,
        Teams: document.getElementById('msTeamsContact').value,
        Discord: document.getElementById('discordContact').value,
        PhoneNumber: document.getElementById('phoneNumberContact').value,
    };

    try {
        const response = await fetch(`${URL}/Users`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        });

        if (response.ok) {
            Swal.fire('Success', 'Profile updated successfully!', 'success');
        } else {
            Swal.fire('Error', 'Failed to update profile.', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'An error occurred while updating the profile.', 'error');
    }
});