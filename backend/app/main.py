from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

from app.database import engine
from app import models
from app.routes import auth, tasks, profile

load_dotenv()

# Create all tables
models.Base.metadata.create_all(bind=engine)

# Create upload directory
os.makedirs("uploads/profiles", exist_ok=True)

app = FastAPI(
    title="Task Manager API",
    description="A Task Manager REST API with JWT auth, profiles, scheduling & motivation",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Serve uploaded profile pictures ──────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(profile.router)


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"message": "Task Manager API v2.0 is running", "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy", "version": "2.0.0"}