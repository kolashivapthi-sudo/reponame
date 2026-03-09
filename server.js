import express from 'express';
import session from 'express-session';
import multer from 'multer';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Google OAuth Config
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  return done(null, { email, profile });
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Storage setup
const uploadDir = join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

// Data store
const users = {
  uploaders: []
};
const notes = [];
const userPreferences = {}; // Store favorites and highlights per user

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'notes-secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static('uploads'));

// Auth middleware
const auth = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// Parse student email
const parseEmail = (email) => {
  if (email === 'kolashivapthi@gmail.com') return { role: 'admin' };
  if (users.uploaders.includes(email)) return { role: 'uploader', branch: getBranch(email) };
  if (!email.endsWith('@bvrithyderabad.edu.in')) return null;
  const prefix = email.split('@')[0];
  if (prefix.length !== 10 || !prefix.startsWith('25wh1a')) return null;
  const branchCode = prefix.substring(6, 8);
  const branch = { '05': 'CSE', '04': 'ECE', '02': 'EEE', '66': 'AIML' }[branchCode];
  return branch ? { role: 'student', branch } : null;
};

const getBranch = (email) => {
  const prefix = email.split('@')[0];
  const branchCode = prefix.substring(6, 8);
  return { '05': 'CSE', '04': 'ECE', '02': 'EEE', '66': 'AIML' }[branchCode];
};

// Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const email = req.user.email;
    const userInfo = parseEmail(email);
    if (!userInfo) return res.redirect('/?error=invalid_email');
    req.session.user = { email, ...userInfo };
    res.redirect('/');
  }
);

app.post('/api/login', (req, res) => {
  const { email } = req.body;
  const userInfo = parseEmail(email);
  if (!userInfo) return res.status(400).json({ error: 'Invalid email' });
  
  req.session.user = { email, ...userInfo };
  res.json({ success: true, user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/user', auth, (req, res) => res.json(req.session.user));

app.get('/api/notes', auth, (req, res) => {
  const { branch, role } = req.session.user;
  const { search } = req.query;
  let filtered = role === 'admin' ? notes : notes.filter(n => n.branch === branch);
  if (search) filtered = filtered.filter(n => 
    n.subject.toLowerCase().includes(search.toLowerCase()) ||
    n.tags?.toLowerCase().includes(search.toLowerCase()) ||
    n.description?.toLowerCase().includes(search.toLowerCase())
  );
  res.json(filtered);
});

app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  const { role, branch } = req.session.user;
  if (role === 'student') return res.status(403).json({ error: 'Permission denied' });
  
  const { semester, subject, unit, tags, description } = req.body;
  const note = {
    id: Date.now(),
    branch: req.body.branch || branch,
    semester,
    subject,
    unit,
    tags,
    description,
    filename: req.file.originalname,
    path: `/uploads/${req.file.filename}`,
    uploadedBy: req.session.user.email,
    uploadedAt: new Date().toISOString()
  };
  notes.push(note);
  res.json({ success: true, note });
});

app.delete('/api/notes/:id', auth, (req, res) => {
  const { role } = req.session.user;
  if (role !== 'admin') return res.status(403).json({ error: 'Permission denied' });
  
  const idx = notes.findIndex(n => n.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Note not found' });
  
  const note = notes[idx];
  try {
    fs.unlinkSync(join(__dirname, note.path));
  } catch(e) {}
  notes.splice(idx, 1);
  res.json({ success: true });
});

app.post('/api/uploaders', auth, (req, res) => {
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Permission denied' });
  const { email } = req.body;
  if (!users.uploaders.includes(email)) users.uploaders.push(email);
  res.json({ success: true, uploaders: users.uploaders });
});

app.get('/api/uploaders', auth, (req, res) => {
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Permission denied' });
  res.json(users.uploaders);
});

// Favorites
app.post('/api/favorites/:id', auth, (req, res) => {
  const { email } = req.session.user;
  if (!userPreferences[email]) userPreferences[email] = { favorites: [], highlights: {} };
  const noteId = parseInt(req.params.id);
  if (!userPreferences[email].favorites.includes(noteId)) {
    userPreferences[email].favorites.push(noteId);
  }
  res.json({ success: true, favorites: userPreferences[email].favorites });
});

app.delete('/api/favorites/:id', auth, (req, res) => {
  const { email } = req.session.user;
  if (!userPreferences[email]) userPreferences[email] = { favorites: [], highlights: {} };
  const noteId = parseInt(req.params.id);
  userPreferences[email].favorites = userPreferences[email].favorites.filter(id => id !== noteId);
  res.json({ success: true, favorites: userPreferences[email].favorites });
});

app.get('/api/favorites', auth, (req, res) => {
  const { email } = req.session.user;
  if (!userPreferences[email]) userPreferences[email] = { favorites: [], highlights: {} };
  res.json(userPreferences[email].favorites);
});

// Highlights
app.post('/api/highlights/:id', auth, (req, res) => {
  const { email } = req.session.user;
  const noteId = req.params.id;
  const { highlights } = req.body;
  if (!userPreferences[email]) userPreferences[email] = { favorites: [], highlights: {} };
  userPreferences[email].highlights[noteId] = highlights;
  res.json({ success: true });
});

app.get('/api/highlights/:id', auth, (req, res) => {
  const { email } = req.session.user;
  const noteId = req.params.id;
  if (!userPreferences[email]) userPreferences[email] = { favorites: [], highlights: {} };
  res.json(userPreferences[email].highlights[noteId] || []);
});

app.get('*', (req, res) => res.sendFile(join(__dirname, 'index.html')));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
