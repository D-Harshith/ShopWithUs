document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, pathname:', window.location.pathname);
  console.log('script.js loaded successfully');

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
  if (window.location.pathname === '/personalization') {
    console.log('Initializing personalization hover effects');
    initializePersonalizationHover();
  }
  if (window.location.pathname === '/account-settings') {
    console.log('Initializing account settings hover effects');
    initializeAccountSettingsHover();
  }

  // Disable browser back button
  history.pushState(null, null, window.location.pathname);
  window.onpopstate = function(event) {
    history.pushState(null, null, window.location.pathname);
  };
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
      window.location.href = '/thank Kodi-you';
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

function applyHoverEffect(element, borderColor, logPrefix) {
  element.style.boxSizing = 'border-box';
  element.addEventListener('mouseover', () => {
    console.log(`Mouse over ${logPrefix}`);
    element.style.border = `2px solid ${borderColor}`;
  });
  element.addEventListener('mouseout', () => {
    console.log(`Mouse out ${logPrefix}`);
    element.style.border = 'none';
  });
}

function initializePersonalizationHover() {
  console.log('Setting up hover effects for personalization page');

  const optionCards = document.querySelectorAll('.option-card.clickable');

  if (optionCards.length > 0) {
    console.log(`Found ${optionCards.length} elements with class "option-card clickable"`);
    optionCards.forEach((card, index) => {
      console.log(`Adding hover effects to option-card ${index + 1}:`, {
        tag: card.tagName,
        class: card.className,
        id: card.id,
        text: card.textContent.trim()
      });
      applyHoverEffect(card, 'black', `option-card ${index + 1}`);
    });
  } else {
    console.warn('No elements with class "option-card clickable" found on the personalization page');
  }

  const trainingData = document.querySelector('.training-data');
  if (trainingData) {
    console.log('Training data element found:', {
      tag: trainingData.tagName,
      class: trainingData.className,
      id: trainingData.id,
      text: trainingData.textContent.trim()
    });
    trainingData.addEventListener('mouseover', () => {
      console.log('Mouse over training data');
      trainingData.style.border = '2px solid #ff9900';
    });
    trainingData.addEventListener('mouseout', () => {
      console.log('Mouse out training data');
      trainingData.style.border = 'none';
    });
  } else {
    console.warn('Training data element not found on personalization page');
    const allDivs = document.querySelectorAll('div');
    console.log('All div elements on the personalization page:', Array.from(allDivs).map(div => ({
      class: div.className,
      id: div.id,
      text: div.textContent.trim()
    })));
  }

  const optionCardObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        const newOptionCards = document.querySelectorAll('.option-card.clickable');
        if (newOptionCards.length > 0) {
          console.log(`Found ${newOptionCards.length} new option-card elements via MutationObserver`);
          newOptionCards.forEach((card, index) => {
            if (!card.dataset.hoverApplied) {
              applyHoverEffect(card, 'black', `option unveils-card ${index + 1}`);
              card.dataset.hoverApplied = 'true';
            }
          });
        }
      }
    });
  });

  optionCardObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function initializeAccountSettingsHover() {
  console.log('Setting up hover effects for account settings page');

  const personalizationCards = document.querySelectorAll('.option-card.clickable');

  if (personalizationCards.length > 0) {
    console.log(`Found ${personalizationCards.length} elements with class "option-card clickable" on account settings page`);
    personalizationCards.forEach((card, index) => {
      console.log(`Adding hover effects to personalization card ${index + 1}:`, {
        tag: card.tagName,
        class: card.className,
        id: card.id,
        text: card.textContent.trim()
      });
      if (card.textContent.trim().includes('Personalization')) {
        applyHoverEffect(card, 'black', `personalization card ${index + 1}`);
      }
    });
  } else {
    console.warn('No elements with class "option-card clickable" found on the account settings page');
    const allDivs = document.querySelectorAll('div');
    console.log('All div elements on the page:', Array.from(allDivs).map(div => ({
      class: div.className,
      id: div.id,
      text: div.textContent.trim()
    })));
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        const newCards = document.querySelectorAll('.option-card.clickable');
        if (newCards.length > 0) {
          console.log(`Found ${newCards.length} new option-card elements via MutationObserver on account settings page`);
          newCards.forEach((card, index) => {
            if (!card.dataset.hoverApplied && card.textContent.trim().includes('Personalization')) {
              applyHoverEffect(card, 'black', `personalization card ${index + 1}`);
              card.dataset.hoverApplied = 'true';
            }
          });
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
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
            console.log('User has consented, checking LLM consent');
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
                if (llmData.toggleResponse === undefined || llmData.toggleResponse === null) {
                  setTimeout(() => {
                    console.log('Showing LLM popup');
                    showLLMWarning(prolificId);
                  }, 1000);
                } else {
                  console.log('LLM consent decision already made, skipping popup');
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
      <h2 style="font-size: 2em; text-align: center;">Cookies Notice</h2>
      <p style="font-size: 0.9em; text-align: left;">We and our partners store and access information on a device, such as cookies and process personal data, such as unique identifiers and standard information sent by a device for personalized ads and content, ad and content measurement, and audience insights, as well as to develop and improve products.</p>
      <p style="font-size: 0.9em; text-align: left;">With your permission we and our partners use precise geolocation data and identification through device scanning. You may click to consent to our and our partners' processing as described above. Alternatively you may access more detailed information and change your preferences before consenting.</p>
      <p style="font-size: 0.9em; text-align: left;">Please note that some processing of your personal data may not require your consent, but you have a right to object to such processing. Your preferences will apply to this website only. You can change your preferences at any time by returning to this site or visit our privacy policy.</p>
      <div class="buttons" style="text-align: center;">
        <button id="agree-consent" class="accept-btn">Agree</button>
        <button id="more-options" class="accept-btn" style="color: #ff9900; text-decoration: none; border: 1px solid orange; background: transparent;">More Options</button>
      </div>
      <div id="reportBox" style="display: none; margin-top: 10px;">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
          <textarea id="reportText" placeholder="We value your feedback. Please let us know how we can improve your experience" style="width: 300px; height: 150px; min-height: 100px; padding: 10px; font-size: 14px; text-decoration: none; resize: vertical;"></textarea>
          <div class="buttons" style="margin-top: 10px; text-align: center;">
            <button id="agree-consent-report" class="accept-btn">Agree</button>
            <button id="submitReport" class="accept-btn" style="color: #ff9900; text-decoration: none; border: 1px solid orange; background: transparent;">Report</button>
          </div>
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
      
      if (response === 'report') {
        const thankYouPopup = document.createElement('div');
        thankYouPopup.className = 'popup active';
        thankYouPopup.innerHTML = `
          <div class="popup-content" style="text-align: center;">
            <h2>Thank you for your input.</h2>
          </div>
        `;
        document.body.appendChild(thankYouPopup);
        
        setTimeout(() => {
          thankYouPopup.remove();
          setTimeout(() => {
            console.log('Showing LLM warning after report');
            showLLMWarning(prolificId);
          }, 1000);
        }, 3000);
      } else {
        setTimeout(() => {
          console.log('Showing LLM warning');
          showLLMWarning(prolificId);
        }, 1000);
      }
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
      <h2 style="text-align: center;">LLM Optimizing Techniques for On-Device Deployment</h2>
      <div style="display: flex; flex-wrap: wrap; justify-content: space-around; margin-top: 20px;">
        <div style="width: 45%; margin-bottom: 20px; text-align: center;">
          <div style="background-color: #ff9900; border-radius: 50%; width: 60px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-brain" style="color: white; font-size: 30px;"></i>
          </div>
          <h2 style="color: #ff9900; margin-top: 10px;">Training</h2>
          <p>We use your voice, image, log, and usage data to train the models that power AI chatbots</p>
        </div>
        <div style="width: 45%; margin-bottom: 20px; text-align: center;">
          <div style="background-color: #d3d3d3; border-radius: 50%; width: 60px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-tree" style="color: white; font-size: 30px;"></i>
          </div>
          <h2 style="color: #ff9900; margin-top: 10px;">Pruning</h2>
          <p>We eliminate unnecessary neurons from a neural network to streamline our models</p>
        </div>
        <div style="width: 45%; margin-bottom: 20px; text-align: center;">
          <div style="background-color: #90ee90; border-radius: 50%; width: 60px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-users" style="color: white; font-size: 30px;"></i>
          </div>
          <h2 style="color: #ff9900; margin-top: 10px;">Human Review</h2>
          <p>Humans review a small sample of your content to help AI chatbots interpret your requests</p>
        </div>
        <div style="width: 45%; margin-bottom: 20px; text-align: center;">
          <div style="background-color: #87ceeb; border-radius: 50%; width: 60px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-cog" style="color: white; font-size: 30px;"></i>
          </div>
          <h2 style="color: #ff9900; margin-top: 10px;">Monitoring & Evaluation</h2>
          <p>We continually monitor and evaluate LLM accuracy for safety and compliance</p>
        </div>
      </div>
      <div class="buttons" style="text-align: center;">
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

function saveLLMConsent(prolificId, useData, toggleResponse, redirect = true) {
  console.log(`Saving LLM consent for ID ${prolificId}: useData=${useData}, toggle=${toggleResponse}, redirect=${redirect}`);
  return fetch('/save-llm-consent', {
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
      if (redirect) {
        window.location.href = '/home';
      }
      return res.json();
    })
    .catch(err => {
      console.error('Save LLM consent error:', err.message);
      if (redirect) {
        window.location.href = '/home';
      }
      throw err;
    });
}

function saveLLMReport(prolificId, reportText, toggleResponse) {
  console.log(`Saving LLM report for ID ${prolificId}: reportText=${reportText}, toggleResponse=${toggleResponse}`);
  console.log('Request body being sent:', { prolificId, reportText, toggleResponse });
  const body = JSON.stringify({ prolificId, reportText, toggleResponse });

  return fetch('/save-llm-report', {
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
    })
    .catch(err => {
      console.error('Save LLM report or consent error:', err.message);
      throw err;
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
            toggleSwitch.checked = true;
            toggleSwitch.disabled = true;
            console.log('Toggle set to', toggleSwitch.checked, 'and disabled');
          } else {
            console.warn('Toggle switch element not found');
          }
        })
        .catch(err => console.error('Fetch LLM consent error:', err.message));

      const okBtn = document.getElementById('ok-btn');
      if (okBtn) {
        okBtn.addEventListener('click', () => {
          const toggleSwitch = document.getElementById('toggle-response');
          const useData = toggleSwitch ? toggleSwitch.checked : true;
          console.log('OK button clicked, toggleResponse:', useData);
          saveLLMConsent(prolificId, useData, useData);
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
        reportBtn.style.color = '#ff9900';
        reportBtn.style.textDecoration = 'none';

        reportTextElement.style.width = '75%';
        reportTextElement.style.minHeight = '100px';
        reportTextElement.style.resize = 'vertical';

        reportBox.style.display = 'none';
        reportBox.style.displayFlex = 'flex';
        reportBox.style.flexDirection = 'column';
        reportBox.style.alignItems = 'center';
        reportBox.style.gap = '10px';

        backBtn.style.color = 'white';
        backBtn.style.textDecoration = 'none';
        submitReportBtn.style.color = '#ff9900';
        submitReportBtn.style.textDecoration = 'none';
        submitReportBtn.style.border = '1px solid orange';

        reportBtn.addEventListener('click', () => {
          console.log('Showing report box on LLM consent page');
          reportBox.style.display = 'flex';
          reportBtn.style.display = 'none';
          if (okBtn) okBtn.style.display = 'none';
          if (optOutBtn) optOutBtn.style.display = 'none';
        });

        backBtn.addEventListener('click', () => {
          console.log('Hiding report box on LLM consent page');
          reportBox.style.display = 'none';
          reportBtn.style.display = 'block';
          if (okBtn) okBtn.style.display = 'block';
          if (optOutBtn) optOutBtn.style.display = 'block';
        });

        submitReportBtn.addEventListener('click', (event) => {
          event.preventDefault();
          console.log('Submit report button clicked');
          reportLLMText = reportTextElement.value.trim();
          console.log('Toggle state before submitting report:', document.getElementById('toggle-response').checked);
          if (!reportLLMText) {
            console.warn('No report text entered');
          }
          
          saveLLMReport(prolificId, reportLLMText, true)
            .then(() => {
              const thankYouPopup = document.createElement('div');
              thankYouPopup.className = 'popup active';
              thankYouPopup.innerHTML = `
                <div class="popup-content" style="text-align: center;">
                  <h2>Thank you for your input.</h2>
                </div>
              `;
              document.body.appendChild(thankYouPopup);

              setTimeout(() => {
                thankYouPopup.remove();
                reportBox.style.display = 'none';
                if (okBtn) okBtn.style.display = 'block';
                if (optOutBtn) optOutBtn.style.display = 'block';
                reportBtn.style.display = 'none';
              }, 3000);
            })
            .catch(err => {
              console.error('Error during report submission:', err.message);
              const thankYouPopup = document.createElement('div');
              thankYouPopup.className = 'popup active';
              thankYouPopup.innerHTML = `
                <div class="popup-content" style="text-align: center;">
                  <h2>Thank you for your input.</h2>
                </div>
              `;
              document.body.appendChild(thankYouPopup);

              setTimeout(() => {
                thankYouPopup.remove();
                reportBox.style.display = 'none';
                if (okBtn) okBtn.style.display = 'block';
                if (optOutBtn) optOutBtn.style.display = 'block';
                reportBtn.style.display = 'none';
              }, 3000);
            });
        });

        window.addEventListener('beforeunload', () => {
          const currentText = reportTextElement.value.trim();
          console.log(`Before unload - toggleResponse: true, unsaved report text: ${currentText}`);
          if (currentText && currentText !== reportLLMText) {
            console.log('User navigating away with unsaved report text:', currentText);
            saveLLMReport(prolificId, currentText, true);
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
      <h2>Help improve ShopWithUs services and develop new AI features</h2>
      <p>If you opt out, personalization and new features may not work well for you.</p>
      <div class="buttons">
        <button id="cancel-opt-out" class="accept-btn">Cancel</button>
        <button id="confirm-opt-out" class="opt-out-btn">Turn Off</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmationPopup);

  document.getElementById('cancel-opt-out').addEventListener('click', () => {
    console.log('Cancel opt-out clicked, keeping toggle on');
    const toggleSwitch = document.getElementById('toggle-response');
    if (toggleSwitch) {
      toggleSwitch.checked = true;
    }
    confirmationPopup.remove();
  });

  document.getElementById('confirm-opt-out').addEventListener('click', () => {
    console.log('Confirm opt-out clicked, turning toggle off');
    const toggleSwitch = document.getElementById('toggle-response');
    if (toggleSwitch) {
      toggleSwitch.checked = false;
      saveLLMConsent(prolificId, false, false, false);
    } else {
      saveLLMConsent(prolificId, false, false, false);
    }
    confirmationPopup.remove();
  });
}