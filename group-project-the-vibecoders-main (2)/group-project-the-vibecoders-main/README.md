[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/4V-JzE08)

# BudgetMate - Personal Finance Management Application

A full-stack application for managing personal finances with secure authentication, transaction tracking, and AI-powered chat assistance.

---

## 📋 Prerequisites

### System Requirements

Before running this application, ensure you have the following installed:

#### **Universal Requirements**

- **Docker** - Containerization platform - [Download Docker](https://www.docker.com/products/docker-desktop)
- **Docker Compose** - Tool for defining multi-container Docker applications (included with Docker Desktop)

#### **Backend Requirements**

- **Python 3.11+** - [Download Python](https://www.python.org/downloads/)
- **uv** - Fast Python package installer - [Install uv](https://docs.astral.sh/uv/getting-started/installation/)
  - Alternative: `pip install uv` or use your system package manager

#### **Frontend Requirements**

- **Node.js 18+** - JavaScript runtime - [Download Node.js](https://nodejs.org/)
- **pnpm** - Fast, space-efficient package manager - [Install pnpm](https://pnpm.io/installation)
  - Alternative: `npm install -g pnpm` (using npm)

---

## 🚀 Installation Guide

### Backend Setup

1. **Navigate to the backend directory**:

   ```bash
   cd backend
   ```

2. **Start PostgreSQL and Redis using Docker Compose**:

   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database (accessible at `localhost:5432`)
   - Redis cache (accessible at `localhost:6379`)

3. **Install backend dependencies using uv**:

   ```bash
   uv sync
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration:
   - `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql://user:password@localhost/budgetmate`)
   - `REDIS_URL` - Redis connection string (e.g., `redis://localhost:6379`)
   - `SECRET_KEY` - Your secret key for JWT tokens
   - Other required settings as specified in `.env.example`

### Frontend Setup

1. **Navigate to the frontend directory**:

   ```bash
   cd frontend
   ```

2. **Install dependencies using pnpm**:
   ```bash
   pnpm install
   ```

---

## ▶️ Running the Application

### **Ensure Services are Running**

Before running the backend and frontend, make sure Docker services are up:

```bash
cd backend
docker-compose up -d
```

To stop services later:

```bash
docker-compose down
```

### **Backend - Development Mode**

Navigate to the backend directory and run:

```bash
uv run uvicorn app.main:app --reload
```

**Alternative (if uv is not available):**

```bash
uvicorn app.main:app --reload
```

The backend will be available at:

- **API Base URL**: `http://localhost:8000`
- **API Documentation (Swagger UI)**: `http://localhost:8000/docs`
- **Alternative API Docs (ReDoc)**: `http://localhost:8000/redoc`

### **Frontend - Development Mode**

In a separate terminal, navigate to the frontend directory and run:

```bash
pnpm dev
```

The frontend will be available at:

- **Application URL**: `http://localhost:3000`

### **Running All Components Simultaneously**

Open three terminal windows:

**Terminal 1 - Start Docker Services**:

```bash
cd backend
docker-compose up -d
```

**Terminal 2 - Backend**:

```bash
cd backend
uv run uvicorn app.main:app --reload
```

**Terminal 3 - Frontend**:

```bash
cd frontend
pnpm dev
```

Once all services are running, access the application at `http://localhost:3000`

---

## 📚 Additional Commands

### Backend

- **Production build**: `uv run uvicorn app.main:app`
- **Run with specific host/port**: `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Database migrations**: `uv run alembic upgrade head`
- **Create new migration**: `uv run alembic revision --autogenerate -m "migration name"`

### Frontend

- **Production build**: `pnpm build`
- **Start production server**: `pnpm start`
- **Linting**: `pnpm lint`
- **Run with custom port**: `pnpm dev -- -p 3001`

---

## 🔐 Authentication

The backend implements JWT-based authentication with the following features:

- JWT tokens for stateless session management
- HTTP-only cookies for secure refresh tokens
- Protected endpoints (all except `/auth` endpoints require valid Bearer token)

For detailed authentication API documentation, see [api_docs_auth.md](./backend/api_docs_auth.md)

---

## 📁 Project Structure

```
├── backend/              # FastAPI backend application
│   ├── app/
│   │   ├── api/         # API routes (v1)
│   │   ├── core/        # Configuration & security
│   │   ├── modules/     # Feature modules (auth, users, transactions, chatbot)
│   │   ├── shared/      # Shared utilities & exception handlers
│   │   └── main.py      # Application entry point
│   ├── tests/           # Backend tests
│   └── pyproject.toml   # Python dependencies
│
└── frontend/             # Next.js React frontend
    ├── app/             # Next.js app directory
    ├── components/      # React components
    ├── context/         # React context
    ├── hooks/           # Custom React hooks
    ├── lib/             # Utility functions
    ├── styles/          # Global styles
    ├── types/           # TypeScript types
    └── package.json     # Node dependencies
```

---

## 🐛 Troubleshooting

### Docker Services Issues

**Services won't start**:

```bash
docker-compose ps  # Check status
docker-compose logs  # View logs
```

**Port conflicts** (if services already running):

```bash
docker-compose down  # Stop all services
docker-compose up -d  # Restart them
```

**Want to reset database**:

```bash
docker-compose down -v  # Remove containers and volumes
docker-compose up -d  # Start fresh
```

### Backend Issues

**Port 8000 already in use**:

```bash
uv run uvicorn app.main:app --port 8001
```

**Database connection failed**: Ensure Docker services are running with `docker-compose up -d`

**Redis connection failed**: Check that Redis container is running with `docker-compose ps`

### Frontend Issues

**Port 3000 already in use**:

```bash
pnpm dev -- -p 3001
```

**Module not found**: Clear cache and reinstall:

```bash
pnpm install
rm -rf .next
pnpm dev
```

---

## 📝 Environment Variables Reference

### Backend (`.env`)

Default values are configured to work with the Docker services:

```
DATABASE_URL=postgresql://user:password@localhost/budgetmate
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

> **Note**: These defaults match the docker-compose configuration. Modify only if you have custom requirements.

### Frontend (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## ✅ Quick Start Checklist

- [ ] Install Docker and Docker Compose
- [ ] Install Python 3.11+
- [ ] Install uv: `pip install uv`
- [ ] Install Node.js 18+
- [ ] Install pnpm: `npm install -g pnpm`
- [ ] Navigate to backend: `cd backend`
- [ ] Start Docker services: `docker-compose up -d`
- [ ] Install backend dependencies: `uv sync`
- [ ] Navigate to frontend: `cd frontend`
- [ ] Install frontend dependencies: `pnpm install`
- [ ] Start backend (in backend/): `uv run uvicorn app.main:app --reload`
- [ ] Start frontend (in frontend/, new terminal): `pnpm dev`
- [ ] Access app at `http://localhost:3000`

---

## 📞 Support

For issues or questions, please refer to:

- Backend API docs: `http://localhost:8000/docs`
- Authentication guide: [api_docs_auth.md](./backend/api_docs_auth.md)


cd backend
docker-compose up -d
uv sync
uv run uvicorn app.main:app --reload

cd frontend
pnpm install
pnpm dev
