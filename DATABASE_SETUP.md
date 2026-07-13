# WorkSphere ERP — Database Setup Guide

This document details the configuration, connection pools, initialization, and verification routines for WorkSphere ERP's primary databases.

---

## 🗄️ Tech Stack
1. **Primary Transactional DB:** PostgreSQL 16 (Hosted serverless via **Neon PostgreSQL**)
2. **In-Memory Cache & Session DB:** **Valkey** (Redis-protocol compatible)
3. **ORM:** SQLAlchemy 2.x (Synchronous engine with pooled connection execution)
4. **Migrations:** Alembic

---

## 🚀 Step-by-Step Database Provisioning

### 1. Connection String Environment Setup
Create a `.env` file at the project root matching the [`.env.example`](file:///w:/V%20S%20Code%20files/project-erp-website/.env.example):
```env
# PostgreSQL connection url (Neon connection string with sslmode=require)
DATABASE_URL=postgresql://user:pass@host.neon.tech/worksphere_erp?sslmode=require

# Valkey connection settings
VALKEY_URL=redis://localhost:6379
CACHE_URL=redis://localhost:6379
```

### 2. Alembic Database Migration Run
Apply all pre-existing schema migration revisions to target database tables:
```bash
cd apps/api
# Activate virtual environment
.\venv\Scripts\activate
# Run migrations
alembic upgrade head
```

### 3. Run Seeding Script
Populate your database with the default system organization, default role definitions, default leave types, and a Super Admin user:
```bash
python seed.py
```
Default Administrator Login:
- **Email:** `admin@worksphere.com`
- **Password:** `Admin@123`
- **Role:** Super Admin (`admin`)

---

## 🩺 Monitoring Database Health
To verify database pool usage and connection latency:
1. Start the backend server:
   ```bash
   uvicorn app.main:app --port 5000 --reload
   ```
2. Query the detailed health route:
   ```bash
   curl http://localhost:5000/health/database
   ```
   **Expected Response:**
   ```json
   {
     "success": true,
     "database": "Neon PostgreSQL",
     "connected": true,
     "latencyMs": 42.12,
     "version": "16.3",
     "currentSchema": "public",
     "connectionPool": {
       "poolSize": 10,
       "checkedIn": 10,
       "checkedOut": 0
     }
   }
   ```
