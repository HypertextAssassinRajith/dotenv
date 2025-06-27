require('dotenv').config();
const express = require('express');
const cors = require('cors');
const envRoutes = require('./routes/envRoutes');
const path = require('path');
const bodyParser = require('body-parser');
const { saveEnvFile, getEnvFile } = require('./utils/fileHandler');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const ALLOWED_EMAIL = 'sanjayasenanayaka033@gmail.com';

// --- Session and Passport setup ---
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'envsyncsecret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://dotenv-vault.fly.dev/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  if (profile.emails && profile.emails[0].value === ALLOWED_EMAIL) {
    return done(null, { email: profile.emails[0].value, name: profile.displayName });
  }
  return done(null, false, { message: 'Unauthorized email' });
}));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated() && req.user && req.user.email === ALLOWED_EMAIL) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// --- Auth routes ---
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/?login=fail' }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/api/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

app.get('/api/user', (req, res) => {
  if (req.isAuthenticated() && req.user && req.user.email === ALLOWED_EMAIL) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

app.use('/env', envRoutes);

// --- Protect API endpoints ---
app.use('/api/env', ensureAuthenticated);

// API to get env file
app.get('/api/env/:project', async (req, res) => {
  const content = await getEnvFile(req.params.project);
  if (content === null) return res.status(404).send('Not found');
  res.send(content);
});

// API to save env file
app.post('/api/env/:project', async (req, res) => {
  await saveEnvFile(req.params.project, req.body.content || '');
  res.sendStatus(200);
});

// API to delete env file
app.delete('/api/env/:project', async (req, res) => {
  const storeDir = path.join(__dirname, '.env_store');
  const file = path.join(storeDir, `${req.params.project}.env`);
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  try {
    fs.unlinkSync(file);
    res.sendStatus(200);
  } catch (e) {
    res.status(500).send('Failed to delete');
  }
});

// List available env files
app.get('/api/env', (req, res) => {
  const storeDir = path.join(__dirname, '.env_store');
  if (!fs.existsSync(storeDir)) return res.json([]);
  const files = fs.readdirSync(storeDir)
    .filter(f => f.endsWith('.env'))
    .map(f => f.replace(/\.env$/, ''));
  res.json(files);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 .env sync server running on port ${PORT}`);
});
