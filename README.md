# WorkSphere ERP
> "Work Without Weight."

Production-grade Enterprise Resource Planning system built for organizations of 20 to 50,000 employees.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite 5 + Tailwind CSS 3
- **Backend:** Node.js 20 + Express + TypeScript
- **Database:** MongoDB 7 + Redis 7
- **File Storage:** Cloudinary
- **Auth:** JWT (access + refresh) + TOTP MFA

## Quick Start

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10
- MongoDB (local or Atlas)
- Redis (local or Upstash)

### 1. Clone & Install
```bash
git clone <repo-url>
cd worksphere-erp
npm install
```

### 2. Configure Environment
```bash
cp .env.example apps/api/.env
# Edit apps/api/.env with your credentials
```

### 3. Run Development
```bash
# Both frontend + backend
npm run dev

# Frontend only (uses mock data)
npm run dev:web

# Backend only
npm run dev:api
```

Frontend: http://localhost:5173  
API: http://localhost:5000

## Project Structure
```
worksphere-erp/
├── apps/
│   ├── web/        # React 18 frontend
│   └── api/        # Node.js backend
├── packages/
│   └── shared/     # Shared TypeScript types
├── docker-compose.yml
└── .env.example
```

## Default Credentials (Development)
```
Email:    admin@worksphere.com
Password: Admin@123
Role:     Super Admin
```

## License
Proprietary — WorkSphere Technologies Pvt. Ltd.
