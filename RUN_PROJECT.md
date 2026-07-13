# Running WorkSphere ERP

This guide details how to execute WorkSphere ERP across different environments: Local Development, Test Suites, Staging, Production, and Dockerized containers.

---

## 🛠️ 1. Local Development Mode

In local development, the system runs with hot-reloading enabled for both frontend (Next.js) and backend (FastAPI/Uvicorn).

1. Ensure Neon PostgreSQL (via connection URL in `.env`) and Valkey are running.
2. Initialize database schemas and seed default entries:
   ```bash
   cd apps/api
   # Run migrations
   alembic upgrade head
   # Run database seed
   python seed.py
   cd ../..
   ```
3. From the root directory, start the app:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 to interact with the frontend portal, and http://localhost:5000/docs to test API endpoints.

---

## 🧪 2. Running Test Suites

### Backend Unit & Integration Tests (FastAPI)
The backend test suite is powered by `pytest` and runs in memory or against a local database file (`apps/api/test.db` to avoid wiping development schemas).

**Run all backend tests:**
```bash
cd apps/api
# Activate virtualenv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Execute pytest
$env:PYTHONPATH="."      # Windows PowerShell env variable
pytest
```

**Run a specific module test suite (e.g. Supply Chain):**
```bash
pytest tests/test_supply_chain.py
```

### Frontend Type checking & Lints
```bash
cd apps/web
npx tsc --noEmit
npm run lint
```

---

## 🏗️ 3. Running in Staging & Production

In production/staging, uvicorn hot-reloading is disabled, databases connect to resilient Postgres instances, and Next.js assets are pre-built to optimize bundle loading performance.

### A. Backend Production Launch
1. Ensure `NODE_ENV` is set to `production`.
2. Disable reload, set workers count matching available CPUs, and expose on standard ports:
   ```bash
   cd apps/api
   venv/Scripts/activate
   uvicorn app.main:app --host 0.0.0.0 --port 5000 --workers 4
   ```

### B. Frontend Production Build & Run
1. Set the correct target API URL:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourproductiondomain.com
   ```
2. Build the Next.js production files (pre-compiles and optimizes React layouts):
   ```bash
   cd apps/web
   npm run build
   ```
3. Spin up the static page server:
   ```bash
   npm run start
   ```

---

## 🐳 4. Containerized Run (Docker & Docker Compose)

Docker is the recommended deployment method for staging and production. It initializes Postgres, Valkey, the FastAPI backend, and the Next.js frontend within an isolated virtual network.

### Local Container Orchestration
The root [docker-compose.yml](file:///w:/V%20S%20Code%20files/project-erp-website/docker-compose.yml) is configured for quick startup:

**Build and start all services:**
```bash
docker-compose up --build
```

**Run in background (detached mode):**
```bash
docker-compose up -d
```

**Stop and clean up containers:**
```bash
docker-compose down -v
```

### Individual Service Configurations in docker-compose:
- **`db` (PostgreSQL)**: Exposed on host port `5432`. Persists database schemas into Docker volume `pgdata`.
- **`valkey` (Valkey)**: Exposed on host port `6379`. Redis-protocol compatible in-memory datastore for cache, sessions, and rate-limiting. Persists to Docker volume `valkey_data`.
- **`backend` (FastAPI API)**: Builds from `./apps/api/Dockerfile` and exposes endpoint on port `5000`.
- **`web` (Next.js client)**: Builds from `./apps/web/Dockerfile` and maps portal on port `3000`.
