from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Date, Enum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    GLOBAL_ADMIN = "global_admin"
    INSTITUTION_ADMIN = "institution_admin"
    VICE_CHANCELLOR = "vice_chancellor"
    REGISTRAR = "registrar"
    SCHOLARSHIP_OFFICE = "scholarship_office"
    SCHOLARSHIP_REVIEWER = "scholarship_reviewer"
    STUDENT = "student"
    STUDENT_SERVICES = "student_services"
    RESEARCH_OFFICE = "research_office"


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    logo_url = Column(String(500))
    contact_email = Column(String(255))
    address = Column(Text)
    enabled_modules = Column(JSON, nullable=True)
    staff_role_modules = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    domains = relationship("InstitutionDomain", back_populates="institution", cascade="all, delete-orphan")
    users = relationship("User", back_populates="institution")


class InstitutionDomain(Base):
    __tablename__ = "institution_domains"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    domain = Column(String(255), unique=True, nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    institution = relationship("Institution", back_populates="domains")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, name="user_role", create_type=False, values_callable=lambda x: [e.value for e in x]), nullable=False)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True)
    account_category = Column(String(50), nullable=True)
    student_registration_number = Column(String(100), nullable=True)
    email_verified = Column(Boolean, default=False)
    verification_code = Column(String(10), nullable=True)
    verification_code_expires = Column(DateTime, nullable=True)
    invite_token = Column(String(64), nullable=True, index=True)
    invite_token_expires = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    institution = relationship("Institution", back_populates="users")


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(Text, nullable=False)
    description = Column(Text)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    department = Column(String(255))
    degree_level = Column(String(50))
    expected_duration_years = Column(Integer)
    minimum_gpa = Column(Numeric(3, 2))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    students = relationship("Student", back_populates="program")


class Cohort(Base):
    __tablename__ = "cohorts"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    start_year = Column(Integer, nullable=False)
    start_semester = Column(String(50))
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    students = relationship("Student", back_populates="cohort")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    student_number = Column(String(100), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="SET NULL"), nullable=True)
    cohort_id = Column(Integer, ForeignKey("cohorts.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="active")
    compliance = Column(String(50), default="green")
    gpa = Column(Numeric(3, 2))
    credits_completed = Column(Integer, default=0)
    enrollment_date = Column(Date, nullable=False)
    expected_graduation = Column(Date)
    actual_graduation = Column(Date)
    address = Column(Text)
    date_of_birth = Column(Date)
    current_milestone = Column(String(100))
    risk_level = Column(String(50))
    last_advisor_contact_date = Column(Date)
    program_level = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    program = relationship("Program", back_populates="students")
    cohort = relationship("Cohort", back_populates="students")


class StudentMilestone(Base):
    __tablename__ = "student_milestones"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    milestone_type = Column(String(50), nullable=False)
    milestone_date = Column(Date, nullable=False)
    academic_year = Column(String(20))
    semester = Column(String(20))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))


class StudentStatusHistory(Base):
    __tablename__ = "student_status_history"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    old_status = Column(String(50))
    new_status = Column(String(50), nullable=False)
    old_compliance = Column(String(50))
    new_compliance = Column(String(50))
    change_date = Column(DateTime, server_default=func.now())
    reason = Column(Text)
    changed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    notes = Column(Text)


class StudentWithdrawal(Base):
    __tablename__ = "student_withdrawals"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    withdrawal_date = Column(Date, nullable=False)
    withdrawal_reason = Column(String(100), nullable=False)
    detailed_reason = Column(Text)
    academic_year = Column(String(20))
    semester = Column(String(20))
    gpa_at_withdrawal = Column(Numeric(3, 2))
    credits_at_withdrawal = Column(Integer)
    financial_balance = Column(Numeric(12, 2))
    exit_interview_completed = Column(Boolean, default=False)
    exit_interview_notes = Column(Text)
    is_eligible_for_readmission = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))


