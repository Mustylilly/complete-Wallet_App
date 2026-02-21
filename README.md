Below is a clean, professional `README.md` tailored to your **Node.js + Express + Passport + PostgreSQL Wallet App** project.

You can copy this directly into a `README.md` file at the root of your project.

---

# 💰 Wallet App

A full-stack wallet management application built with **Node.js, Express, EJS, PostgreSQL, Passport.js, and Socket.IO**.

This application supports:

* Local authentication (email & password)
* Google OAuth authentication
* Session-based login
* Protected dashboard routes
* Wallet balance management
* Real-time features via Socket.IO

---

## 🚀 Features

* 🔐 User Authentication (Local + Google OAuth)
* 🧾 Secure password hashing (bcrypt)
* 📦 PostgreSQL database integration
* 🧠 Passport.js session handling
* 📊 Dynamic dashboard rendering with EJS
* ⚡ Real-time updates using Socket.IO
* 🛡 Protected routes middleware
* 🗂 Clean MVC-like folder structure

---

## 🏗 Project Structure

```
wallet-app/
│
├── server.js
├── package.json
│
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── passport.js
│   │
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── dashboard.routes.js
│   │   └── wallet.routes.js
│   │
│   └── views/
│       ├── auth/
│       ├── dashboard/
│       ├── partials/
│       └── index.ejs
│
└── public/
    └── css/
```

---

## 🛠 Tech Stack

* **Backend:** Node.js, Express
* **Database:** PostgreSQL
* **Authentication:** Passport.js (Local + Google OAuth 2.0)
* **Templating:** EJS
* **Sessions:** express-session
* **Real-time:** Socket.IO
* **Security:** bcryptjs

---

## 📦 Installation

### 1️⃣ Clone the repository

```bash
git clone <your-repo-url>
cd wallet-app
```

---

### 2️⃣ Install dependencies

```bash
npm install
```

If needed:

```bash
npm install passport passport-local passport-google-oauth20 express-session bcryptjs socket.io pg dotenv
```

---

### 3️⃣ Create a `.env` file

Create a `.env` file in the root directory:

```
PORT=3000
SESSION_SECRET=your_session_secret
DATABASE_URL=your_postgres_connection_string

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

### 4️⃣ Setup PostgreSQL Database

Create a `users` table:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT,
  google_id TEXT,
  balance NUMERIC DEFAULT 0
);
```

---

### 5️⃣ Start the server

```bash
npm run dev
```

Or:

```bash
node server.js
```

Server will run on:

```
http://localhost:3000
```

---

## 🔐 Authentication Flow

### Local Authentication

* User registers with email & password
* Password hashed using bcrypt
* Passport validates credentials
* Session stored via express-session

### Google OAuth

* `/auth/google` → Redirects to Google
* `/auth/google/callback` → Handles login
* User is created if not found
* Redirect to `/dashboard`

---

## 📊 Dashboard

Protected route:

```
/dashboard
```

Only accessible if:

```js
req.isAuthenticated()
```

Displays:

* User name
* Wallet balance
* Logout option

---

## 🛡 Route Protection Middleware Example

```js
export const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/auth/login');
};
```

---

## ⚡ Real-Time Support

Socket.IO is initialized in `server.js`:

```js
const httpServer = createServer(app);
const io = new Server(httpServer);
```

This enables:

* Live wallet updates
* Real-time notifications
* Transaction broadcasting

---

## 🧠 Common Errors & Fixes

### Cannot GET /dashboard

Ensure the route exists and is mounted:

```js
app.use('/dashboard', dashboardRoutes);
```

---

### Failed to lookup view

Ensure:

* `app.set('views', path.join(__dirname, 'src/views'))`
* Correct folder structure
* Correct `res.render('auth/login')` usage

---

### ERR_MODULE_NOT_FOUND

Check:

* Correct relative import paths
* File exists in specified folder
* `.js` extension included (ESM requirement)

---

## 🔮 Future Improvements

* Transaction history
* Wallet transfers between users
* Flash messages
* JWT-based API version
* Admin dashboard
* Chart.js wallet analytics
* Email verification
* Rate limiting
* CSRF protection

---

## 🧑‍💻 Author

Built with Node.js, Express, and PostgreSQL.

---

## 📄 License

MIT License

---

If you’d like, I can also generate:

* A **professional GitHub-optimized version**
* A **portfolio-ready README with badges**
* A **production deployment guide (Render, Railway, VPS)**
* Or a **clean architecture diagram explanation**

Just tell me which one you want next.
