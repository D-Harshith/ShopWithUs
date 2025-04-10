// File: ShopWithUs/public/script.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  // Trigger popups immediately on page load for /home
  if (window.location.pathname === '/home') {
    checkAndShowPopups();
  }
  // Update this line to include /account-settings
  if (window.location.pathname === '/home' || window.location.pathname === '/personalization' || window.location.pathname === '/account-settings') loadUserInfo();
  if (window.location.pathname === '/llm-consent') loadLLMConsent();
});

function checkAndShowPopups(attempt = 1, maxAttempts = 5) {
  console.log(`Checking if popups should be shown, attempt ${attempt}`);

  // Only show popups on the home page
  if (window.location.pathname !== '/home') {
    console.log('Not on home page, skipping popup check');
    return;
  }

  console.log('Fetching user info');
  fetch('/user-info', { credentials: 'include' })
    .then(response => {
      console.log('User info response status:', response.status);
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`Failed to fetch user info: ${response.status} - ${text}`);
        });
      }
      return response.json();
    })
    .then(user => {
      console.log('User info:', user);
      if (user.error) {
        console.error('User info error:', user.error);
        if (attempt < maxAttempts) {
          console.log('Retrying user info fetch...');
          setTimeout(() => checkAndShowPopups(attempt + 1, maxAttempts), 1000);
          return;
        } else {
          console.error('User info fetch failed after maximum attempts');
          showErrorMessage(`Failed to fetch user info: ${user.error}. Please try again or log in.`);
          return;
        }
      }
      const prolificId = user.prolificId.trim(); // Normalize prolificId
      console.log('Normalized Prolific ID:', prolificId);

      // Check if the user has already responded to the cookie consent
      fetch('/check-consent', { credentials: 'include' })
        .then(response => {
          console.log('Check consent response status:', response.status);
          if (!response.ok) {
            return response.text().then(text => {
              throw new Error(`Failed to fetch consent status: ${response.status} - ${text}`);
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Consent check response:', data);
          if (data.hasConsented) {
            console.log('User has already responded to cookie consent, checking LLM consent');
            // Check if LLM consent has been provided
            fetch('/get-llm-consent', { credentials: 'include' })
              .then(response => {
                console.log('LLM consent response status:', response.status);
                if (!response.ok) {
                  return response.text().then(text => {
                    throw new Error(`Failed to fetch LLM consent: ${response.status} - ${text}`);
                  });
                }
                return response.json();
              })
              .then(llmData => {
                console.log('LLM consent response:', llmData);
                if (llmData.useData === true || llmData.useData === false) {
                  console.log('User has already responded to LLM consent, skipping popups');
                  return; // Skip both popups if both consents are provided
                } else {
                  // Show LLM popup after a 1-second delay if cookie consent is done but LLM consent is not
                  setTimeout(() => {
                    console.log('Showing LLM popup after 1-second delay');
                    showLLMWarning(prolificId);
                  }, 1000);
                }
              })
              .catch(err => {
                console.error('Error fetching LLM consent:', err.message);
                if (attempt < maxAttempts) {
                  console.log('Retrying LLM consent fetch...');
                  setTimeout(() => checkAndShowPopups(attempt + 1, maxAttempts), 1000);
                  return;
                } else {
                  console.error('LLM consent fetch failed after maximum attempts');
                  showErrorMessage(`Failed to fetch LLM consent: ${err.message}. Please try again or log in.`);
                  return;
                }
              });
          } else {
            // Show the cookie popup after a 1-second delay if no cookie consent yet
            setTimeout(() => {
              console.log('Showing cookie popup for all users after 1-second delay');
              showCookiePopup(prolificId);
            }, 1000);
          }
        })
        .catch(err => {
          console.error('Error checking consent:', err.message);
          if (attempt < maxAttempts) {
            console.log('Retrying consent check...');
            setTimeout(() => checkAndShowPopups(attempt + 1, maxAttempts), 1000);
            return;
          } else {
            console.error('Consent check failed after maximum attempts');
            showErrorMessage(`Failed to fetch consent status: ${err.message}. Please try again or log in.`);
            return;
          }
        });
    })
    .catch(err => {
      console.error('Error fetching user info:', err.message);
      if (attempt < maxAttempts) {
        console.log('Retrying user info fetch...');
        setTimeout(() => checkAndShowPopups(attempt + 1, maxAttempts), 1000);
        return;
      } else {
        console.error('User info fetch failed after maximum attempts');
        showErrorMessage(`Failed to fetch user info: ${err.message}. Please try again or log in.`);
        return;
      }
    });
}

function showErrorMessage(message) {
  console.log('Showing error message:', message);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '10px';
  errorDiv.style.left = '50%';
  errorDiv.style.transform = 'translateX(-50%)';
  errorDiv.style.backgroundColor = '#f44336';
  errorDiv.style.color = 'white';
  errorDiv.style.padding = '10px 20px';
  errorDiv.style.borderRadius = '5px';
  errorDiv.style.zIndex = '1000';
  errorDiv.innerHTML = `
    ${message}
    <button onclick="window.location.href='/';">Log In</button>
    <button onclick="window.location.reload();">Retry</button>
  `;
  document.body.appendChild(errorDiv);
}

function showCookiePopup(prolificId) {
  console.log(`Showing cookie popup for Prolific ID ${prolificId}`);
  const popup = document.createElement('div');
  popup.className = 'popup active';
  popup.innerHTML = `
    <div class="popup-content">
      <h2>Cookies Notice</h2>
      <p>We use cookies to improve your shopping experience on ShopWithUs. Please choose an option below.</p>
      <div class="buttons">
        <button id="accept-consent" class="accept-btn">Accept</button>
        <button id="report-consent" class="report-btn">Report</button>
      </div>
      <div id="reportBox" style="display: none; margin-top: 10px;">
        <textarea id="reportText" placeholder="Why are you reporting?"></textarea>
        <button id="submitReport" class="accept-btn">Submit</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  document.getElementById('accept-consent').addEventListener('click', () => saveConsent(prolificId, 'accept'));
  document.getElementById('report-consent').addEventListener('click', () => {
    document.getElementById('reportBox').style.display = 'block';
    document.getElementById('report-consent').style.display = 'none';
  });
  document.getElementById('submitReport').addEventListener('click', () => {
    const reportText = document.getElementById('reportText').value;
    saveConsent(prolificId, 'report', reportText);
  });
}

function saveConsent(prolificId, response, reportText = null) {
  console.log(`Saving cookie consent for Prolific ID ${prolificId}:`, response, reportText);
  const normalizedProlificId = prolificId.trim(); // Normalize prolificId
  console.log('Normalized Prolific ID for save:', normalizedProlificId);
  const requestBody = JSON.stringify({ prolificId: normalizedProlificId, response, reportText });
  console.log('Request body:', requestBody);

  fetch('/save-consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: requestBody,
    credentials: 'include'
  })
    .then(res => {
      console.log('Save consent response status:', res.status);
      if (!res.ok) {
        return res.text().then(text => {
          throw new Error(`Failed to save consent: ${res.status} - ${text}`);
        });
      }
      return res.json();
    })
    .then(data => {
      console.log('Consent saved successfully:', data);
      document.querySelector('.popup').remove();
      // Show the LLM popup after a 1-second delay
      setTimeout(() => {
        console.log('Showing LLM warning after 1-second delay');
        showLLMWarning(normalizedProlificId);
      }, 1000);
    })
    .catch(err => {
      console.error('Error saving consent:', err.message);
      document.querySelector('.popup').remove();
      // Still show LLM popup after a 1-second delay even if saving fails
      setTimeout(() => {
        console.log('Showing LLM warning after 1-second delay due to error');
        showLLMWarning(normalizedProlificId);
      }, 1000);
    });
}

function showLLMWarning(prolificId) {
  console.log('Showing LLM warning');
  const warning = document.createElement('div');
  warning.className = 'popup active';
  warning.innerHTML = `
    <div class="popup-content">
      <h2>LLM Data Usage</h2>
      <p>If you permit, your data will be <strong>used to train LLM</strong> models.</p>
      <div class="buttons">
        <button id="llm-settings" class="report-btn">Settings</button>
      </div>
    </div>
  `;
  document.body.appendChild(warning);

  document.getElementById('llm-settings').addEventListener('click', () => {
    window.location.href = '/account-settings';
  });
}

function saveLLMConsent(prolificId, useData) {
  console.log(`Saving LLM consent for Prolific ID ${prolificId}:`, useData);
  fetch('/save-llm-consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prolificId, useData }),
    credentials: 'include'
  })
    .then(res => {
      if (!res.ok) {
        return res.text().then(text => {
          throw new Error(`Failed to save LLM consent: ${res.status} - ${text}`);
        });
      }
      console.log('LLM consent saved');
      window.location.href = '/home';
    })
    .catch(err => console.error('Error saving LLM consent:', err));
}

function loadUserInfo() {
  console.log('Loading user info');
  fetch('/user-info', { credentials: 'include' })
    .then(response => {
      console.log('User info response status for loadUserInfo:', response.status);
      if (!response.ok) throw new Error('Failed to fetch user info');
      return response.json();
    })
    .then(data => {
      console.log('User data:', data);
      if (data.error) {
        console.error('User data error:', data.error);
        return;
      }
      const nameElement = document.getElementById('user-name');
      if (nameElement) {
        nameElement.textContent = data.prolificId;
      } else {
        console.error('DOM element for user info not found');
      }
    })
    .catch(err => console.error('Error loading user info:', err));
}

function loadLLMConsent() {
  console.log('Loading LLM consent');
  fetch('/user-info', { credentials: 'include' })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`Failed to fetch user info: ${response.status} - ${text}`);
        });
      }
      return response.json();
    })
    .then(user => {
      const prolificId = user.prolificId;

      document.getElementById('ok-btn').addEventListener('click', () => {
        fetch('/save-llm-consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prolificId, useData: true }),
          credentials: 'include'
        })
          .then(() => {
            window.location.href = '/home';
          })
          .catch(err => console.error('Error confirming LLM consent:', err));
      });

      document.getElementById('opt-out-btn').addEventListener('click', () => {
        showOptOutConfirmation(prolificId);
      });
    })
    .catch(err => console.error('Error fetching user info:', err));
}

function showOptOutConfirmation(prolificId) {
  console.log('Showing opt-out confirmation popup');
  const confirmationPopup = document.createElement('div');
  confirmationPopup.className = 'popup active';
  confirmationPopup.innerHTML = `
    <div class="popup-content">
      <h2>Opt me out of training LLM</h2>
      <p>Are you sure you want to opt out of LLM training?</p>
      <div class="buttons">
        <button id="confirm-opt-out" class="accept-btn">Yes</button>
        <button id="cancel-opt-out" class="opt-out-btn">No</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmationPopup);

  document.getElementById('confirm-opt-out').addEventListener('click', () => {
    saveLLMConsent(prolificId, false);
    document.querySelector('.popup').remove();
  });

  document.getElementById('cancel-opt-out').addEventListener('click', () => {
    document.querySelector('.popup').remove();
  });
}