# 🚑 Raksha — Backend Integration Guide
> For juniors to wire the Express backend to the deployed Vercel frontend  
> **The Vercel URL stays the same throughout — you never touch it again.**

---

## 🗺️ What Needs to Happen (Overview)

```
Current state:
  Frontend (Vercel) ──── reads data from ──── server/data.js (local import)

Target state:
  Frontend (Vercel) ──── fetch() ──────────── Backend API (Render/Railway)
                                                    │
                                               In-memory / PostgreSQL DB
```

There are **3 phases**:

1. **Deploy the backend** (Render — free)
2. **Fix the frontend** to use `fetch()` instead of direct import
3. **Set env variable on Vercel** → frontend auto-reconnects, same URL

---

## PHASE 1 — Deploy Backend on Render (Free)

### Step 1: Push server code (already on GitHub ✅)
The `server/` folder is already in the repo at `github.com/aniket123de/Raksha-SIH2026`

### Step 2: Sign up at [render.com](https://render.com) → New → Web Service

| Setting | Value |
|---|---|
| **Repo** | `aniket123de/Raksha-SIH2026` |
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node index.js` |
| **Instance Type** | Free |

Click **Deploy**. Render gives you a URL like:
```
https://raksha-api.onrender.com
```
> ⚠️ Free tier spins down after 15 min idle — first request takes ~30s to wake up. Acceptable for demo.

---

## PHASE 2 — Fix the Frontend (5 code changes)

### Change 1: Add `.env.production` file in project root

Create file: `.env.production`
```env
VITE_API_URL=https://raksha-api.onrender.com
```

Also create `.env.development` for local dev:
```env
VITE_API_URL=http://localhost:5000
```

---

### Change 2: Fix `EmergencyContext.jsx` — replace direct import with fetch

**File:** `src/context/EmergencyContext.jsx`

**Remove this line at top (line 2):**
```js
import { initialData } from '../../server/data.js';
```

**Add this instead at the top of the file:**
```js
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

**Replace all `useState(initialData.xyz)` patterns** with a single fetch on mount:
```js
const [appData, setAppData] = useState(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  fetch(`${API}/api/data`)
    .then(res => res.json())
    .then(data => {
      setAppData(data);
      setIsLoading(false);
    })
    .catch(async () => {
      // Graceful fallback if API is down — app still works
      const { initialData } = await import('../../server/data.js');
      setAppData(initialData);
      setIsLoading(false);
    });
}, []);
```

> 💡 Keep the fallback import — the app still works offline or if backend is down.

---

### Change 3: Fix CORS on the backend

**File:** `server/index.js`

**Find:**
```js
app.use(cors());
```

**Replace with:**
```js
app.use(cors({
  origin: [
    'https://raksha-sih2026.vercel.app',  // ← replace with your actual Vercel URL
    'http://localhost:3000'
  ],
  credentials: true
}));
```

---

### Change 4: Fix Auth — real JWT token (not fake base64)

**In `server/` run:**
```bash
npm install jsonwebtoken
```

**File:** `server/index.js` — line 78

**Find:**
```js
const token = `emg_jwt_${Buffer.from(`${user.id}:${user.role}:${Date.now()}`).toString('base64')}`;
```

**Replace with:**
```js
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'raksha-secret-change-in-prod';

const token = jwt.sign(
  { id: user.id, role: user.role },
  JWT_SECRET,
  { expiresIn: '8h' }
);
```

Add `JWT_SECRET=your-secret-here` in Render's **Environment Variables** section.

---

### Change 5: Hash passwords with bcrypt

**In `server/` run:**
```bash
npm install bcrypt
```

**File:** `server/data.js` — replace all `password: "password123"` with hashed values.

Generate hashes once:
```js
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash('password123', 10);
// use this hash in data.js as passwordHash: "<hash>"
```

**File:** `server/index.js` login route — replace:
```js
if (!user || user.password !== password) {
```
with:
```js
import bcrypt from 'bcrypt';
const valid = await bcrypt.compare(password, user.passwordHash);
if (!user || !valid) {
```

---

## PHASE 3 — Connect Vercel to Backend (Same URL)

### Step 1: Add Environment Variable on Vercel

1. **vercel.com** → Project → **Settings** → **Environment Variables**
2. Add:

| Name | Value | Environment |
|---|---|---|
| `VITE_API_URL` | `https://raksha-api.onrender.com` | Production |
| `VITE_API_URL` | `http://localhost:5000` | Development |

### Step 2: Push changes → Vercel auto-redeploys

```bash
git add .
git commit -m "feat: wire frontend to live backend API"
git push
```

✅ **Same Vercel URL. Now backed by the live Express API.**

---

## 📋 Full Checklist

```
BACKEND (Render)
□ Deployed server/ to Render with correct Root Directory = server
□ Got live URL → tested /api/health returns JSON
□ CORS updated to allow Vercel domain
□ JWT_SECRET added in Render Environment Variables
□ jsonwebtoken + bcrypt installed in server/

FRONTEND CODE CHANGES
□ .env.production created with VITE_API_URL
□ Removed direct `import { initialData }` from EmergencyContext.jsx
□ Added fetch() with fallback in EmergencyContext.jsx
□ All SOS/update actions POST to API endpoints
□ Auth flow stores real JWT in localStorage

VERCEL RECONNECT (Same URL)
□ VITE_API_URL env var added in Vercel dashboard
□ Code changes pushed → Vercel auto-redeployed
□ Tested login end-to-end
□ Tested SOS dispatch persists across browser refresh
```

---

## ⚠️ Current Backend Issues (Priority Order)

| # | Issue | Fix Required |
|---|---|---|
| 🔴 | Plaintext `password123` in `data.js` | bcrypt hashing |
| 🔴 | Fake JWT (base64, not signed) | `jsonwebtoken` |
| 🔴 | All API routes unprotected | JWT verify middleware on every route |
| 🟡 | In-memory DB (resets on restart) | Connect to Render PostgreSQL using `schema.sql` |
| 🟡 | `/api/data` exposes all users | Return role-filtered data only |
| 🟡 | `/api/reset-demo` unprotected | Add admin-only middleware |
| 🟢 | CORS wide open | Restrict to Vercel domain |

---

## 🏗️ Recommended Final Stack

```
Frontend  → Vercel          (already live ✅)
Backend   → Render          (free Node.js)
Database  → Render PostgreSQL (free 1GB — use existing schema.sql)
Auth      → jsonwebtoken + bcrypt
```

> **Estimated time for full wiring**: ~4–6 hours for a dev familiar with the codebase.
