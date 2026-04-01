from pydantic import BaseModel, EmailStr
from datetime import datetime


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
    is_active: bool
    created_at: datetime
    domains: list["DomainOut"] = []

    class Config:
        from_attributes = True


class InstitutionUpdate(BaseModel):
    name: str | None = None
    contact_email: str | None = None
    address: str | None = None
    is_active: bool | None = None


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


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None
