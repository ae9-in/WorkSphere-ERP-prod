# Developer Setup Guide

This guide details the step-by-step process required to clone, configure, install, and run WorkSphere ERP locally.

---

## 📋 System Prerequisites

Ensure you have the following software installed on your machine before commencing the setup:

| Dependency | Required Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v20.x` or higher | Frontend and npm workspace management |
| **npm** | `v10.x` or higher | Package manager |
| **Python** | `v3.12.x` | Backend runtime |
| **PostgreSQL** | `v16.x` or higher | Primary relational database |
| **Valkey** | Latest | In-memory datastore (cache, sessions, rate-limiting) |
| **Docker Desktop** | Latest | Containerized execution |

---

## 🛠️ Step-by-Step Installation

### Step 1: Clone the Repository
Clone the repository to your local directory:
```bash
git clone <repo-url>
cd project-erp-website
```

### Step 2: Configure Environment Templates
WorkSphere ERP utilizes a centralized environment file.
1. Copy `.env.example` in the root folder to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Copy `.env.example` to `apps/api/.env` (FastAPI reads its settings here during virtual environment run):
   ```bash
   cp .env.example apps/api/.env
   ```
3. Edit `apps/api/.env` and specify your PostgreSQL and Valkey connections:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/worksphere_erp
   VALKEY_URL=redis://localhost:6379
   CACHE_URL=redis://localhost:6379
   ```

### Step 3: Install Frontend Dependencies
The root `package.json` configures npm workspaces. From the root directory, install all Node packages:
```bash
npm install
```
This will automatically link dependencies for the root and the `apps/web` Next.js frontend app.

### Step 4: Setup Backend Virtual Environment
Navigate to the API folder, initialize the Python virtual environment, and install dependencies:

**On Windows (PowerShell):**
```powershell
cd apps/api
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

**On macOS / Linux:**
```bash
cd apps/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 5: Configure and Initialize PostgreSQL Database
Make sure PostgreSQL is running locally on port `5432`.
1. Open your PostgreSQL CLI (pgAdmin, psql, or similar database editor) and create the system database:
   ```sql
   CREATE DATABASE worksphere_erp;
   ```
2. Run database migrations to provision the schema using Alembic:
   ```bash
   # Ensure you are inside apps/api with active virtual environment
   alembic upgrade head
   ```

### Step 6: Start Local Services

#### A. Run Valkey
Verify Valkey is running on port `6379`.
- **Docker** (recommended):
  ```bash
  docker run -d --name worksphere-valkey \
    -p 6379:6379 \
    valkey/valkey:latest
  ```
- **Linux**: Follow [Valkey installation docs](https://github.com/valkey-io/valkey)

> [!NOTE]
> Valkey listens on the same port (6379) and uses the same Redis protocol. No application code changes are needed beyond the environment variable names.

---

### Step 7: Launch the Application

#### Complete ERP Stack (Frontend + Backend)
To start both processes simultaneously, run the dev script from the **root** folder:
```bash
# Run from root workspace folder
npm run dev
```

#### Running Modules Independently

**Start Backend API Only:**
```bash
# Run from root
npm run dev:api

# Alternatively, inside apps/api with active venv:
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```
- API Swagger Docs: http://localhost:5000/docs
- API ReDoc Specs: http://localhost:5000/redoc

**Start Frontend Only (Next.js):**
```bash
# Run from root
npm run dev:web

# Alternatively, inside apps/web:
npm run dev
```
- Portal URL: http://localhost:3000

---

### Step 8: Sign Up and Seed Database Settings
1. Open http://localhost:3000 in your browser.
2. Select **Sign Up** to register a new tenant account.
3. Fill in the Company Name and Super Admin Details.
4. Click Submit. This will register the company and **automatically seed default configurations** (designations, approval hierarchies, asset types, leave policies) via backend settings routers.
5. The workspace will redirect you to the main dashboard.
