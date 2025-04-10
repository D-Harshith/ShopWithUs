// File: ShopWithUs/server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

const userResponsesFile = path.join(__dirname, 'user_responses.json');

async function readUserResponses() {
  try {
    const data = await fs.readFile(userResponsesFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeUserResponses(responses) {
  try {
    await fs.writeFile(userResponsesFile, JSON.stringify(responses, null, 2));
    console.log('Successfully wrote to user_responses.json');
  } catch (err) {
    console.error('Error writing to user_responses.json:', err.message);
    throw err;
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { prolificId } = req.body;
  const normalizedProlificId = prolificId.trim(); // Normalize prolificId
  console.log(`POST /login - Prolific ID: ${prolificId}, Normalized Prolific ID: ${normalizedProlificId}`);

  if (!normalizedProlificId) {
    return res.status(400).json({ error: 'Prolific ID is required' });
  }

  let responses = await readUserResponses();
  let user = responses.find(r => r.prolificId === normalizedProlificId);

  if (!user) {
    user = {
      prolificId: normalizedProlificId,
      cookieResponse: null,
      reportText: null,
      llmConsent: true, // Default LLM consent to true
      timestamp: new Date().toISOString()
    };
    responses.push(user);
    await writeUserResponses(responses);
    console.log(`New user created - Prolific ID: ${normalizedProlificId}`);
  }

  const sessionId = uuidv4();
  user.sessionId = sessionId;
  await writeUserResponses(responses);

  res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'strict' });
  console.log(`Login successful - Prolific ID: ${normalizedProlificId}, Session ID set: ${sessionId}`);
  res.json({ message: 'Login successful' });
});

app.get('/user-info', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  console.log(`GET /user-info - Session ID: ${sessionId}`);

  if (!sessionId) {
    console.error('No sessionId provided in /user-info request');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const responses = await readUserResponses();
  console.log('Current user responses in /user-info:', JSON.stringify(responses, null, 2));
  const user = responses.find(r => r.sessionId === sessionId);

  if (!user) {
    console.error(`User not found for Session ID: ${sessionId}`);
    return res.status(404).json({ error: 'User not found' });
  }

  console.log(`User found for Prolific ID: ${user.prolificId}`);
  res.json({ prolificId: user.prolificId });
});

app.get('/check-consent', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  console.log(`GET /check-consent - Session ID: ${sessionId}`);

  if (!sessionId) {
    console.error('No sessionId provided in /check-consent request');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const responses = await readUserResponses();
  console.log('Current user responses in /check-consent:', JSON.stringify(responses, null, 2));
  const user = responses.find(r => r.sessionId === sessionId);

  if (!user) {
    console.error(`User not found for Session ID: ${sessionId}`);
    return res.status(404).json({ error: 'User not found' });
  }

  const hasConsented = user.cookieResponse !== null;
  console.log(`Check consent for Prolific ID ${user.prolificId}: hasConsented=${hasConsented}, cookieResponse=${user.cookieResponse}, userResponse=${JSON.stringify(user)}`);
  res.json({ hasConsented, userResponse: user });
});

app.post('/save-consent', async (req, res) => {
  const { prolificId, response, reportText } = req.body;
  const normalizedProlificId = prolificId.trim(); // Normalize prolificId
  console.log(`POST /save-consent - Prolific ID: ${prolificId}, Normalized Prolific ID: ${normalizedProlificId}, Response: ${response}, ReportText: ${reportText}`);

  if (!normalizedProlificId || !response) {
    console.error('Missing prolificId or response in /save-consent request');
    return res.status(400).json({ error: 'Prolific ID and response are required' });
  }

  if (normalizedProlificId === 'unknown') {
    console.error('Received "unknown" prolificId, rejecting request');
    return res.status(400).json({ error: 'Invalid prolificId: "unknown" is not allowed' });
  }

  let responses = await readUserResponses();
  console.log('Current user responses:', JSON.stringify(responses, null, 2));

  let user = responses.find(r => r.prolificId === normalizedProlificId);
  if (!user) {
    console.error(`User not found for Prolific ID: ${normalizedProlificId}`);
    return res.status(404).json({ error: 'User not found' });
  }

  console.log('User before update:', JSON.stringify(user));
  user.cookieResponse = response;
  user.reportText = reportText;
  user.timestamp = new Date().toISOString();
  console.log('User after update:', JSON.stringify(user));

  await writeUserResponses(responses);

  console.log(`Consent saved for Prolific ID ${normalizedProlificId}: ${response}`);
  res.json({ message: 'Consent saved' });
});

app.post('/save-llm-consent', async (req, res) => {
  const { prolificId, useData } = req.body;
  const normalizedProlificId = prolificId.trim(); // Normalize prolificId
  console.log(`POST /save-llm-consent - Prolific ID: ${prolificId}, Normalized Prolific ID: ${normalizedProlificId}, UseData: ${useData}`);

  let responses = await readUserResponses();
  let user = responses.find(r => r.prolificId === normalizedProlificId);

  if (!user) {
    console.error(`User not found for Prolific ID: ${normalizedProlificId}`);
    return res.status(404).json({ error: 'User not found' });
  }

  user.llmConsent = useData;
  user.timestamp = new Date().toISOString();
  await writeUserResponses(responses);

  console.log(`LLM consent saved for Prolific ID ${normalizedProlificId}: ${useData}`);
  res.json({ message: 'LLM consent saved' });
});

app.get('/get-llm-consent', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  console.log(`GET /get-llm-consent - Session ID: ${sessionId}`);

  if (!sessionId) {
    console.error('No sessionId provided in /get-llm-consent request');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const responses = await readUserResponses();
  console.log('Current user responses in /get-llm-consent:', JSON.stringify(responses, null, 2));
  const user = responses.find(r => r.sessionId === sessionId);

  if (!user) {
    console.error(`User not found for Session ID: ${sessionId}`);
    return res.status(404).json({ error: 'User not found' });
  }

  console.log(`LLM consent for Prolific ID ${user.prolificId}: ${user.llmConsent}`);
  res.json({ useData: user.llmConsent });
});

app.get('/logout', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  console.log(`GET /logout - Session ID: ${sessionId}`);

  if (sessionId) {
    let responses = await readUserResponses();
    let user = responses.find(r => r.sessionId === sessionId);
    if (user) {
      user.sessionId = null;
      await writeUserResponses(responses);
      console.log(`Logout successful - Session ID cleared for Prolific ID: ${user.prolificId}`);
    }
  }

  res.clearCookie('sessionId');
  res.redirect('/');
});

app.get('*', (req, res) => {
  console.log(`GET ${req.path} - Session ID: ${req.cookies.sessionId}`);
  res.sendFile(path.join(__dirname, 'public', req.path + '.html'), (err) => {
    if (err) {
      res.status(404).send('Page not found');
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});