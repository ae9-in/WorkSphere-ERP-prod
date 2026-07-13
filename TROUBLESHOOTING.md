# Troubleshooting Guide

This guide contains solutions for common issues encountered during local development, installation, or execution of WorkSphere ERP.

---

## 🗄️ 1. Database Connection Issues

### Problem: `Connection refused` or `Is the server running on host "localhost" (127.0.0.1) and accepting TCP/IP connections on port 5432?`
- **Reason**: The PostgreSQL service is stopped, running on a different port, or credential verification failed.
- **Solution**:
  1. Confirm PostgreSQL is running.
     - **Windows**: Open Services, search for `postgresql-x64`, and ensure its status is "Running".
     - **macOS**: Run `brew services list` and start postgres.
     - **Linux**: Run `sudo systemctl status postgresql`.
  2. Verify credentials in your `.env` connection string:
     ```env
     DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/worksphere_erp
     ```
  3. Ensure the database actually exists:
     ```sql
     CREATE DATABASE worksphere_erp;
     ```

### Problem: SQLite test file lock conflicts during tests
- **Solution**: The backend test suite runs against `apps/api/test.db`. If you terminate tests mid-execution, a lock file might persist. Delete `test.db` and re-run tests; the SQLAlchemy engine will automatically rebuild the schema.

---

## 🏎️ 2. Valkey Connection Errors

### Problem: FastAPI fails on startup with `Valkey is not reachable` or `ConnectionError`
- **Reason**: Valkey is not running or the `VALKEY_URL` environment variable points to the wrong host/port.
- **Solution**:
  1. Confirm Valkey is active on port `6379`:
     ```bash
     # Using valkey-cli (Valkey is Redis-protocol compatible):
     valkey-cli -p 6379 ping
     # Expected output: PONG
     ```
  2. Start Valkey if not running:
     ```bash
     docker run -d --name worksphere-valkey \
       -p 6379:6379 \
       valkey/valkey:latest
     ```
  3. If using Docker Compose, ensure `VALKEY_URL` resolves to the docker container alias:
     - Docker Compose: `VALKEY_URL=redis://valkey:6379`
     - Local dev: `VALKEY_URL=redis://localhost:6379`

---


## 🔌 3. Port Conflicts

### Problem: API fails to bind to port 5000 (`Address already in use`)
- **Reason**: Port `5000` is used by macOS AirPlay Receiver services or another python process.
- **Solution**:
  - **macOS**: Open System Settings > General > AirPlay & Handoff, and uncheck **AirPlay Receiver**.
  - **Windows/Linux**: Find the process locking the port and terminate it:
    ```bash
    # Windows Command Prompt:
    netstat -ano | findstr :5000
    taskkill /PID <PID> /F

    # Linux/macOS:
    lsof -i :5000
    kill -9 <PID>
    ```

### Problem: Frontend fails to bind to port 3000
- **Solution**: Next.js will automatically offer to boot on port `3001` or another port. If it changes, ensure you update `CLIENT_URL` in the backend API `.env` to avoid CORS validation rejections.

---

## 🚀 4. Alembic Migration Failures

### Problem: Migration out of sync error / `Target database is not up to date`
- **Reason**: Alembic versions in the DB `alembic_version` table do not match the local workspace migration files.
- **Solution**:
  1. If in development mode and you want to start fresh:
     ```sql
     DROP SCHEMA public CASCADE;
     CREATE SCHEMA public;
     ```
     Then re-run:
     ```bash
     alembic upgrade head
     ```
  2. If you need to skip a specific migration block, manually insert its version code into the `alembic_version` table:
     ```sql
     INSERT INTO alembic_version (version_num) VALUES ('your_migration_version_hash');
     ```

---

## 🔑 5. JWT validation & Auth Failures

### Problem: Access token rejects login immediately or returns `Signature has expired`
- **Solution**:
  1. Verify the client machine time matches the backend host system. Time-drift of more than 5 minutes causes instant JWT expiry.
  2. Ensure the same `JWT_ACCESS_SECRET` is configured across all backend worker and web processes. If they mismatch, user sessions cannot be parsed.

---

## ✉️ 6. Email SMTP Dispatches Failed

### Problem: Verification codes do not arrive, or logs report `connection timed out`
- **Reason**: Standard SMTP port `25` or `587` is blocked by your ISP or firewall rules.
- **Solution**:
  1. If using Google/Gmail, use App Passwords (not your master Google password).
  2. If on local testing, use [Mailtrap](https://mailtrap.io/) on port `2525` to capture fake outbound dispatches.

---

## 🤖 7. AI Engine Quotas & Failures

### Problem: Recruitment AI reviews return status code `429` (Rate limits or Insufficient quota)
- **Solution**:
  - The backend falls back to mock evaluations if `GOOGLE_GEMINI_KEY` or `OPENAI_API_KEY` is not provided. In development, clear these values from your `.env` to test features locally without incurring API costs.

---

## ⏳ 8. Rate Limiting in Test Suites

### Problem: Pytest returns `AssertionError: {"error":"Rate limit exceeded"}`
- **Reason**: The FastAPI app is guarded by `slowapi` rate-limiting middleware configured to `100/minute`. Running the entire test suite sequentially makes hundreds of requests from the same local IP, exceeding the rate limit.
- **Solution**:
  1. Run test files individually:
     ```bash
     pytest tests/test_supply_chain.py
     pytest tests/test_maintenance.py
     ```
  2. Or disable rate limiting during test executions by setting `default_limits` bypass parameters, or by letting the rate limit bucket reset.

