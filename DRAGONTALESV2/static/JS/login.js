document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = passwordInput.value;
        errorMessage.classList.add('hidden');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: password }),
            });

            if (response.ok) {
                // If login is successful, the server will redirect us. probably.
                window.location.href = '/upload';
            } else {
                // If login fails, show an error.
                errorMessage.classList.add('show');
            }
        } catch (error) {
            console.error('Login request failed:', error);
            errorMessage.textContent = 'An error occurred. Please try again.';
            errorMessage.classList.remove('hidden');
        }
    });
});
