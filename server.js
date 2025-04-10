// File: ShopWithUs/server.js
const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const path = require('path'); // Added path module
require('dotenv').config();

const app = express();
const port = 3000;

// MongoDB connection URI from environment variable
const uri = "mongodb+srv://h460635:fstDxMwbFaKjiehc@shopwithuscluster.7ydadym.mongodb.net/?retryWrites=true&w=majority&appName=ShopWithUsCluster";
const client = new MongoClient(uri); // Removed deprecated options

let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    db = client.db('shopwithus'); // Database name (adjust if different)
  } catch (err) {
    console.error('Failed to connect to MongoDB Atlas:', err);
    process.exit(1);
  }
}

// Initialize MongoDB connection
connectToMongoDB();

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { prolificId } = req.body;
  const normalizedProlificId = prolificId.trim();
  console.log(`POST /login - Prolific ID: ${prolificId}, Normalized Prolific ID: ${normalizedProlificId}`);

  if (!normalizedProlificId) {
    return res.status(400).json({ error: 'Prolific ID is required' });
  }

  try {
    const usersCollection = db.collection('users');
    let user = await usersCollection.findOne({ prolificId: normalizedProlificId });

    if (!user) {
      user = {
        prolificId: normalizedProlificId,
        cookieResponse: null,
        reportText: null,
        llmConsent: true, // Default LLM consent to true
        timestamp: new Date().toISOString(),
      };
      await usersCollection.insertOne(user);
      console.log(`New user created - Prolific ID: ${normalizedProlificId}`);
    }

    const sessionId = uuidv4();
    await usersCollection.updateOne(
      { prolificId: normalizedProlificId },
      { $set: { sessionId } }
    );

    res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'strict' });
    console.log(`Login successful - Prolific ID: ${normalizedProlificId}, Session ID set: ${sessionId}`);
    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/user-info', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  console.log(`GET /user-info - Session ID: ${sessionId}`);

  if (!sessionId) {
    console.error('No sessionId provided in /user-info request');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ sessionId });

    if (!user) {
      console.error(`User not found for Session ID: ${sessionId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`User found for Prolific ID: ${user.prolificId}`);
    res.json({ prolificId: user.prolificId });
  } catch (err) {
    console.error('Error fetching user info:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/check-consent', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  console.log(`GET /check-consent - Session ID: ${sessionId}`);

  if (!sessionId) {
    console.error('No sessionId provided in /check-consent request');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ sessionId });

    if (!user) {
      console.error(`User not found for Session ID: ${sessionId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const hasConsented = user.cookieResponse !== null;
    console.log(`Check consent for Prolific ID ${user.prolificId}: hasConsented=${hasConsented}, cookieResponse=${user.cookieResponse}, userResponse=${JSON.stringify(user)}`);
    res.json({ hasConsented, userResponse: user });
  } catch (err) {
    console.error('Error checking consent:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/save-consent', async (req, res) => {
  const { prolificId, response, reportText } = req.body;
  const normalizedProlificId = prolificId.trim();
  console.log(`POST /save-consent - Prolific ID: ${prolificId}, Normalized Prolific ID: ${normalizedProlificId}, Response: ${response}, ReportText: ${reportText}`);

  if (!normalizedProlificId || !response) {
    console.error('Missing prolificId or response in /save-consent request');
    return res.status(400).json({ error: 'Prolific ID and response are required' });
  }

  if (normalizedProlificId === 'unknown') {
    console.error('Received "unknown" prolificId, rejecting request');
    return res.status(400).json({ error: 'Invalid prolificId: "unknown" is not allowed' });
  }

  try {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ prolificId: normalizedProlificId });

    if (!user) {
      console.error(`User not found for Prolific ID: ${normalizedProlificId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User before update:', JSON.stringify(user));
    await usersCollection.updateOne(
      { prolificId: normalizedProlificId },
      { $set: { cookieResponse: response, reportText, timestamp: new Date().toISOString() } }
    );
    console.log(`Consent saved for Prolific ID ${normalizedProlificId}: ${response}`);
    res.json({ message: 'Consent saved' });
  } catch (err) {
    console.error('Error saving consent:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/save-llm-consent', async (req, res) => {
  const { prolificId, useData } = req.body;
  const normalizedProlificId = prolificId.trim();
  console.log(`POST /save-llm-consent - Prolific ID: ${prolificId}, Normalized Prolific ID: ${normalizedProlificId}, UseData: ${useData}`);

  try {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ prolificId: normalizedProlificId });

    if (!user) {
      console.error(`User not found for Prolific ID: ${normalizedProlificId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    await usersCollection.updateOne(
      { prolificId: normalizedProlificId },
      { $set: { llmConsent: useData, timestamp: new Date().toISOString() } }
    );

    console.log(`LLM consent saved for Prolific ID ${normalizedProlificId}: ${useData}`);
    res.json({ message: 'LLM consent saved' });
  } catch (err) {
    console.error('Error saving LLM consent:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/get-llm-consent', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  console.log(`GET /get-llm-consent - Session ID: ${sessionId}`);

  if (!sessionId) {
    console.error('No sessionId provided in /get-llm-consent request');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ sessionId });

    if (!user) {
      console.error(`User not found for Session ID: ${sessionId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`LLM consent for Prolific ID ${user.prolificId}: ${user.llmConsent}`);
    res.json({ useData: user.llmConsent });
  } catch (err) {
    console.error('Error fetching LLM consent:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/logout', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  console.log(`GET /logout - Session ID: ${sessionId}`);

  if (sessionId) {
    try {
      const usersCollection = db.collection('users');
      await usersCollection.updateOne(
        { sessionId },
        { $set: { sessionId: null } }
      );
      console.log(`Logout successful - Session ID cleared`);
    } catch (err) {
      console.error('Error during logout:', err.message);
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
