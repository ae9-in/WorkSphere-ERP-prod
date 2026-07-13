# WorkSphere ERP — Alembic Migration Guide

This guide details how to generate, apply, and roll back database migrations in WorkSphere ERP.

---

## 🗂️ Overview
WorkSphere ERP utilizes **Alembic** to synchronize declarative Python SQLAlchemy database models with target database schemas.
- Migration definitions are stored in: `apps/api/alembic/versions/`
- Configuration file: `apps/api/alembic.ini`
- Run context: `apps/api/alembic/env.py`

---

## 🚀 Migrations Developer CLI Commands

Before running migrations commands, ensure you are inside `apps/api` with your Python virtual environment active:
```bash
cd apps/api
# Windows PowerShell
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate
```

### 1. Apply Migrations (Upgrade)
Upgrade database schemas to the latest revision head:
```bash
alembic upgrade head
```

### 2. Generate Automatic Migrations (Autogenerate)
Generate a new schema revision file based on changes in your SQLAlchemy models:
```bash
alembic revision --autogenerate -m "describe_your_changes_here"
```

### 3. Roll Back Migrations (Downgrade)
Roll back your database schema by a specific number of versions (e.g. roll back by 1 version):
```bash
alembic downgrade -1
```
Roll back to the absolute base (empty schema):
```bash
alembic downgrade base
```

### 4. Inspect Migration Status
Display current migration status and versions database:
```bash
alembic current
# Display complete history of migration versions
alembic history --verbose
```
