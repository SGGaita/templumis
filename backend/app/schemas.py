from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, date
from typing import Optional, List, Dict, Any


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    institution_id: int | None
    institution_name: str | None = None
    institution_logo_url: str | None = None
    enabled_modules: Dict[str, List[str]] | None = None
    account_category: str | None
    student_registration_number: str | None
    email_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class InstitutionCreate(BaseModel):
    name: str
    slug: str
    contact_email: EmailStr | None = None
    address: str | None = None


class InstitutionOut(BaseModel):
    id: int
    name: str
    slug: str
    logo_url: str | None
    contact_email: str | None
    address: str | None
    enabled_modules: Dict[str, List[str]] | None = None
    is_active: bool
    created_at: datetime
    domains: list["DomainOut"] = []

    class Config:
        from_attributes = True

    @field_validator("enabled_modules", mode="before")
    @classmethod
    def _normalize_modules(cls, value):
        from app.institution_modules import normalize_enabled_modules
        return normalize_enabled_modules(value)


class InstitutionUpdate(BaseModel):
    name: str | None = None
    contact_email: str | None = None
    address: str | None = None
    is_active: bool | None = None
    enabled_modules: Dict[str, List[str]] | None = None


class DomainCreate(BaseModel):
    domain: str
    is_primary: bool = False


class DomainUpdate(BaseModel):
    domain: str | None = None
    is_primary: bool | None = None


class DomainOut(BaseModel):
    id: int
    domain: str
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True


class InstitutionAdminCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str


class InstitutionUserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str
    account_category: str | None = None
    student_registration_number: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None


class PlatformSettingsOut(BaseModel):
    platform_name: str
    support_email: str
    allow_registration: bool
    require_email_verification: bool
    maintenance_mode: bool


class PlatformSettingsUpdate(BaseModel):
    platform_name: str | None = None
    support_email: str | None = None
    allow_registration: bool | None = None
    require_email_verification: bool | None = None
    maintenance_mode: bool | None = None


class EmailVerification(BaseModel):
    email: EmailStr
    verification_code: str


# Student Journey Schemas
class JourneyMilestoneCreate(BaseModel):
    student_id: int
    milestone_type: str
    milestone_date: date
    status: str = "pending"
    notes: Optional[str] = None


class JourneyMilestoneUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class JourneyMilestoneOut(BaseModel):
    id: int
    student_id: int
    milestone_type: str
    milestone_date: date
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Student Advisor Schemas
class StudentAdvisorCreate(BaseModel):
    student_id: int
    advisor_id: int
    advisor_type: str
    notes: Optional[str] = None


class StudentAdvisorOut(BaseModel):
    id: int
    student_id: int
    advisor_id: int
    assignment_date: date
    advisor_type: str
    is_active: bool
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Library Resource Schemas
class LibraryResourceCreate(BaseModel):
    institution_id: int
    resource_name: str
    resource_type: str
    url: Optional[str] = None
    description: Optional[str] = None
    access_instructions: Optional[str] = None


class LibraryResourceOut(BaseModel):
    id: int
    institution_id: int
    resource_name: str
    resource_type: str
    url: Optional[str]
    description: Optional[str]
    access_instructions: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Support Resource Link Schemas
class SupportResourceLinkCreate(BaseModel):
    institution_id: int
    resource_category: str
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    office_hours: Optional[str] = None
    program_level_filter: str = "all"


class SupportResourceLinkOut(BaseModel):
    id: int
    institution_id: int
    resource_category: str
    title: str
    description: Optional[str]
    url: Optional[str]
    contact_email: Optional[str]
    phone: Optional[str]
    office_hours: Optional[str]
    program_level_filter: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Student Risk Score Schemas
class RiskScoreOut(BaseModel):
    id: int
    student_id: int
    risk_score: int
    risk_level: str
    risk_factors: Optional[Dict[str, Any]]
    intervention_recommended: bool
    calculated_at: datetime

    class Config:
        from_attributes = True


