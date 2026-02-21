import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './src/config/db.js';
import bcrypt from 'bcrypt';
import GoogleStrategy from 'passport-google-oauth2';
import { Strategy } from 'passport-local';


/* -------------------- IMPORTS -------------------- */


import walletRoutes from './src/routes/wallet.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import { registerUserSocket } from './src/middlewares/socket.middleware.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

/* -------------------- MIDDLEWARES -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/wallet', walletRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/auth/login', 
  (req, res) => res.render('login'));

app.get('/auth/register', 
  (req, res) => res.render('register'));

app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.render('dashboard', { user: req.user });
});

app.get('/auth/transfer', 
  (req, res) => res.render('transfer'))

app.get('/auth/google',
   passport.authenticate('google', {
     scope: ['profile', 'email'] 
    }));

app.get('/auth/google/wallet-app',
  passport.authenticate('google', { 
    successRedirect: '/dashboard',
    failureRedirect: '/login' }),
);


app.post('/auth/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  })
);

app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (existingUser.rows.length > 0) return res.send('Email already registered');

    await pool.query(
      'INSERT INTO users(name,email,password) VALUES($1,$2,$3)',
      [name, email, hashedPassword]
    );
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.send('Error registering user');
  }
});

// GOOGLE STRATEGY
passport.use
(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/google/wallet-app'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await pool.query('SELECT * FROM users WHERE google_id=$1', [profile.id]);
    if (user.rows.length > 0) return done(null, user.rows[0]);

    const newUser = await pool.query(
      'INSERT INTO users(name,email,google_id) VALUES($1,$2,$3) RETURNING *',
      [profile.displayName, profile.emails[0].value, profile.id]
    );
    done(null, newUser.rows[0]);
  } catch (err) {
    done(err, null);
  }
}));

// LOCAL STRATEGY (for login)
passport.use(new Strategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (user.rows.length === 0) return done(null, false, { message: 'No user with that email' });

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return done(null, false, { message: 'Incorrect password' });

    return done(null, user.rows[0]);
  } catch (err) {
    return done(err);
  }
}));

// SERIALIZE / DESERIALIZE USER
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
    done(null, user.rows[0]);
  } catch (err) {
    done(err);
  }
});
/* -------------------- ROUTES -------------------- */


/* -------------------- SOCKET.IO (IMPORTANT ORDER) -------------------- */
const httpServer = createServer(app);   // 1️⃣ create HTTP server
const io = new Server(httpServer);      // 2️⃣ create io instance

app.set('io', io);                      // 3️⃣ expose io to controllers
registerUserSocket(io);                 // 4️⃣ NOW it is safe

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/auth/login');
  });
});
/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
});
