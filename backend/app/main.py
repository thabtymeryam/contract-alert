import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import SessionLocal
from app.jobs.alert_job import create_scheduler
from app.services.extraction_service import reset_interrupted_extractions
from app.utils.file_upload import UPLOAD_BASE_DIR

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    with SessionLocal() as db:
        reset_interrupted_extractions(db)
    scheduler = create_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown()

# SINGLE FastAPI instance with lifespan, metadata, etc.
app = FastAPI(
    title="ContractAlert API",
    description="Contract management platform for SMEs",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploaded PDFs are not public: they are served by GET /api/contracts/{id}/file, which checks auth
os.makedirs(f"/app/{UPLOAD_BASE_DIR}", exist_ok=True)

# Register Routers
from app.routers import alerts
from app.routers.contracts import router as contracts_router
from app.routers.contract_clauses import router as contract_clause_router
from app.routers.users import router as users_router
from app.routers.login import router as login_router
from app.routers.extraction import router as extraction_router
from app.routers.contract_event import router as contract_event_router
from app.routers.contract_party_router import router as contract_party_router
from app.routers.obligations import router as obligations_router
from app.routers.notifications import router as notifications_router
from app.routers.dashboard import router as dashboard_router

app.include_router(contracts_router, prefix="/api")
app.include_router(contract_clause_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(login_router, prefix="/api")
app.include_router(contract_event_router, prefix="/api")
app.include_router(contract_party_router, prefix="/api")
app.include_router(obligations_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(extraction_router, prefix="/api")
app.include_router(alerts.router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "ContractAlert API is running"}