# ContractAlert — Getting Started Guide

## Quick Start

```bash
# 1. Start everything (first time takes a few minutes to download images)
docker compose up --build

# 2. In another terminal, apply the database migrations
docker compose exec backend alembic upgrade head

# 3. Create the first admin (prompts for a password). There is no public sign-up:
#    admins create the other accounts. Re-run it with an existing email to promote that user.
docker compose exec backend python scripts/create_admin.py admin@yourcompany.tn
```

Now open:
- **Frontend**: http://localhost:3000 (sign in with the admin you just created)
- **Backend API docs**: http://localhost:8000/docs (Swagger UI — test endpoints here!)
- **Database**: localhost:5432 (use TablePlus, DBeaver, or pgAdmin to browse)

To start: `docker compose up`
To rebuild after changing Dockerfile or requirements: `docker compose up --build`
After frontend `package.json` changes: `docker compose up --build -V frontend` (`-V` refreshes the container's `node_modules`)
After backend schema changes, regenerate the frontend API types: `cd frontend && npm run gen:api`

---

## Project Structure

```
├── docker-compose.yml          # Runs everything together
├── backend/
│   ├── app/
│   │   ├── main.py             # App entry point — register routers here
│   │   ├── config.py           # Environment variables
│   │   ├── database.py         # Database connection
│   │   ├── models/             # Database tables (SQLAlchemy)
│   │   │   ├── __init__.py     # Import all models here
│   │   │   └── contract.py     # EXAMPLE: Contract model
│   │   ├── schemas/            # API input/output shapes (Pydantic)
│   │   │   ├── __init__.py     # Import all schemas here
│   │   │   └── contract.py     # EXAMPLE: Contract schemas
│   │   ├── services/           # Business logic
│   │   │   ├── __init__.py     # Guide on adding services
│   │   │   └── contract_service.py  # EXAMPLE: Contract service
│   │   └── routers/            # API endpoints
│   │       ├── __init__.py     # Guide on adding routers
│   │       └── contracts.py    # EXAMPLE: Contract endpoints
│   ├── alembic/                # Database migrations
│   └── requirements.txt        # Python dependencies
└── frontend/
    └── src/
        ├── app/                # Pages (file-based routing)
        │   ├── layout.tsx      # Shared layout with sidebar
        │   ├── page.tsx        # Dashboard (home page)
        │   └── contracts/
        │       └── page.tsx    # EXAMPLE: Contracts page
        ├── components/         # Reusable UI pieces
        ├── lib/                # API calls
        │   ├── api.ts          # Base fetch helper
        │   └── contracts-api.ts # EXAMPLE: Contract API calls
        ├── hooks/              # Custom React hooks
        │   └── use-fetch.ts    # Simple data fetching hook
        ├── types/              # TypeScript type definitions
        │   └── contract.ts     # EXAMPLE: Contract types
        └── contexker compose down`
To restart: `dot/            # Shared state (use sparingly)
```

---

## How To: Add a New Feature (e.g., Obligations)

Follow these 6 steps. Each file has detailed comments inside.

### Step 1: Backend Model
Create `backend/app/models/obligation.py`:
```python
from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.database import Base

class Obligation(Base):
    __tablename__ = "obligations"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    due_date = Column(Date, nullable=False)
    contract_id = Column(Integer, ForeignKey("contracts.id"))
```
Then import it in `models/__init__.py` and run migrations:
```bash
docker compose exec backend alembic revision --autogenerate -m "add obligations"
docker compose exec backend alembic upgrade head
```

### Step 2: Backend Schema
Create `backend/app/schemas/obligation.py` with Create, Update, Response classes.

### Step 3: Backend Service
Create `backend/app/services/obligation_service.py` with CRUD functions.

### Step 4: Backend Router
Create `backend/app/routers/obligations.py` and register it in `main.py`:
```python
from app.routers.obligations import router as obligations_router
app.include_router(obligations_router, prefix="/api")
```

### Step 5: Frontend Types + API
- Create `frontend/src/types/obligation.ts`
- Create `frontend/src/lib/obligations-api.ts`

### Step 6: Frontend Page
- Create `frontend/src/app/obligations/page.tsx`
- Add the link in `frontend/src/components/sidebar.tsx`

---

## Common Commands

```bash
# See backend logs
docker compose logs -f backend

# Open a Python shell inside the backend container
docker compose exec backend python

# Install a new Python package
# 1. Add it to requirements.txt
# 2. Rebuild: docker compose up --build backend

# Install a new npm package
docker compose exec frontend npm install <package-name>

# Reset the database completely
docker compose down -v   # -v deletes the volume (all data)
docker compose up --build
```

---

## Tips

- **Test your API first** at http://localhost:8000/docs before writing frontend code
- **Read the comments** in each `__init__.py` file — they have step-by-step guides
- **Keep it simple**: useState + useFetch is enough for most pages
- **Hot reload** works for both frontend and backend — save and see changes instantly
- When stuck on a backend error, check the terminal where `docker compose up` is running
