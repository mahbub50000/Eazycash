const express = require('express');
const crypto = require('crypto');
const session = require('express-session');
const app = express();

const BOT_TOKEN = '7989422304:AAH0f6Sf7N3-LjV73rIuJBFBUw6JH_Tak6w'; // Replace with your Telegram bot token

app.use(session({
  secret: 'd4f7e8a9b3c1d2e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8', // Secure random secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

function checkTelegramAuth(data) {
  const checkHash = data.hash;
  const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const dataCheckString = Object.keys(data)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n');
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return hmac === checkHash;
}

app.get('/auth/telegram/callback', (req, res) => {
  const data = req.query;
  if (!checkTelegramAuth(data)) {
    return res.status(403).send('Invalid Telegram login data');
  }
  // Authentication successful
  req.session.user = data;
  res.send(`Hello, ${data.first_name}! You are logged in.`);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Telegram auth server running on port ${PORT}`);
});
