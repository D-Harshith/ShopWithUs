document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, pathname:', window.location.pathname);

  if (window.location.pathname === '/home') {
    console.log('Initializing home page: popups and shopping');
    checkAndShowPopups();
    initializeShopping();
  }
  if (window.location.pathname === '/home' || window.location.pathname === '/personalization' || window.location.pathname === '/account-settings') {
    console.log('Loading user info for pathname:', window.location.pathname);
    loadUserInfo();
  }
  if (window.location.pathname === '/llm-consent') {
    console.log('Loading LLM consent');
    loadLLMConsent();
  }
});

function initializeShopping() {
  console.log('Initializing shopping functionality');
  const products = document.querySelectorAll('.product');
  const checkoutBtn = document.querySelector('.checkout-btn');
  const selectedProducts = new Set();

  if (!products.length || !checkoutBtn) {
    console.warn('No products or checkout button found');
    return;
  }

  products.forEach(product => {
    product.addEventListener('click', () => {
      const productName = product.getAttribute('data-name');
      if (selectedProducts.has(productName)) {
        selectedProducts.delete(productName);
        product.classList.remove('selected');
        console.log(`Deselected product: ${productName}`);
      } else {
        selectedProducts.add(productName);
        product.classList.add('selected');
        console.log(`Selected product: ${productName}`);
      }
    });
  });

  checkoutBtn.addEventListener('click', () => {
    console.log('Checkout clicked, selected products:', Array.from(selectedProducts));
    const popup = document.createElement('div');
    popup.className = 'popup active';
    const itemsText = selectedProducts.size > 0
      ? Array.from(selectedProducts).map(name => `<div>${name}</div>`).join('')
      : '<div>Empty list</div>';
    popup.innerHTML = `
      <div class="popup-content">
        <h2>Selected Items</h2>
        <div class="items-container">${itemsText}</div>
        <div class="buttons">
          <button id="proceed-btn" class="accept-btn">Proceed</button>
          <button id="return-btn" class="report-btn">Return Home</button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('proceed-btn').addEventListener('click', () => {
      console.log('Navigating to thank-you page');
      window.location.href = '/thank-you';
    });

    document.getElementById('return-btn').addEventListener('click', () => {
      console.log('Returning to home page');
      popup.remove();
    });
  });
}

function checkAndShowPopups(attempt = 1, maxAttempts = 5) {
  console.log(`Checking popups, attempt ${attempt}`);
  if (window.location.pathname !== '/home') {
    console.log('Not on home page, skipping popups');
    return;
  }

  fetch('/user-info', { credentials: 'include' })
    .then(response => {
      console.log('User info response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }
      return response.json();
    })
    .then(user => {
      console.log('User info:', user);
      if (user.error) {
        throw new Error(`User info error: ${user.error}`);
      }
      const prolificId = user.prolificId?.trim() || '';
      console.log('Prolific ID:', prolificId);
      if (!prolificId) {
        throw new Error('No Prolific ID found');
      }

      fetch('/check-consent', { credentials: 'include' })
        .then(response => {
          console.log('Consent check status:', response.status);
          if (!response.ok) {
            throw new Error(`Failed to fetch consent: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Consent data:', data);
          if (data.hasConsented) {
            console.log('Cookie consent given, checking LLM consent');
            fetch('/get-llm-consent', { credentials: 'include' })
              .then(response => {
                console.log('LLM consent status:', response.status);
                if (!response.ok) {
                  throw new Error(`Failed to fetch LLM consent: ${response.status}`);
                }
                return response.json();
              })
              .then(llmData => {
                console.log('LLM consent data:', llmData);
                if (llmData.useData === true || llmData.useData === false) {
                  console.log('LLM consent already given, skipping');
                } else {
                  setTimeout(() => {
                    console.log('Showing LLM popup');
                    showLLMWarning(prolificId);
                  }, 1000);
                }
              })
              .catch(err => {
                console.error('LLM consent error:', err.message);
                handleRetry(attempt, maxAttempts, err.message);
              });
          } else {
            setTimeout(() => {
              console.log('Showing cookie popup');
              showCookiePopup(prolificId);
            }, 1000);
          }
        })
        .catch(err => {
          console.error('Consent check error:', err.message);
          handleRetry(attempt, maxAttempts, err.message);
        });
    })
    .catch(err => {
      console.error('User info error:', err.message);
      handleRetry(attempt, maxAttempts, err.message);
    });
}

function handleRetry(attempt, maxAttempts, message) {
  if (attempt < maxAttempts) {
    console.log(`Retrying, attempt ${attempt + 1}`);
    setTimeout(() => checkAndShowPopups(attempt + 1, maxAttempts), 1000);
  } else {
    console.error('Max attempts reached');
    showErrorMessage(`Failed: ${message}. Please try again or log in.`);
  }
}