class RiskScoreCalculate(BaseModel):
    student_id: int


# Postgrad Support Schemas
class PostgradSupportCreate(BaseModel):
    student_id: int
    research_area: Optional[str] = None
    thesis_advisor_id: Optional[int] = None
    thesis_status: Optional[str] = None


class PostgradSupportUpdate(BaseModel):
    research_area: Optional[str] = None
    thesis_advisor_id: Optional[int] = None
    thesis_status: Optional[str] = None
    conference_attendance: Optional[List[Dict[str, Any]]] = None
    publications: Optional[List[Dict[str, Any]]] = None
    grant_applications: Optional[List[Dict[str, Any]]] = None


class PostgradSupportOut(BaseModel):
    id: int
    student_id: int
    research_area: Optional[str]
    thesis_advisor_id: Optional[int]
    thesis_status: Optional[str]
    conference_attendance: Optional[List[Dict[str, Any]]]
    publications: Optional[List[Dict[str, Any]]]
    grant_applications: Optional[List[Dict[str, Any]]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Enhanced Intervention Schemas
class InterventionCreate(BaseModel):
    student_id: int
    alert_id: Optional[int] = None
    intervention_type: str
    intervention_date: date
    intervention_category: Optional[str] = None
    provider: Optional[str] = None
    description: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[date] = None


class InterventionUpdate(BaseModel):
    outcome: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[date] = None
    completion_date: Optional[date] = None
    effectiveness_rating: Optional[int] = None
    success_metric: Optional[str] = None


class InterventionOut(BaseModel):
    id: int
    student_id: int
    alert_id: Optional[int]
    intervention_type: str
    intervention_date: date
    intervention_category: Optional[str]
    provider: Optional[str]
    description: Optional[str]
    outcome: Optional[str]
    follow_up_required: bool
    follow_up_date: Optional[date]
    completion_date: Optional[date]
    effectiveness_rating: Optional[int]
    success_metric: Optional[str]
    created_at: datetime
    created_by: Optional[int]

    class Config:
        from_attributes = True


# Ranking Schemas
class RankingSystemBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool = True


class RankingSystemCreate(RankingSystemBase):
    pass


class RankingSystemOut(RankingSystemBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RankingIndicatorBase(BaseModel):
    ranking_system_id: int
    name: str
    code: str
    description: Optional[str] = None
    weight_percentage: Optional[float] = None
    category: Optional[str] = None
    measurement_unit: Optional[str] = None
    is_active: bool = True


class RankingIndicatorCreate(RankingIndicatorBase):
    pass


class RankingIndicatorOut(RankingIndicatorBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class InstitutionRankingDataBase(BaseModel):
    institution_id: int
    indicator_id: int
    satisfies_indicator: bool = False
    current_value: Optional[float] = None
    target_value: Optional[float] = None
    notes: Optional[str] = None
    last_assessed_date: Optional[date] = None
    assessed_by: Optional[int] = None


class InstitutionRankingDataCreate(InstitutionRankingDataBase):
    pass


class InstitutionRankingDataUpdate(BaseModel):
    satisfies_indicator: Optional[bool] = None
    current_value: Optional[float] = None
    target_value: Optional[float] = None
    notes: Optional[str] = None
    last_assessed_date: Optional[date] = None


class InstitutionRankingDataOut(InstitutionRankingDataBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class InstitutionRankingBase(BaseModel):
    institution_id: int
    ranking_system_id: int
    ranking_year: int
    overall_rank: Optional[int] = None
    overall_score: Optional[float] = None
    national_rank: Optional[int] = None
    regional_rank: Optional[int] = None
    subject_area: Optional[str] = None
    ranking_url: Optional[str] = None


class InstitutionRankingCreate(InstitutionRankingBase):
    pass


class InstitutionRankingOut(InstitutionRankingBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
