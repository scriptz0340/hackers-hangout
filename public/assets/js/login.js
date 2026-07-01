document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const banner = document.getElementById('message-banner');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Reset status banner visibility
    banner.className = 'banner-hidden';
    banner.textContent = '';

    // Extract payloads to match backend expectations (email, password)
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      // Direct request payload targeting exact backend auth endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Authenticated successfully
        banner.className = 'banner-success';
        banner.textContent = 'ACCESS GRANTED. INITIALIZING SESSION...';
        
        // Wait briefly so the operator can read the success message before redirecting
        setTimeout(() => {
          window.location.href = '/dashboard'; 
        }, 1500);

      } else {
        // Handled backend rejection (401, 400, etc)
        banner.className = 'banner-error';
        // Displays your custom generic warning or fallback error string
        banner.textContent = `ERROR: ${data.message || 'INVALID CREDENTIALS'}`;
      }

    } catch (error) {
      // Client-side execution or network infrastructure drop
      banner.className = 'banner-error';
      banner.textContent = 'SYSTEM ERROR: CONNECTION TERMINATED.';
      console.error('Auth Request Failure:', error);
    }
  });
});