from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import auth, global_admin, institution_admin

app = FastAPI(
    title="TemplumIS API",
    description="Open Infrastructure enrollment, grants, and scholarship API for institutional intelligence.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(global_admin.router)
app.include_router(institution_admin.router)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "templumis-api", "version": "0.2.0"}


@app.get("/api")
async def root():
    return {
        "message": "Welcome to the TemplumIS API",
        "docs": "/docs",
        "modules": [
            "enrollment",
            "scholarships",
            "student-support",
            "grants",
        ],
    }
