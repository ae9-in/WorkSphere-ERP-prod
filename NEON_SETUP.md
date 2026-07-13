# WorkSphere ERP — Neon PostgreSQL Integration Guide

WorkSphere ERP uses **Neon PostgreSQL** as its primary transactional database. Neon is a serverless, fully-managed PostgreSQL service. This guide covers how to set up, connect, and monitor Neon database instances.

---

## 🌩️ Setup Database in Neon Dashboard

1. **Create Neon Account:** Sign up at [neon.tech](https://neon.tech).
2. **Initialize Project:** Create a new project called `worksphere-erp` and select PostgreSQL 16.
3. **Database Creation:** Navigate to the **Databases** tab in the Neon console and click **Create Database**. Name it `worksphere_erp`.
4. **Get Connection String:** Select your database in the dashboard and copy the PostgreSQL connection URL under the **Connection details** block. Ensure **Connection Pooling** is toggled **ON** if running in high-concurrency production environments.

---

## 🔌 Connection Setup

Paste your Neon connection string into your local `.env` and `apps/api/.env` files:
```env
DATABASE_URL=postgresql://[user]:[password]@[host].neon.tech/worksphere_erp?sslmode=require
```

### Neon Setup Requirements
* **SSL Requirement:** Neon database nodes require SSL connections. The FastAPI backend automatically appends `sslmode=require` if it's missing from your configuration.
* **Protocol Uniformity:** Legacy connection formats starting with `postgres://` are automatically rewritten to `postgresql://` by the database core setup module to ensure compatibility with SQLAlchemy 2.x.
* **Serverless Connection Tuning:** The database connection engine is pre-configured with:
  * `pool_pre_ping=True`: Ensures dropped connections are automatically replaced.
  * `pool_recycle=1800`: Automatically cycles connections every 30 minutes to stay fresh and respect Neon's serverless idle timeouts.

---

## 📈 Monitoring and Performance
Within the Neon console, you can monitor the following metrics:
* **Active Connections:** View real-time connection counters and scale limits.
* **Autoscaling CPU/Memory:** Monitor how your computing resources scale up under load and scale down to zero when idle.
* **Query Performance:** Inspect SQL query execution latencies and index optimization tips.
