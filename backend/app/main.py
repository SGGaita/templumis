from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.models import (  # noqa: F401
    StudentScholarshipApplication,
    StudentGrantApplication,
    ScholarshipProgram,
    ScholarshipTriageConfig,
    ScholarshipReviewAssignment,
)
from app.routes import (
    auth, global_admin, institution_admin, students, sis_lms,
    student_journey, student_support, rankings, rankings_excel, rankings_websocket,
    scholarship_programs, financial_aid, triage, evaluation, awards,
)
from sqlalchemy import text
from app import scholarship_catalog

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
app.include_router(students.router)
app.include_router(sis_lms.router)
app.include_router(student_journey.router)
app.include_router(student_support.router)
app.include_router(rankings.router)
app.include_router(rankings_excel.router)
app.include_router(rankings_websocket.router)
app.include_router(scholarship_programs.router)
app.include_router(financial_aid.router)
app.include_router(financial_aid.grants_router)
app.include_router(triage.router)
app.include_router(evaluation.router)
app.include_router(awards.router)


@app.on_event("startup")
def ensure_scholarship_tables():
    StudentScholarshipApplication.__table__.create(bind=engine, checkfirst=True)
    StudentGrantApplication.__table__.create(bind=engine, checkfirst=True)
    ScholarshipProgram.__table__.create(bind=engine, checkfirst=True)
    ScholarshipTriageConfig.__table__.create(bind=engine, checkfirst=True)
    ScholarshipReviewAssignment.__table__.create(bind=engine, checkfirst=True)
    triage_columns = [
        ("triage_queue", "VARCHAR(50)"),
        ("auto_reject_reason", "TEXT"),
        ("anonymized_id", "VARCHAR(32)"),
        ("documents_verified", "BOOLEAN DEFAULT FALSE"),
        ("documents_verified_at", "TIMESTAMP"),
        ("documents_verified_by", "INTEGER"),
        ("eligibility_snapshot", "JSON DEFAULT '{}'"),
        ("need_index", "INTEGER"),
        ("triage_notes", "TEXT"),
        ("consensus_score", "NUMERIC(5,2)"),
        ("score_std_dev", "NUMERIC(5,2)"),
        ("evaluation_status", "VARCHAR(32)"),
        ("award_stage", "VARCHAR(32)"),
        ("offer_sent_at", "TIMESTAMP"),
        ("offer_deadline", "TIMESTAMP"),
        ("offer_accepted_at", "TIMESTAMP"),
        ("offer_declined_at", "TIMESTAMP"),
        ("approved_at", "TIMESTAMP"),
        ("approved_by", "INTEGER"),
        ("credited_at", "TIMESTAMP"),
        ("offer_data", "JSON DEFAULT '{}'"),
        ("scholarship_probation", "BOOLEAN DEFAULT FALSE"),
    ]
    triage_config_columns = [
        ("variance_threshold", "NUMERIC(4,2) DEFAULT 1.25"),
        ("weight_academic", "NUMERIC(4,3) DEFAULT 0.34"),
        ("weight_need", "NUMERIC(4,3) DEFAULT 0.33"),
        ("weight_lead", "NUMERIC(4,3) DEFAULT 0.33"),
        ("award_budget_pool", "NUMERIC(14,2)"),
    ]
    assignment_score_columns = [
        ("score_academic", "INTEGER"),
        ("score_need", "INTEGER"),
        ("score_lead", "INTEGER"),
        ("composite_score", "NUMERIC(5,2)"),
        ("scored_at", "TIMESTAMP"),
    ]
    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE scholarship_programs "
                "ADD COLUMN IF NOT EXISTS program_kind VARCHAR(20) NOT NULL DEFAULT 'scholarship'"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE student_grant_applications "
                "ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(50) NOT NULL DEFAULT 'proposal_budget'"
            )
        )
        for col, typ in triage_columns:
            conn.execute(
                text(f"ALTER TABLE student_scholarship_applications ADD COLUMN IF NOT EXISTS {col} {typ}")
            )
        for col, typ in triage_config_columns:
            conn.execute(
                text(f"ALTER TABLE scholarship_triage_config ADD COLUMN IF NOT EXISTS {col} {typ}")
            )
        for col, typ in assignment_score_columns:
            conn.execute(
                text(f"ALTER TABLE scholarship_review_assignments ADD COLUMN IF NOT EXISTS {col} {typ}")
            )
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64)"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token_expires TIMESTAMP"))
        try:
            conn.execute(text("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'scholarship_reviewer'"))
        except Exception:
            pass
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        scholarship_catalog.seed_programs_if_empty(db)
    finally:
        db.close()


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
