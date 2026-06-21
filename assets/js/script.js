/* ==========================================================================
   TERMINAL INTERFACE ENGINE - HACKER'S HANGOUT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Target the contact a hacker form element
  const hackerForm = document.querySelector('#contact-a-hacker form');

  if (!hackerForm) return; // Safety exit if form isn't on the page

  // 2. Intercept the submission signal
  hackerForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Stops browser from reloading the page automatically

    // 3. Extract the form data values
    const codename = document.getElementById('full-name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone-number').value;
    const message = document.getElementById('message').value;

    // 4. Create a temporary visual terminal log on the button
    const submitBtn = hackerForm.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'TRANSMITTING SIGNAL...';
    submitBtn.style.borderColor = 'var(--neon-pink)';
    submitBtn.style.color = 'var(--neon-pink)';

    // 5. Route payload directly to your local Node.js server engine
    fetch('/api/transmit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullName: codename,
        email: email,
        phoneNumber: phone,
        message: message
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'SUCCESS') {
        // Log secure transaction directly to browser developer console using backticks
        console.log(`[SIGNAL RECEIVED] From: ${codename} | Channel: ${email} | Node Link Verified.`);

        // Replace the inside of the form with a localized terminal readout confirmation
        hackerForm.innerHTML = `
          <div class="terminal-success" style="text-align: center; padding: 20px; font-family: var(--font-terminal);">
            <h3 style="color: var(--neon-green); text-shadow: var(--neon-glow); margin-bottom: 15px;">
              [*] SIGNAL TRANSMITTED SUCCESSFULLY
            </h3>
            <p style="color: var(--text-primary); margin-bottom: 20px; font-size: 0.95rem;">
              Connection established over secure nodes. Operator <span style="color: var(--neon-blue); font-weight: bold;">${codename}</span>, your encrypted message packet has been verified by server node <span style="color: var(--neon-pink); font-weight: bold;">${data.node}</span>.
            </p>
            <div style="font-size: 0.8rem; color: var(--text-muted); border-top: 1px dashed #1a2333; padding-top: 15px;">
              TIMESTAMP: ${new Date().toISOString()} <br>
              STATUS: 200 OK // LINK STABLE
            </div>
          </div>
        `;
      }
    })
    .catch(error => {
      console.error('[CRITICAL FAILURE] Transmission jammed:', error);
      submitBtn.disabled = false;
      submitBtn.textContent = 'RETRANSMIT SIGNAL';
    });
  });
});
