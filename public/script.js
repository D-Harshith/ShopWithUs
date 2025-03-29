document.addEventListener('DOMContentLoaded', () => {
  // Signup form
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const username = document.getElementById('signup-username').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;

      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }

      const response = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password, confirmPassword }),
        credentials: 'include', // Ensure cookies are sent
      });

      if (response.ok) {
        window.location.href = '/home';
      } else {
        const result = await response.json();
        alert(result.error);
      }
    });
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (response.ok) {
        window.location.href = '/home';
      } else {
        const result = await response.json();
        alert(result.error);
      }
    });
  }

  // Cookie consent popup on home page (one-time)
  const cookiePopup = document.getElementById('cookie-consent');
  if (cookiePopup) {
    fetch('/check-consent', { 
      method: 'GET',
      credentials: 'include' // Ensure cookies are sent with request
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to check consent');
        return response.json();
      })
      .then((data) => {
        console.log('Consent check response:', data); // Debug log
        if (!data.hasConsented) {
          cookiePopup.classList.add('active');
          console.log('Showing cookie popup'); // Debug log

          const acceptBtn = document.getElementById('accept-consent');
          const reportBtn = document.getElementById('report-consent');

          acceptBtn.addEventListener('click', async () => {
            await saveConsent('accept');
            cookiePopup.classList.remove('active');
          });

          reportBtn.addEventListener('click', async () => {
            await saveConsent('report');
            cookiePopup.classList.remove('active');
          });
        }
      })
      .catch((err) => console.error('Error checking consent:', err));
  }

  // Fetch and display user info on account settings page
  const userNameSpan = document.getElementById('user-name');
  const userUsernameSpan = document.getElementById('user-username');
  if (userNameSpan && userUsernameSpan) {
    fetch('/user-info', {
      method: 'GET',
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        userNameSpan.textContent = data.name;
        userUsernameSpan.textContent = data.username;
      })
      .catch((err) => console.error('Error fetching user info:', err));
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      fetch('/logout', { credentials: 'include' })
        .then(() => {
          window.location.href = '/';
        });
    });
  }

  // Function to save consent response
  async function saveConsent(response) {
    const username = await fetch('/user-info', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => data.username);
    await fetch('/save-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, response }),
      credentials: 'include',
    });
  }
});