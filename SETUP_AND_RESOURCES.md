# ContractAlert — Setup & Learning Resources

Welcome to the team! Follow this guide to set up your machine and learn the tools we use.

---

## 1. Tools to Install

Install these **in order** before starting.

### Git (Version Control)
- **Download**: https://git-scm.com/downloads
- Pick your OS (Windows / Mac / Linux) and follow the installer
- After install, open a terminal and verify:
  ```bash
  git --version
  ```

### VS Code (Code Editor)
- **Download**: https://code.visualstudio.com/
- **Recommended extensions** (install from the Extensions tab):
  - **Python** — by Microsoft
  - **Pylance** — by Microsoft (Python autocomplete)
  - **ES7+ React/Redux/React-Native snippets** — quick React templates
  - **Tailwind CSS IntelliSense** — autocomplete for CSS classes
  - **Thunder Client** — test APIs without leaving VS Code (like Postman)
  - **Docker** — by Microsoft (manage containers from VS Code)
  - **PostgreSQL** — by Chris Kolkman (browse your database)

### Docker Desktop (Runs the whole project)
- **Download**: https://www.docker.com/products/docker-desktop/
- Pick your OS and install
- **Windows users**: Docker will ask you to enable WSL 2 — say yes and follow the prompts
- **Mac users**: Pick the right chip (Apple Silicon = M1/M2/M3, Intel = older Macs)
- After install, open Docker Desktop and make sure it says "Docker is running"
- Verify in terminal:
  ```bash
  docker --version
  docker compose version
  ```

### Node.js (For the frontend)
- **Download**: https://nodejs.org/ — pick the **LTS** version (not Current)
- Verify:
  ```bash
  node --version
  npm --version
  ```

### Python (For the backend)
- **Download**: https://www.python.org/downloads/ — get **Python 3.12**
- **Windows users**: Check "Add Python to PATH" during installation!
- Verify:
  ```bash
  python --version
  ```

### Database Browser (Optional but helpful)
Pick one to visually browse the PostgreSQL database:
- **DBeaver** (free, all platforms): https://dbeaver.io/download/
- **pgAdmin** (free, all platforms): https://www.pgadmin.org/download/

Connection settings for the local database:
```
Host: localhost
Port: 5432
Database: contractalert
Username: postgres
Password: postgres
```

---

## 2. Learning Resources

### Docker — What it is and why we use it

**Official docs**: https://docs.docker.com/get-started/

**YouTube — search for**:
- `"Docker in 100 seconds Fireship"` — fast 2-min overview
- `"Docker tutorial for beginners TechWorld with Nana"` — full beginner course
- `"Docker Compose tutorial"` — how multiple containers work together

**What you need to know**:
- A container = a mini computer running one service (backend, database, frontend)
- `docker compose up` starts all 3 containers at once
- `docker compose down` stops them
- `docker compose logs -f backend` shows backend output
- You don't need to be a Docker expert — just know these commands

---

### Python + FastAPI — Our backend framework

**Official tutorial (read this first!)**: https://fastapi.tiangolo.com/tutorial/

**YouTube — search for**:
- `"FastAPI full course for beginners"` — any recent result (2024+)
- `"FastAPI CRUD tutorial"` — closest to what we do in this project
- `"FastAPI SQLAlchemy tutorial"` — how FastAPI talks to a database

**What you need to know**:
- How to define an endpoint (`@router.get`, `@router.post`)
- What Pydantic schemas do (validate input/output)
- How dependency injection works (`Depends(get_db)`)
- How to test endpoints in Swagger UI at http://localhost:8000/docs

---

### SQLAlchemy — How we talk to the database

**Official tutorial**: https://docs.sqlalchemy.org/en/20/tutorial/

**YouTube — search for**:
- `"SQLAlchemy ORM tutorial Python"` — understanding models
- `"SQLAlchemy FastAPI tutorial"` — both tools together

**What you need to know**:
- A model = a Python class that maps to a database table
- `db.query(Contract).all()` = `SELECT * FROM contracts`
- `db.query(Contract).filter(Contract.id == 5).first()` = `SELECT * FROM contracts WHERE id = 5`
- `db.add(contract)` + `db.commit()` = `INSERT INTO contracts ...`

---

### Alembic — Database migrations

**Official tutorial**: https://alembic.sqlalchemy.org/en/latest/tutorial.html

