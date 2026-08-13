-- TemplumIS Database Schema (Multi-Tenant Star-Schema)
-- Supports: SaaS, On-Premise, and Hybrid deployments
-- Tenant isolation via institution_id foreign keys

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM (
    'global_admin',
    'institution_admin',
    'vice_chancellor',
    'registrar',
    'scholarship_office',
    'scholarship_reviewer',
    'student',
    'student_services',
    'research_office'
);

CREATE TYPE student_status AS ENUM (
    'active',
    'on_leave',
    'graduated',
    'withdrawn',
    'suspended'
);

CREATE TYPE scholarship_status AS ENUM (
    'open',
    'under_review',
    'awarded',
    'renewed',
    'revoked',
    'closed'
);

CREATE TYPE grant_status AS ENUM (
    'submitted',
    'under_review',
    'active',
    'completed',
    'rejected'
);

CREATE TYPE compliance_status AS ENUM (
    'green',
    'yellow',
    'red'
);

CREATE TYPE ticket_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);

-- ============================================
-- PLATFORM-LEVEL TABLES (Multi-Tenancy)
-- ============================================

CREATE TABLE institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    contact_email VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institution_domains (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(domain)
);

-- ============================================
-- USERS (Platform + Institution scoped)
-- ============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    institution_id INT REFERENCES institutions(id) ON DELETE SET NULL,
    account_category VARCHAR(50),
    student_registration_number VARCHAR(100),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(10),
    verification_code_expires TIMESTAMP,
    invite_token VARCHAR(64),
    invite_token_expires TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DIMENSION TABLES (Institution-scoped)
-- ============================================

CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    degree_level VARCHAR(50) NOT NULL,
    expected_duration_semesters INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cohorts (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    program_id INT REFERENCES programs(id),
    start_year INT NOT NULL,
    start_semester VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE funding_sources (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 'internal', 'external_ngo', 'government', 'donor'
    contact_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FACT TABLE: STUDENTS (Enrollment Module)
-- ============================================

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    user_id INT UNIQUE REFERENCES users(id),
    student_number VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    program_id INT REFERENCES programs(id),
    cohort_id INT REFERENCES cohorts(id),
    status student_status DEFAULT 'active',
    enrollment_date DATE NOT NULL,
    expected_graduation DATE,
    actual_graduation DATE,
    gpa DECIMAL(3, 2),
    credits_completed INT DEFAULT 0,
    credits_required INT NOT NULL DEFAULT 120,
    compliance compliance_status DEFAULT 'green',
    address TEXT,
    date_of_birth DATE,
    current_milestone VARCHAR(100),
    risk_level VARCHAR(50),
    last_advisor_contact_date DATE,
    program_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institution_id, student_number)
);

-- ============================================
-- FACT TABLE: SCHOLARSHIPS (Finance Bridge)
-- ============================================

CREATE TABLE scholarships (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    funding_source_id INT REFERENCES funding_sources(id),
    total_amount DECIMAL(12, 2) NOT NULL,
    disbursed_amount DECIMAL(12, 2) DEFAULT 0,
    eligibility_criteria TEXT,
    min_gpa DECIMAL(3, 2),
    min_credits INT,
    status scholarship_status DEFAULT 'open',
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scholarship_applications (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    scholarship_id INT REFERENCES scholarships(id),
    application_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'pending',
    documents_submitted BOOLEAN DEFAULT FALSE,
    review_notes TEXT,
    awarded_amount DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, scholarship_id)
);

-- ============================================
-- FACT TABLE: GRANTS (Research Module)
-- ============================================

CREATE TABLE grants (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    principal_investigator_id INT REFERENCES users(id),
    funding_source_id INT REFERENCES funding_sources(id),
    department VARCHAR(255),
    total_budget DECIMAL(14, 2) NOT NULL,
    spent_amount DECIMAL(14, 2) DEFAULT 0,
    status grant_status DEFAULT 'submitted',
    start_date DATE,
    end_date DATE,
    irb_clearance_date DATE,
    irb_expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grant_publications (
    id SERIAL PRIMARY KEY,
    grant_id INT REFERENCES grants(id),
    title VARCHAR(500) NOT NULL,
    doi VARCHAR(255),
    orcid_id VARCHAR(50),
    publication_date DATE,
    journal VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SUPPORT TICKETS (Student Support Module)
-- ============================================

CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id INT REFERENCES students(id),
    assigned_to INT REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    status ticket_status DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PLATFORM SETTINGS
-- ============================================

CREATE TABLE platform_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default settings
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES
    ('platform_name', 'TemplumIS', 'Name of the platform'),
    ('support_email', 'support@templumis.com', 'Support contact email'),
    ('allow_registration', 'true', 'Allow new institution registration'),
    ('require_email_verification', 'true', 'Require email verification for new users'),
    ('maintenance_mode', 'false', 'Enable maintenance mode');

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    institution_id INT REFERENCES institutions(id) ON DELETE SET NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_institution_domains_inst ON institution_domains(institution_id);
CREATE INDEX idx_institution_domains_domain ON institution_domains(domain);
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_programs_institution ON programs(institution_id);
CREATE INDEX idx_cohorts_institution ON cohorts(institution_id);
CREATE INDEX idx_funding_sources_institution ON funding_sources(institution_id);
CREATE INDEX idx_students_institution ON students(institution_id);
CREATE INDEX idx_students_program ON students(program_id);
CREATE INDEX idx_students_cohort ON students(cohort_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_compliance ON students(compliance);
CREATE INDEX idx_scholarships_institution ON scholarships(institution_id);
CREATE INDEX idx_scholarships_status ON scholarships(status);
CREATE INDEX idx_grants_institution ON grants(institution_id);
CREATE INDEX idx_grants_status ON grants(status);
CREATE INDEX idx_grants_pi ON grants(principal_investigator_id);
CREATE INDEX idx_support_tickets_institution ON support_tickets(institution_id);
CREATE INDEX idx_support_tickets_student ON support_tickets(student_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_audit_log_institution ON audit_log(institution_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
