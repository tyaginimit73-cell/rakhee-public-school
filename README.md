# 🏫 Rakhee Public School — Full-Stack Website & Management Platform

**SohanJani Tagan, Muzaffarnagar, Uttar Pradesh, India**

A production-oriented, full-stack school website and management platform: premium public website, online admissions system, parent/student portal, and a complete admin dashboard backed by a secure REST API and MongoDB.

---

## ✨ What's Inside

| Area | Features |
|---|---|
| **Public Website** | Hero, animated statistics, About + Principal's message, Why-Choose-Us, Academics, Campus, Gallery (filters + lightbox), Events, Notice Board, Result checking (roll no + DOB), Faculty page, Contact page with map & form, Admissions info + FAQ + enquiry |
| **Online Admissions** | 6-step validated application form (React Hook Form + Zod), document upload, instant Application ID, live status tracking (Submitted → Under Review → Shortlisted → Approved/Rejected) |
| **Parent/Student Portal** | Student profile, attendance % + monthly charts, report cards, fee status + payment history, notices, events, public documents |
| **Admin Dashboard** | Live statistics, Recharts charts (admissions, attendance, class distribution, fee collection), full CRUD for students/teachers/classes/notices/events/gallery/results/fees/documents/users, attendance marking, fee payments with printable receipts, enquiries & contact messages, global debounced search |
| **Website Settings CMS** | School name, logo paths, contact details, hero text, about/vision/mission, principal message, statistics, announcement bar, admission open/closed, social links — all editable without code changes and reflected instantly |
| **Platform** | JWT auth (httpOnly cookies), bcrypt hashing, role-based access (admin/teacher/parent/student), Helmet, CORS, rate limiting, centralized error handling, Zod + Mongoose validation, SEO meta + JSON-LD + sitemap + robots.txt, dark/light mode, fully responsive, code-split lazy loading |

## 🧱 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router 6, Framer Motion, Recharts, Axios, React Hook Form + Zod, Lucide icons, react-hot-toast
- **Backend:** Node.js, Express 4, MongoDB + Mongoose, JWT, bcryptjs, Helmet, CORS, express-rate-limit, multer (uploads), morgan, compression
- **Demo mode:** If `MONGODB_URI` is empty, the server boots an **in-memory MongoDB** and seeds realistic demo data automatically — perfect for evaluation. This only happens outside production: if `NODE_ENV=production` and `MONGODB_URI` isn't set, the server refuses to start rather than silently running on throwaway data. Point it to a real MongoDB for production.

## 🚀 Quick Start

```bash
# 1. Backend
cd server
cp .env.example .env        # then edit values
npm install
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173 (proxies /api → :5000)
```

### 🔑 Seeded Demo Credentials (development only)

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@rps.school` | `Admin@12345` (from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars) |
| **Parent** | `parent@demo.rps` | `Parent@12345` |
| **Result check** | Roll No `RPS1001`, DOB `2011-01-01` | |

> The seed script prints the demo result's roll number + DOB on every boot.
>
> **In production** (`NODE_ENV=production`): `ADMIN_EMAIL` and `ADMIN_PASSWORD`
> must both be set explicitly — there is no fallback to the defaults above
> for either one (a predictable admin email is a real weakness even with a
> strong password). The demo parent
> account and other fake content (students, notices, events...) are **not**
> seeded by default in production; set `SEED_DEMO_DATA=true` to opt in if you
> genuinely want a demo deployment. The clickable demo-account panel on the
> login page is also dev-only — it's built out of the production bundle
> entirely (`import.meta.env.DEV`), not just hidden by CSS.

## ⚙️ Environment Variables

**server/.env**

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | e.g. `mongodb://localhost:27017/rakhee_public_school` — empty = in-memory demo DB in development; **required** in production |
| `JWT_SECRET` | Long random secret — required everywhere; must be ≥32 characters in production |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated for more than one — **required** in production (CORS allowlist) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First admin seeded on an empty database — **both required** in production, no default for either |
| `SEED_DEMO_DATA` | Fake demo content (students/notices/etc.). Dev default: on. Production default: **off** — set to `true` to opt in |

See `server/.env.example` for the complete reference (generated from the
actual code, not written by hand) and `PROJECT_AUDIT.md` §12 for full
deployment requirements.

**client/.env** — `VITE_API_URL` (leave empty in dev; Vite proxies `/api` and `/uploads`).

## 📁 Project Structure

```
server/
├── config/         db connection, default settings, demo seed
├── controllers/    one controller per resource
├── middleware/     auth (protect/authorize), errors, multer upload
├── models/         16 Mongoose models (User, Student, Teacher, Class, Admission,
│                   Notice, Event, GalleryImage, Testimonial, ContactMessage,
│                   Enquiry, Result, Attendance, Fee, Document, Setting)
├── routes/         thin REST routers per resource
├── utils/          ApiError, asyncHandler, token helpers, pagination
├── validators/     zod schemas + validate middleware
├── uploads/        user-uploaded files (git-ignored)
└── server.js       app assembly, security middleware, boot

client/src/
├── components/     common, navbar, footer, cards, forms, home, admin (DataTable…)
├── context/        Theme, Settings (CMS), Auth
├── hooks/          useFetch, useDebounce, useCountUp
├── layouts/        PublicLayout, AdminLayout
├── pages/          public/ (14 pages), portal/, admin/ (17 pages)
├── routes/         AppRoutes (lazy-loaded, code-split)
├── services/       axios instance with normalized errors
└── utils/          formatting, status colors, constants
```

## 🔒 Security Notes

- Passwords hashed with bcrypt (cost 12); JWT in **httpOnly** cookie; `Bearer` header also supported.
- Admin routes guarded by role middleware; public endpoints never expose private data.
- Zod validation on the API boundary + Mongoose schema validation; consistent `{ success, message, data }` responses.
- Rate limiting on all API routes + stricter limit on login; Helmet headers; CORS restricted to `CLIENT_URL`.
- Uploads: 5 MB cap, extension allow-list, randomized filenames, stored on disk (metadata in MongoDB — no binary blobs in documents).

## 🏗️ Production Build & Deployment

```bash
# build frontend
cd client && npm run build         # outputs client/dist

# serve API (reverse proxy /api and /uploads to :5000)
cd ../server && NODE_ENV=production MONGODB_URI=<your-uri> npm start
```

For a single-process deploy, serve `client/dist` statically from Express (or any static host) and proxy `/api` + `/uploads` to the API. Set `NODE_ENV=production` (enables Secure cookies) and supply a strong `JWT_SECRET`.

## ✅ Testing

An automated backend test suite exists at `server/tests/` (health checks,
authentication, the full admission flow including a concurrency regression
test, and the CORS allowlist), built on Node's built-in test runner —
`npm test` from `server/`. See `TESTS.md` for exactly what's covered and, just
as importantly, exactly what has and hasn't been verified to actually pass —
that distinction matters and is documented precisely rather than asserted.

## 📸 Demo Data Notice

All phone numbers, email addresses, statistics, principal name and fee amounts are **clearly-marked editable placeholders/demo data**. Replace them with the school's official information in **Admin → Website Settings** before going live. No official school records were invented as fact.
