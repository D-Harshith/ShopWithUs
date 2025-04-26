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

function logActionTime(action) {
  const now = new Date();
  const timeString = now.toISOString();
  console.log(`${action} clicked at: ${timeString}`);
}

function initializeShopping() {
  console.log('Initializing shopping functionality');
  const products = document.querySelectorAll('.product');
  const checkoutBtn = document.querySelector('#checkout-btn');
  const notInterestedBtn = document.querySelector('#not-interested-btn');
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
    const existingPopup = document.querySelector('.popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.className = 'popup active';
    const itemsList = selectedProducts.size > 0
      ? Array.from(selectedProducts).map(name => `<li>${name}</li>`).join('')
      : '<li>No items selected</li>';
    popup.innerHTML = `
      <div class="popup-content">
        <h2>Selected Items</h2>
        <div class="items-container">
          <ol>${itemsList}</ol>
        </div>
        <div class="buttons">
          <button id="proceed-btn" class="accept-btn">Proceed</button>
          <button id="return-btn" class="report-btn">Return Home</button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('proceed-btn').addEventListener('click', () => {
      logActionTime('Proceed');
      console.log('Navigating to thank-you page');
      window.location.href = '/thank-you';
    });

    document.getElementById('return-btn').addEventListener('click', () => {
      console.log('Returning to home page');
      popup.remove();
    });
  });

  if (notInterestedBtn) {
    notInterestedBtn.addEventListener('click', () => {
      logActionTime('Not Interested');
      console.log('User not interested, navigating to thank-you page');
      window.location.href = '/thank-you';
    });
  } else {
    console.warn('Not interested button not found on home page');
  }
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
            console.log(' baseman, checking LLM consent');
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
      <p>We and our partners store and/or access information on a device, such as cookies and process personal data, such as unique identifiers and standard information sent by a device for personalised ads and content, ad and content measurement, and audience insights, as well as to develop and improve products.</p>
      <p>With your permission we and our partners may use precise geolocation data and identification through device scanning. You may click to consent to our and our partners' processing as described above. Alternatively you may access more detailed information and change your preferences before consenting or to refuse consenting.</p>
      <p>Please note that some processing of your personal data may not require your consent, but you have a right to object to such processing. Your preferences will apply to this website only. You can change your preferences at any time by returning to this site or visit our privacy policy.</p>
      <div class="buttons">
        <button id="agree-consent" class="accept-btn">Agree</button>
        <button id="more-options" class="accept-btn">More Options</button>
      </div>
      <div id="reportBox" style="display: none; margin-top: 10px;">
        <textarea id="reportText" placeholder="We value your feedback. Please let us know how we can improve your experience" style="width: 100%; height: 100px; padding: 10px; font-size: 14px; text-decoration: none;"></textarea>
        <div class="buttons" style="margin-top: 10px;">
          <button id="agree-consent-report" class="accept-btn">Agree</button>
          <button id="submitReport" class="accept-btn">Report</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  const agreeButtons = document.querySelectorAll('#agree-consent, #agree-consent-report');
  agreeButtons.forEach(button => {
    button.addEventListener('click', () => saveConsent(prolificId, 'agree'));
  });

  document.getElementById('more-options').addEventListener('click', () => {
    console.log('Showing report box');
    document.getElementById('reportBox').style.display = 'block';
    document.getElementById('more-options').style.display = 'none';
    document.getElementById('agree-consent').style.display = 'none';
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
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
      <h2>LLM Optimizing Techniques for On-Device Deployment</h2>
      <div style="display: flex; flex-wrap: wrap; justify-content: space-around; margin-top: 20px;">
        <div style="width: 45%; margin-bottom: 20px; text-align: center;">
          <div style="background-color: #ff9900; border-radius: 50%; width: 60px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-brain" style="color: white; font-size: 30px;"></i>
          </div>
          <h3 style="color: #ff9900; margin-top: 10px;">Quantization</h3>
          <p>Converts data to lower precision, reducing size and boosting speed</p>
        </div>
        <div style="width: 45%; margin-bottom: 20px; text-align: center;">
          <div style="background-color: #d3d3d3; border-radius: 50%; width: 60px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-tree" style="color: white; font-size: 30px;"></i>
          </div>
          <h3 style="color: #ff9900; margin-top: 10px;">Pruning</h3>
          <p>Eliminates unnecessary neurons from a neural network, streamlining the model</p>
        </div>
        <div style="width: 45%; margin-bottom: 20px; text-align: center;">
          <div style="background-color: #90ee90; border-radius: 50%; width: 60px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-users" style="color: white; font-size: 30px;"></i>
          </div>
          <h3 style="color: #ff9900; margin-top: 10px;">Knowledge Distillation</h3>
          <p>Trains a smaller model to perform like a larger one, optimizing efficiency</p>
        </div>
        <div style="width: 45%; margin-bottom: 20px; text-align: center;">
          <div style="background-color: #87ceeb; border-radius: 50%; width: 60px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-cog" style="color: white; font-size: 30px;"></i>
          </div>
          <h3 style="color: #ff9900; margin-top: 10px;">LoRA</h3>
          <p>Simplifies matrices, maintaining performance with fewer parameters</p>
        </div>
      </div>
      <div class="buttons">
        <button id="llm-settings" class="accept-btn">Settings</button>
      </div>
    </div>
  `;
  document.body.appendChild(warning);

  document.getElementById('llm-settings').addEventListener('click', () => {
    console.log('Navigating to Your Account page');
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
    .catch(err => {
      console.error('Save LLM consent error:', err.message);
      window.location.href = '/home';
    });
}

function saveLLMReport(prolificId, reportText, toggleResponse) {
  console.log(`Saving LLM report for ID ${prolificId}: reportText=${reportText}, toggleResponse=${toggleResponse}`);
  console.log('Request body being sent:', { prolificId, reportText, toggleResponse });
  const body = JSON.stringify({ prolificId, reportText, toggleResponse });

  fetch('/save-llm-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    credentials: 'include'
  })
    .then(res => {
      console.log('Save LLM report status:', res.status);
      if (!res.ok) {
        console.error('Failed to save LLM report:', res.status, res.statusText);
        return res.text().then(text => {
          throw new Error(`Failed to save LLM report: ${res.status} - ${text}`);
        });
      }
      return res.json();
    })
    .then(data => {
      console.log('LLM report saved, server response:', data);
      // After saving the report, also save the toggleResponse to ensure it's updated
      return fetch('/save-llm-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prolificId, useData: true, toggleResponse }),
        credentials: 'include'
      });
    })
    .then(res => {
      console.log('Save LLM consent after report status:', res.status);
      if (!res.ok) {
        throw new Error(`Failed to save LLM consent after report: ${res.status}`);
      }
      console.log('LLM consent saved after report');
      window.location.href = '/home';
    })
    .catch(err => {
      console.error('Save LLM report or consent error:', err.message);
      window.location.href = '/home';
    });
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

let reportLLMText = '';

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
            console.log(`Initial toggle state set to: ${toggleSwitch.checked}`);
          } else {
            console.warn('Toggle switch element not found');
          }
        })
        .catch(err => console.error('Fetch LLM consent error:', err.message));

      const okBtn = document.getElementById('ok-btn');
      if (okBtn) {
        okBtn.addEventListener('click', () => {
          const toggleSwitch = document.getElementById('toggle-response');
          const toggleResponse = toggleSwitch ? toggleSwitch.checked : false;
          console.log(`OK button clicked, toggleResponse: ${toggleResponse}`);
          saveLLMConsent(prolificId, true, toggleResponse);
        });
      } else {
        console.error('OK button not found');
      }

      const optOutBtn = document.getElementById('opt-out-btn');
      if (optOutBtn) {
        optOutBtn.addEventListener('click', () => {
          console.log('Opt-out button clicked');
          showOptOutConfirmation(prolificId);
        });
      } else {
        console.error('Opt-out button not found');
      }

      const reportBtn = document.getElementById('report-btn');
      const reportBox = document.getElementById('reportBox');
      const backBtn = document.getElementById('back-btn');
      const submitReportBtn = document.getElementById('submit-report');
      const reportTextElement = document.getElementById('reportText');

      console.log('LLM consent page elements:', {
        reportBtn: !!reportBtn,
        reportBox: !!reportBox,
        backBtn: !!backBtn,
        submitReportBtn: !!submitReportBtn,
        reportTextElement: !!reportTextElement
      });

      if (reportBtn && reportBox && backBtn && submitReportBtn && reportTextElement) {
        reportBtn.addEventListener('click', () => {
          console.log('Showing report box on LLM consent page');
          reportBox.style.display = 'block';
          reportBtn.style.display = 'none';
        });

        backBtn.addEventListener('click', () => {
          console.log('Hiding report box on LLM consent page');
          reportBox.style.display = 'none';
          reportBtn.style.display = 'block';
        });

        submitReportBtn.addEventListener('click', (event) => {
          event.preventDefault();
          console.log('Submit report button clicked');
          reportLLMText = reportTextElement.value.trim();
          const toggleSwitch = document.getElementById('toggle-response');
          const toggleResponse = toggleSwitch ? toggleSwitch.checked : false;
          console.log(`Toggle state before submitting report: ${toggleResponse}`);
          if (!reportLLMText) {
            console.warn('No report text entered');
          } else {
            console.log(`Captured reportLLMText: "${reportLLMText}"`);
            console.log(`Submitting report for LLM consent: reportText=${reportLLMText}, toggleResponse=${toggleResponse}`);
            saveLLMReport(prolificId, reportLLMText, toggleResponse);
          }
          reportBox.style.display = 'none';
          reportBtn.style.display = 'block';
        });

        window.addEventListener('beforeunload', () => {
          const currentText = reportTextElement.value.trim();
          const toggleSwitch = document.getElementById('toggle-response');
          const toggleResponse = toggleSwitch ? toggleSwitch.checked : false;
          console.log(`Before unload - toggleResponse: ${toggleResponse}, unsaved report text: ${currentText}`);
          if (currentText && currentText !== reportLLMText) {
            console.log('User navigating away with unsaved report text:', currentText);
            saveLLMReport(prolificId, currentText, toggleResponse);
          }
        });
      } else {
        console.error('Required elements for LLM report not found:', {
          reportBtn: !!reportBtn,
          reportBox: !!reportBox,
          backBtn: !!backBtn,
          submitReportBtn: !!submitReportBtn,
          reportTextElement: !!reportTextElement
        });
      }
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
    const toggleSwitch = document.getElementById('toggle-response');
    const toggleResponse = toggleSwitch ? toggleSwitch.checked : false;
    console.log(`Cancel opt-out clicked, toggleResponse: ${toggleResponse}`);
    saveLLMConsent(prolificId, true, toggleResponse);
    confirmationPopup.remove();
  });

  document.getElementById('confirm-opt-out').addEventListener('click', () => {
    const toggleSwitch = document.getElementById('toggle-response');
    const toggleResponse = toggleSwitch ? toggleSwitch.checked : false;
    console.log(`Confirm opt-out clicked, toggleResponse: ${toggleResponse}`);
    saveLLMConsent(prolificId, false, toggleResponse);
    confirmationPopup.remove();
  });
}