const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const path = require('path'); // Add this line

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your MongoDB Atlas connection string
const uri = 'mongodb+srv://shopwithusadmin:securepassword123@shopwithuscluster.7ydadym.mongodb.net/?retryWrites=true&w=majority&appName=ShopWithUsCluster';
const client = new MongoClient(uri);

let db;
async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('shopwithus');
  }
  return db;
}

app.use(bodyParser.json());
app.use(express.static('public'));

let loggedInUsers = {};

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

app.get('/home', (req, res) => {
  const sessionId = req.headers.cookie?.split('sessionId=')[1];
  if (sessionId && loggedInUsers[sessionId]) {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/account-settings', (req, res) => {
  const sessionId = req.headers.cookie?.split('sessionId=')[1];
  if (sessionId && loggedInUsers[sessionId]) {
    res.sendFile(path.join(__dirname, 'public', 'account-settings.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/user-info', async (req, res) => {
  const sessionId = req.headers.cookie?.split('sessionId=')[1];
  if (sessionId && loggedInUsers[sessionId]) {
    const username = loggedInUsers[sessionId];
    const db = await connectDB();
    const user = await db.collection('users').findOne({ username });
    if (user) {
      res.status(200).json({ name: user.name, username: user.username });
    } else {
      res.status(404).send({ error: 'User not found.' });
    }
  } else {
    res.status(401).send({ error: 'Not authenticated.' });
  }
});

app.get('/check-consent', async (req, res) => {
  const sessionId = req.headers.cookie?.split('sessionId=')[1];
  if (sessionId && loggedInUsers[sessionId]) {
    const username = loggedInUsers[sessionId];
    const db = await connectDB();
    const consent = await db.collection('user_data').findOne({ username });
    res.status(200).json({ hasConsented: !!consent });
  } else {
    res.status(401).send({ error: 'Not authenticated.' });
  }
});

app.post('/signup', async (req, res) => {
  const { name, username, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.status(400).send({ error: 'Passwords do not match.' });
  }

  const db = await connectDB();
  const usersCollection = db.collection('users');
  if (await usersCollection.findOne({ username })) {
    return res.status(400).send({ error: 'Username already exists.' });
  }

  await usersCollection.insertOne({ name, username, password });
  const sessionId = Math.random().toString(36).substr(2, 9);
  loggedInUsers[sessionId] = username;
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/`);
  res.status(200).send({ message: 'Account created!' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = await connectDB();
  const user = await db.collection('users').findOne({ username, password });
  if (!user) {
    return res.status(401).send({ error: 'Invalid credentials.' });
  }

  const sessionId = Math.random().toString(36).substr(2, 9);
  loggedInUsers[sessionId] = username;
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/`);
  res.status(200).send({ message: 'Login successful!' });
});

app.post('/save-consent', async (req, res) => {
  const { username, response } = req.body;
  const db = await connectDB();
  await db.collection('user_data').insertOne({ username, response, timestamp: new Date().toISOString() });
  res.status(200).send({ message: 'Consent saved!' });
});

app.get('/logout', (req, res) => {
  const sessionId = req.headers.cookie?.split('sessionId=')[1];
  if (sessionId && loggedInUsers[sessionId]) {
    delete loggedInUsers[sessionId];
    res.setHeader('Set-Cookie', 'sessionId=; Max-Age=0; Path=/');
  }
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
