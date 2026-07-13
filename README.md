# WorkSphere ERP
> "Work Without Weight."

WorkSphere ERP is a production-grade, highly modular Enterprise Resource Planning system built for organizations of 20 to 50,000 employees. It features robust, fine-grained access control, real-time background workflows, automated asset maintenance schedulers, AI recruitment interview assessments, and supply chain logistics controls.

---

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 15 (React 18)
- **Styling:** Tailwind CSS 3 & Vanilla CSS Custom Tokens
- **State Management:** Zustand & TanStack Query (React Query)
- **Routing:** React Router Dom (integrated SPA router inside Next.js page)
- **Build Tool:** Webpack (Next.js builder)

### Backend
- **Framework:** Python 3.12 + FastAPI
- **WebServer:** Uvicorn
- **ORM:** SQLAlchemy 2.0
- **Database Migrations:** Alembic
- **In-Memory Datastore:** Valkey (Redis-protocol compatible — cache, sessions, rate-limiting)

### Core Infrastructure & Integrations
- **Databases:** Neon PostgreSQL 16 (Transactional serverless DB) + Valkey (In-Memory Cache, Sessions & Rate-Limiting)
- **File Storage:** Cloudinary
- **Security:** HS256 JWT Hashing (Access + Refresh) + Password hashing (Bcrypt) + TOTP MFA
- **AI Engine:** Google Gemini, OpenAI GPT, Anthropic Claude, and DeepSeek (integrations ready for feature flags)

---

## 📁 Repository Structure

```text
project-erp-website/
├── apps/
│   ├── web/                     # React/Next.js frontend portal
│   │   ├── src/
│   │   │   ├── components/      # UI, layout, and shared design components
│   │   │   ├── pages/           # Modular dashboards (SCM, HR, CMMS)
│   │   │   ├── router/          # SPA routing setups
│   │   │   ├── services/        # Frontend API Axios bindings
│   │   │   └── store/           # Zustand state variables
│   │   └── next.config.js       # Webpack/Next.js configs
│   │
│   └── api/                     # Python/FastAPI backend core
│       ├── app/
│       │   ├── api/             # Endpoint routers grouped by module
│       │   ├── core/            # Database engine, JWT, and auth configs
│       │   ├── models/          # Declarative SQLAlchemy tables
│       │   ├── repositories/    # Transaction helpers
│       │   ├── schemas/         # Pydantic request/response schemas
│       │   └── services/        # Multi-module business logic services
│       ├── alembic/             # Alembic migration revisions
│       ├── tests/               # Python unit and integration tests
│       └── requirements.txt     # Python backend dependencies
│
├── docker-compose.yml           # Multi-container orchestration (Postgres, Valkey, Backend, Frontend)
├── .env.example                 # Template for system configurations
└── README.md                    # Project overview
```



## 📖 Available Guides

For setting up and running this application, please consult the dedicated documentation files:

1. 🛠️ **[SETUP.md](file:///w:/V%20S%20Code%20files/project-erp-website/SETUP.md)**: Standard developer installation, database creation, migrations, and process startup instructions.
2. 🏃 **[RUN_PROJECT.md](file:///w:/V%20S%20Code%20files/project-erp-website/RUN_PROJECT.md)**: Step-by-step instructions to run in Dev, Test, Staging, Production, and containerized Docker environments.
3. 🗄️ **[DATABASE_SETUP.md](file:///w:/V%20S%20Code%20files/project-erp-website/DATABASE_SETUP.md)**: Details on configuring and seeding WorkSphere ERP databases.
4. 🌩️ **[NEON_SETUP.md](file:///w:/V%20S%20Code%20files/project-erp-website/NEON_SETUP.md)**: Details on setting up and optimizing the serverless Neon PostgreSQL.
5. 🗂️ **[ALEMBIC_GUIDE.md](file:///w:/V%20S%20Code%20files/project-erp-website/ALEMBIC_GUIDE.md)**: Alembic migration setup, generation, execution, and rollback CLI commands.
6. 🔑 **[API_KEYS.md](file:///w:/V%20S%20Code%20files/project-erp-website/API_KEYS.md)**: Walkthrough to obtain key integration credentials (Cloudinary, Google, Twilio, OpenAI, etc.).
7. 🩺 **[TROUBLESHOOTING.md](file:///w:/V%20S%20Code%20files/project-erp-website/TROUBLESHOOTING.md)**: Common failure points, port conflicts, migration locks, and resolution protocols.

---

## 📝 License

Proprietary — WorkSphere Technologies Pvt. Ltd. All rights reserved.