class SemesterEnrollment(Base):
    __tablename__ = "semester_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(20), nullable=False)
    semester = Column(String(20), nullable=False)
    enrollment_date = Column(Date, nullable=False)
    is_enrolled = Column(Boolean, default=True)
    credits_enrolled = Column(Integer, default=0)
    is_full_time = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class CohortRetentionMetric(Base):
    __tablename__ = "cohort_retention_metrics"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    cohort_id = Column(Integer, ForeignKey("cohorts.id", ondelete="CASCADE"), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="SET NULL"))
    snapshot_date = Column(Date, nullable=False)
    initial_cohort_size = Column(Integer, nullable=False)
    current_enrolled = Column(Integer, nullable=False)
    graduated = Column(Integer, default=0)
    withdrawn = Column(Integer, default=0)
    on_leave = Column(Integer, default=0)
    transferred_out = Column(Integer, default=0)
    retention_rate_1yr = Column(Numeric(5, 2))
    retention_rate_2yr = Column(Numeric(5, 2))
    retention_rate_3yr = Column(Numeric(5, 2))
    retention_rate_4yr = Column(Numeric(5, 2))
    graduation_rate_4yr = Column(Numeric(5, 2))
    graduation_rate_5yr = Column(Numeric(5, 2))
    graduation_rate_6yr = Column(Numeric(5, 2))
    avg_gpa = Column(Numeric(3, 2))
    avg_credits_completed = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class EarlyWarningAlert(Base):
    __tablename__ = "early_warning_alerts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)
    alert_date = Column(Date, server_default=func.current_date())
    description = Column(Text)
    is_resolved = Column(Boolean, default=False)
    resolved_date = Column(Date)
    resolution_notes = Column(Text)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class StudentIntervention(Base):
    __tablename__ = "student_interventions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    alert_id = Column(Integer, ForeignKey("early_warning_alerts.id", ondelete="SET NULL"))
    intervention_type = Column(String(100), nullable=False)
    intervention_date = Column(Date, nullable=False)
    provider = Column(String(255))
    description = Column(Text)
    outcome = Column(Text)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(Date)
    intervention_category = Column(String(100))
    success_metric = Column(Text)
    completion_date = Column(Date)
    effectiveness_rating = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(String(45))
    created_at = Column(DateTime, server_default=func.now())


class StudentJourneyMilestone(Base):
    __tablename__ = "student_journey_milestones"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    milestone_type = Column(String(100), nullable=False)
    milestone_date = Column(Date, nullable=False)
    status = Column(String(50), default="pending")
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class StudentAdvisor(Base):
    __tablename__ = "student_advisors"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    advisor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assignment_date = Column(Date, server_default=func.current_date())
    advisor_type = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class LibraryResource(Base):
    __tablename__ = "library_resources"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    resource_name = Column(String(255), nullable=False)
    resource_type = Column(String(100), nullable=False)
    url = Column(String(500))
    description = Column(Text)
    access_instructions = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class SupportResourceLink(Base):
    __tablename__ = "support_resource_links"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    resource_category = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    url = Column(String(500))
    contact_email = Column(String(255))
    phone = Column(String(50))
    office_hours = Column(Text)
    program_level_filter = Column(String(50), default="all")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class StudentRiskScore(Base):
    __tablename__ = "student_risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    risk_score = Column(Integer, nullable=False, default=0)
    risk_level = Column(String(50), nullable=False)
    risk_factors = Column(JSON)
    intervention_recommended = Column(Boolean, default=False)
    calculated_at = Column(DateTime, server_default=func.now())