function showErrorMessage(message) {
  console.log('Showing error:', message);
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
  console.log(`Showing cookie popup for ID: ${prolificId}`);
  const popup = document.createElement('div');
  popup.className = 'popup active';
  popup.innerHTML = `
    <div class="popup-content">
      <h2>Cookies Notice</h2>
      <p>We use cookies to improve your shopping experience on ShopWithUs.</p>
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
  console.log(`Saving consent for ID ${prolificId}: ${response}`, reportText);
  const body = JSON.stringify({ prolificId, response, reportText });

  fetch('/save-consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    credentials: 'include'
  })
    .then(res => {
      console.log('Save consent status:', res.status);
      if (!res.ok) {
        throw new Error(`Failed to save consent: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log('Consent saved:', data);
      document.querySelector('.popup').remove();
      setTimeout(() => {
        console.log('Showing LLM warning');
        showLLMWarning(prolificId);
      }, 1000);
    })
    .catch(err => {
      console.error('Save consent error:', err.message);
      document.querySelector('.popup').remove();
      setTimeout(() => showLLMWarning(prolificId), 1000);
    });
}

function showLLMWarning(prolificId) {
  console.log('Showing LLM warning');
  const warning = document.createElement('div');
  warning.className = 'popup active';
  warning.innerHTML = `
    <div class="popup-content">
      <h2>LLM Data Usage</h2>
      <p>Your data may be used to train LLM models.</p>
      <div class="buttons">
        <button id="llm-settings" class="report-btn">Settings</button>
      </div>
    </div>
  `;
  document.body.appendChild(warning);

  document.getElementById('llm-settings').addEventListener('click', () => {
    console.log('Navigating to account-settings');
    window.location.href = '/account-settings';
  });
}

function saveLLMConsent(prolificId, useData, toggleResponse) {
  console.log(`Saving LLM consent for ID ${prolificId}: useData=${useData}, toggle=${toggleResponse}`);
  fetch('/save-llm-consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prolificId, useData, toggleResponse }),
    credentials: 'include'
  })
    .then(res => {
      console.log('Save LLM consent status:', res.status);
      if (!res.ok) {
        throw new Error(`Failed to save LLM consent: ${res.status}`);
      }
      console.log('LLM consent saved');
      window.location.href = '/home';
    })
    .catch(err => console.error('Save LLM consent error:', err.message));
}

function loadUserInfo() {
  console.log('Loading user info');
  fetch('/user-info', { credentials: 'include' })
    .then(response => {
      console.log('User info status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }
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
        nameElement.textContent = data.prolificId || 'Unknown';
      } else {
        console.warn('User name element not found');
      }
    })
    .catch(err => console.error('Load user info error:', err.message));
}

function loadLLMConsent() {
  console.log('Loading LLM consent');
  fetch('/user-info', { credentials: 'include' })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }
      return response.json();
    })
    .then(user => {
      const prolificId = user.prolificId?.trim() || '';
      if (!prolificId) {
        console.error('No Prolific ID found');
        return;
      }

      fetch('/get-llm-consent', { credentials: 'include' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch LLM consent: ${response.status}`);
          }
          return response.json();
        })
        .then(llmData => {
          console.log('LLM consent data:', llmData);
          const toggleSwitch = document.getElementById('toggle-response');
          if (toggleSwitch) {
            toggleSwitch.checked = !!llmData.toggleResponse;
          }
        })
        .catch(err => console.error('Fetch LLM consent error:', err.message));

      document.getElementById('ok-btn').addEventListener('click', () => {
        const toggleResponse = document.getElementById('toggle-response').checked;
        saveLLMConsent(prolificId, true, toggleResponse);
      });

      document.getElementById('opt-out-btn').addEventListener('click', () => {
        showOptOutConfirmation(prolificId);
      });
    })
    .catch(err => console.error('Fetch user info error:', err.message));
}

function showOptOutConfirmation(prolificId) {
  console.log('Showing opt-out confirmation');
  const confirmationPopup = document.createElement('div');
  confirmationPopup.className = 'popup active';
  confirmationPopup.innerHTML = `
    <div class="popup-content">
      <h2>Opt Out of LLM Training</h2>
      <p>Are you sure you want to opt out?</p>
      <div class="buttons">
        <button id="cancel-opt-out" class="accept-btn">Cancel</button>
        <button id="confirm-opt-out" class="opt-out-btn">Yes</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmationPopup);

  document.getElementById('cancel-opt-out').addEventListener('click', () => {
    const toggleResponse = document.getElementById('toggle-response').checked;
    saveLLMConsent(prolificId, true, toggleResponse);
    confirmationPopup.remove();
  });

  document.getElementById('confirm-opt-out').addEventListener('click', () => {
    const toggleResponse = document.getElementById('toggle-response').checked;
    saveLLMConsent(prolificId, false, toggleResponse);
    confirmationPopup.remove();
  });
}