**YouTube — search for**:
- `"Alembic migrations FastAPI"` — how we use it in this project

**What you need to know**:
- When you change a model (add a column, create a table), you need a migration
- Two commands to remember:
  ```bash
  docker compose exec backend alembic revision --autogenerate -m "describe what changed"
  docker compose exec backend alembic upgrade head
  ```

---

### PostgreSQL — Our database

**Official tutorial**: https://www.postgresql.org/docs/current/tutorial.html

**YouTube — search for**:
- `"PostgreSQL tutorial for beginners"` — basic SQL concepts
- `"SQL CRUD operations explained"` — SELECT, INSERT, UPDATE, DELETE

**What you need to know**:
- Basic SQL: SELECT, INSERT, UPDATE, DELETE, WHERE, JOIN
- You won't write raw SQL often — SQLAlchemy does it for you
- But understanding SQL helps you debug when things go wrong

---

### TypeScript — JavaScript with types

**Official handbook**: https://www.typescriptlang.org/docs/handbook/

**YouTube — search for**:
- `"TypeScript in 100 seconds Fireship"` — fast overview
- `"TypeScript for beginners"` — if you're new to it
- `"TypeScript for React developers"` — if you know React already

**What you need to know**:
- `string`, `number`, `boolean` — basic types
- `type Contract = { id: number; title: string }` — defining shapes
- `string | null` — a value that can be a string OR null
- Types catch bugs before you even run the code

---

### React + Next.js — Our frontend framework

**React fundamentals**: https://react.dev/learn
**Next.js tutorial**: https://nextjs.org/learn

**YouTube — search for**:
- `"React in 100 seconds Fireship"` — fast overview
- `"React useState useEffect explained"` — the two hooks you need most
- `"Next.js App Router tutorial"` — how our pages/routing work

**What you need to know**:
- Components = functions that return HTML (JSX)
- `useState` = store data that can change (form inputs, toggles, lists)
- `useEffect` = run code when the page loads (fetch data)
- Next.js file-based routing: `src/app/contracts/page.tsx` = `/contracts` URL
- Our `useFetch` hook wraps useState + useEffect for you

---

### Tailwind CSS — Styling

**Official docs**: https://tailwindcss.com/docs

**YouTube — search for**:
- `"Tailwind CSS crash course"` — learn the class-based approach
- `"Tailwind CSS in 100 seconds Fireship"` — quick overview

**What you need to know**:
- No CSS files — you style directly in the HTML with class names
- `className="text-red-600 font-bold p-4"` = red bold text with padding
- Use the docs search to find any class: https://tailwindcss.com/docs
- VS Code extension gives you autocomplete for all classes

---

### REST APIs — How frontend talks to backend

**YouTube — search for**:
- `"REST API explained for beginners"` — the concept
- `"fetch API JavaScript tutorial"` — how to call APIs from the browser
- `"HTTP methods GET POST PUT DELETE"` — what each one means

**What you need to know**:
- `GET` = read data, `POST` = create, `PUT` = update, `DELETE` = delete
- The frontend sends a request → the backend processes it → returns JSON
- Our `api.ts` helper handles all the fetch logic for you

---

## 3. Recommended Learning Order

If you're new to most of these, follow this order:

| Week | Focus | Goal |
|------|-------|------|
| Day 1 | Install everything above | Get `docker compose up` working |
| Day 1-2 | Docker basics | Understand containers and compose |
| Day 2-3 | SQL + PostgreSQL basics | Understand tables, CRUD queries |
| Day 3-4 | Python + FastAPI tutorial | Create a simple endpoint |
| Day 4-5 | TypeScript + React basics | Understand components and state |
| Week 2 | Next.js + Tailwind | Build your first page |
| Week 2+ | Start on your assigned feature! | Use the Contract example as reference |

---

## 4. Quick Tips

- **When stuck**: check the terminal where `docker compose up` is running — errors show there
- **Test backend first**: always verify your API works at http://localhost:8000/docs before writing frontend code
- **Read the code comments**: every `__init__.py` in the backend has a step-by-step guide
- **Copy the Contract example**: don't start from scratch — duplicate and modify
- **Google the exact error message**: 90% of beginner errors have StackOverflow answers
- **Ask for help after 30 minutes**: if you're stuck for more than 30 minutes, ask — that's what the team is for