class PostgradSupport(Base):
    __tablename__ = "postgrad_support"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, unique=True)
    research_area = Column(Text)
    thesis_advisor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    thesis_status = Column(String(50))
    conference_attendance = Column(JSON)
    publications = Column(JSON)
    grant_applications = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class RankingSystem(Base):
    __tablename__ = "ranking_systems"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    code = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    website_url = Column(String(500))
    logo_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class RankingIndicator(Base):
    __tablename__ = "ranking_indicators"
    
    id = Column(Integer, primary_key=True, index=True)
    ranking_system_id = Column(Integer, ForeignKey("ranking_systems.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(100), nullable=False)
    description = Column(Text)
    weight_percentage = Column(Numeric(5, 2))
    category = Column(String(100))
    measurement_unit = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class InstitutionRankingData(Base):
    __tablename__ = "institution_ranking_data"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    indicator_id = Column(Integer, ForeignKey("ranking_indicators.id", ondelete="CASCADE"), nullable=False)
    satisfies_indicator = Column(Boolean, default=False)
    current_value = Column(Numeric(10, 2))
    target_value = Column(Numeric(10, 2))
    notes = Column(Text)
    last_assessed_date = Column(Date)
    assessed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ScholarshipProgram(Base):
    """Admin-configured scholarship opportunity (catalogue)."""

    __tablename__ = "scholarship_programs"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(50), unique=True, nullable=False, index=True)
    program_kind = Column(String(20), nullable=False, default="scholarship", index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    sponsoring_entity = Column(String(255), nullable=True)
    gl_code = Column(String(64), nullable=True)
    program_type = Column(String(64), nullable=False, default="General")
    criteria_text = Column(Text, nullable=True)
    value_kes = Column(Numeric(12, 2), nullable=False, default=0)
    coverage = Column(String(128), nullable=True)
    slots_available = Column(Integer, nullable=False, default=0)
    slots_filled = Column(Integer, nullable=False, default=0)
    workflow_status = Column(String(32), nullable=False, default="draft")
    budget_total_allocated = Column(Numeric(14, 2), nullable=True)
    valuation_type = Column(String(32), nullable=False, default="fixed_sum")
    valuation_config = Column(JSON, default=dict)
    eligibility_rules = Column(JSON, default=dict)
    logic_expression = Column(JSON, default=dict)
    over_award_tolerance_pct = Column(Numeric(5, 2), default=100)
    min_gpa = Column(Numeric(4, 2), nullable=True)
    requires_references = Column(Integer, default=0)
    academic_year = Column(String(32), default="Any")
    open_to = Column(String(128), default="All")
    application_deadline = Column(Date, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class StudentGrantApplication(Base):
    """Research / innovation grant applications."""

    __tablename__ = "student_grant_applications"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=True)
    student_number = Column(String(100), nullable=False, index=True)
    grant_external_id = Column(String(50), nullable=False, index=True)
    project_title = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="draft")
    lifecycle_stage = Column(String(50), nullable=False, default="proposal_budget")
    form_data = Column(JSON, default=dict)
    amount_requested = Column(Numeric(12, 2), nullable=True)
    award_amount = Column(Numeric(12, 2), nullable=True)
    applied_date = Column(Date, nullable=True)
    review_notes = Column(Text, nullable=True)
    progress_pct = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class StudentScholarshipApplication(Base):
    """Portal scholarship applications (draft / submitted / awarded)."""

    __tablename__ = "student_scholarship_applications"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=True)
    student_number = Column(String(100), nullable=False, index=True)
    scholarship_external_id = Column(String(50), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="draft")
    form_data = Column(JSON, default=dict)
    references_data = Column(JSON, default=list)
    ferpa_waived = Column(Boolean, nullable=True)
    progress_pct = Column(Integer, default=0)
    gpa_at_application = Column(Numeric(4, 2), nullable=True)
    award_amount = Column(Numeric(12, 2), nullable=True)
    applied_date = Column(Date, nullable=True)
    review_notes = Column(Text, nullable=True)
    # Stage 4 — administrative triage
    triage_queue = Column(String(50), nullable=True, index=True)
    auto_reject_reason = Column(Text, nullable=True)
    anonymized_id = Column(String(32), nullable=True, index=True)
    documents_verified = Column(Boolean, default=False)
    documents_verified_at = Column(DateTime, nullable=True)
    documents_verified_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    eligibility_snapshot = Column(JSON, default=dict)
    need_index = Column(Integer, nullable=True)
    triage_notes = Column(Text, nullable=True)
    # Stage 5 — consensus scoring
    consensus_score = Column(Numeric(5, 2), nullable=True)
    score_std_dev = Column(Numeric(5, 2), nullable=True)
    evaluation_status = Column(String(32), nullable=True, index=True)
    # Stage 6–7 — award & disbursement
    award_stage = Column(String(32), nullable=True, index=True)
    offer_sent_at = Column(DateTime, nullable=True)
    offer_deadline = Column(DateTime, nullable=True)
    offer_accepted_at = Column(DateTime, nullable=True)
    offer_declined_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    credited_at = Column(DateTime, nullable=True)
    offer_data = Column(JSON, default=dict)
    scholarship_probation = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    review_assignments = relationship(
        "ScholarshipReviewAssignment",
        back_populates="application",
        cascade="all, delete-orphan",
    )


class ScholarshipTriageConfig(Base):
    """Per-institution triage / blind-review settings."""

    __tablename__ = "scholarship_triage_config"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=True, unique=True)
    blind_review_enabled = Column(Boolean, default=False)
    min_reviewers_per_application = Column(Integer, default=2)
    cycle_year = Column(Integer, nullable=False, default=2026)
    anonymization_salt = Column(String(64), nullable=False, default="templumis-cycle-salt")
    # Stage 5 — committee evaluation
    variance_threshold = Column(Numeric(4, 2), default=1.25)
    weight_academic = Column(Numeric(4, 3), default=0.34)
    weight_need = Column(Numeric(4, 3), default=0.33)
    weight_lead = Column(Numeric(4, 3), default=0.33)
    award_budget_pool = Column(Numeric(14, 2), nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class ScholarshipReviewAssignment(Base):
    """Committee reviewer workload assignments."""

    __tablename__ = "scholarship_review_assignments"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(
        Integer,
        ForeignKey("student_scholarship_applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reviewer_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_slot = Column(Integer, default=1)
    status = Column(String(30), default="pending")
    score_academic = Column(Integer, nullable=True)
    score_need = Column(Integer, nullable=True)
    score_lead = Column(Integer, nullable=True)
    composite_score = Column(Numeric(5, 2), nullable=True)
    scored_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    application = relationship("StudentScholarshipApplication", back_populates="review_assignments")


class InstitutionRanking(Base):
    __tablename__ = "institution_rankings"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    ranking_system_id = Column(Integer, ForeignKey("ranking_systems.id", ondelete="CASCADE"), nullable=False)
    ranking_year = Column(Integer, nullable=False)
    overall_rank = Column(Integer)
    overall_score = Column(Numeric(10, 2))
    national_rank = Column(Integer)
    regional_rank = Column(Integer)
    subject_area = Column(String(255))
    ranking_url = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
