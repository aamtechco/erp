# AccountEdge ERP — Small Accounting Office System

A full-stack ERP system for small accounting offices. Manage clients, assign tasks, set email reminders, and generate reports — all from a clean, modern dashboard.

---

## ✨ Features

| Module      | What it does                                                              |
|-------------|---------------------------------------------------------------------------|
| **Dashboard** | Live stats — active clients, overdue tasks, upcoming deadlines, recent completions |
| **Clients**   | Full CRUD — add, edit, delete, search clients with tax ID, contact info, notes |
| **Tasks**     | Create and assign tasks to clients/users, set priority & due dates, mark complete |
| **Reminders** | Schedule email notifications for tasks at any date/time via cron job      |
| **Reports**   | Visual charts: task trends, status breakdown, priority mix, top performers |
| **Users**     | Admin can create/manage users with role-based access (Admin / Accountant / User) |

---

## 🏗 Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, React Query, Recharts, Zustand |
| Backend    | Node.js, Express 4, JWT auth, node-cron         |
| Database   | PostgreSQL 16 (with `pg` connection pool)       |
| Email      | Nodemailer (SMTP — works with Gmail, SendGrid, etc.) |
| Deployment | Vercel (frontend + backend) or Docker Compose   |

---

## 📁 Project Structure

```
erp/
├── frontend/                # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      # AppLayout (sidebar + topbar)
│   │   │   └── ui/          # Shared UI components + NotificationBell
│   │   ├── lib/             # api.js, authStore.js, utils.js
│   │   ├── pages/           # One file per page
│   │   └── styles/          # globals.css (Tailwind)
│   ├── vercel.json
│   └── Dockerfile
│
├── backend/                 # Express API
│   ├── src/
│   │   ├── middleware/      # auth.js (JWT + role guards)
│   │   ├── routes/          # auth, clients, tasks, reminders, reports, dashboard, users
│   │   ├── services/        # emailService.js, reminderJob.js (cron)
│   │   └── utils/           # db.js (pg pool), logger.js
│   ├── vercel.json
│   └── Dockerfile
│
├── database/
│   └── schema.sql           # Full PostgreSQL schema + seed data
│
├── docker-compose.yml       # Local dev with Postgres + hot reload
└── README.md
```

---

## 🚀 Quick Start (Local with Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed

### Steps

```bash
# 1. Clone / download the project
cd erp

# 2. (Optional) Set SMTP credentials for email reminders
#    Create a file called .env in the project root:
echo "SMTP_USER=you@gmail.com" >> .env
echo "SMTP_PASS=your-app-password" >> .env

# 3. Start everything (Postgres + backend + frontend)
docker compose up --build

# 4. Open your browser
#    Frontend:  http://localhost:3000
#    Backend:   http://localhost:5000/health
```

Default login credentials (from seed data):
- **Admin:** `admin@office.com` / `Admin@1234`
- **Accountant:** `jane@office.com` / `Admin@1234`

> ⚠️ Change these passwords immediately after first login!

---

## 🛠 Manual Setup (Without Docker)

### 1. PostgreSQL

Create a database and run the schema:

```bash
psql -U postgres
CREATE DATABASE erp_db;
\q

psql -U postgres -d erp_db -f database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — fill in DB credentials, JWT_SECRET, and SMTP settings

npm install
npm run dev       # Starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000   (or leave blank to use Vite proxy)

npm install
npm run dev       # Starts on http://localhost:3000
```

---

## ☁️ Deploy to Vercel

### Backend

```bash
cd backend
npm i -g vercel
vercel

# Set these environment variables in the Vercel dashboard:
# DATABASE_URL   = your Neon / Supabase / Railway Postgres URL
# JWT_SECRET     = a long random string
# FRONTEND_URL   = https://your-frontend.vercel.app
# SMTP_HOST      = smtp.gmail.com
# SMTP_USER      = your-email@gmail.com
# SMTP_PASS      = your-app-password
```

### Frontend

```bash
cd frontend
vercel

# Set environment variable:
# VITE_API_URL = https://your-backend.vercel.app
```

> 💡 **Free Postgres on Vercel:** Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) — both offer free PostgreSQL hosting. Copy the connection string into `DATABASE_URL`.

---

## 🔐 Roles & Permissions

| Action                    | Admin | Accountant | User |
|---------------------------|:-----:|:----------:|:----:|
| View dashboard            | ✅    | ✅         | ✅   |
| View clients              | ✅    | ✅         | ✅   |
| Create / edit clients     | ✅    | ✅         | ❌   |
| Delete clients            | ✅    | ❌         | ❌   |
| View tasks                | ✅    | ✅         | Own only |
| Create / edit tasks       | ✅    | ✅         | ❌   |
| Mark tasks complete       | ✅    | ✅         | ✅   |
| Manage reminders          | ✅    | ✅         | Own only |
| View reports              | ✅    | ✅         | ❌   |
| Manage users              | ✅    | ❌         | ❌   |

---

## 📧 Email Reminders

The backend runs a **cron job every minute** that:
1. Queries the `reminders` table for unsent entries where `notify_at <= NOW()`
2. Sends a formatted HTML email via Nodemailer
3. Marks the reminder as `sent = TRUE` with a timestamp

To enable, set these variables in `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-account@gmail.com
SMTP_PASS=your-16-char-app-password    # Gmail: Security → App Passwords
EMAIL_FROM=ERP Office <your-account@gmail.com>
```

---

## 🔌 API Reference (Quick)

All endpoints are prefixed with `/api` and require `Authorization: Bearer <token>` except login.

| Method | Endpoint                 | Description                        |
|--------|--------------------------|------------------------------------|
| POST   | `/auth/login`            | Login → returns JWT token          |
| GET    | `/auth/me`               | Current user info                  |
| GET    | `/dashboard`             | Dashboard stats + upcoming tasks   |
| GET    | `/clients`               | List clients (search, filter, page)|
| POST   | `/clients`               | Create client                      |
| PUT    | `/clients/:id`           | Update client                      |
| DELETE | `/clients/:id`           | Delete client (admin)              |
| GET    | `/tasks`                 | List tasks (filter by status, etc) |
| POST   | `/tasks`                 | Create task                        |
| PATCH  | `/tasks/:id/status`      | Quick status update                |
| GET    | `/reminders`             | List reminders                     |
| POST   | `/reminders`             | Create reminder                    |
| GET    | `/reports/summary`       | Report data (charts)               |
| GET    | `/users`                 | List users (admin/accountant)      |
| POST   | `/users`                 | Create user (admin only)           |

---

## 🐳 TrueNAS / Homelab Deployment

For TrueNAS Scale or any Docker host:

```bash
# 1. Copy the project to your server
scp -r erp/ user@nas-ip:/mnt/data/erp

# 2. SSH in and start
ssh user@nas-ip
cd /mnt/data/erp

# 3. Create .env with your SMTP credentials
cp backend/.env.example backend/.env
nano backend/.env

# 4. Start services
docker compose up -d

# 5. Access from your local network
# http://nas-ip:3000
```

---

## 🔧 Extending the System

The codebase is structured for easy extension:

- **New page:** Add a route in `frontend/src/App.jsx`, create `src/pages/NewPage.jsx`
- **New API endpoint:** Add a file in `backend/src/routes/`, register in `app.js`
- **New DB table:** Add to `database/schema.sql`, create corresponding route
- **Invoice module:** Add an `invoices` table (client_id, amount, due_date, paid), create `/api/invoices` route, add frontend page
- **File attachments:** Integrate with Cloudflare R2 or AWS S3 for document storage per client

---

## 📝 License

MIT — free for personal and commercial use.
