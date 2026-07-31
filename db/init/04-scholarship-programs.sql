-- Scholarship opportunity catalogue (admin-configured; replaces Excel Scholarships sheet)

CREATE TABLE IF NOT EXISTS scholarship_programs (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(50) NOT NULL UNIQUE,
    institution_id INT REFERENCES institutions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sponsoring_entity VARCHAR(255),
    gl_code VARCHAR(64),
    program_type VARCHAR(64) NOT NULL DEFAULT 'General',
    criteria_text TEXT,
    value_kes DECIMAL(12, 2) NOT NULL DEFAULT 0,
    coverage VARCHAR(128),
    slots_available INT NOT NULL DEFAULT 0,
    slots_filled INT NOT NULL DEFAULT 0,
    workflow_status VARCHAR(32) NOT NULL DEFAULT 'draft',
    budget_total_allocated DECIMAL(14, 2),
    valuation_type VARCHAR(32) NOT NULL DEFAULT 'fixed_sum',
    valuation_config JSONB DEFAULT '{}',
    eligibility_rules JSONB DEFAULT '{}',
    logic_expression JSONB DEFAULT '{}',
    over_award_tolerance_pct DECIMAL(5, 2) DEFAULT 100,
    min_gpa DECIMAL(4, 2),
    requires_references INT DEFAULT 0,
    academic_year VARCHAR(32) DEFAULT 'Any',
    open_to VARCHAR(128) DEFAULT 'All',
    application_deadline DATE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scholarship_programs_workflow ON scholarship_programs(workflow_status);
CREATE INDEX IF NOT EXISTS idx_scholarship_programs_institution ON scholarship_programs(institution_id);
