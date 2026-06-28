document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.querySelector('form');
    
    if (!signupForm) return;

    signupForm.addEventListener('submit', async (event) => {
        // 1. Prevent standard browser page reload
        event.preventDefault();

        // 2. Extract form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // 3. Client-side Validation: Check if passwords match
        if (password !== confirmPassword) {
            alert("SECURITY ERROR: Passwords do not match.");
            return;
        }

        // 4. Construct payload with only required entries
        const payload = {
            email,
            password
        };

        try {
            // 5. Send data to backend API route
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            // 6. Handle server responses
            if (response.ok) {
                alert("ACCESS GRANTED: Account created successfully. Redirecting...");
                window.location.href = '/login.html'; 
            } else {
                alert(`REGISTRATION FAILED: ${data.message || 'Unknown Server Error'}`);
            }

        } catch (error) {
            console.error('Network Error:', error);
            alert("CONNECTION ERROR: Unable to reach the mainframe.");
        }
    });
});