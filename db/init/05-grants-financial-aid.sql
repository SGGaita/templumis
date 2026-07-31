-- Distinguish scholarship vs grant opportunities; grant applications table

ALTER TABLE scholarship_programs
  ADD COLUMN IF NOT EXISTS program_kind VARCHAR(20) NOT NULL DEFAULT 'scholarship';

CREATE INDEX IF NOT EXISTS idx_scholarship_programs_kind ON scholarship_programs(program_kind);

CREATE TABLE IF NOT EXISTS student_grant_applications (
    id SERIAL PRIMARY KEY,
    institution_id INT REFERENCES institutions(id) ON DELETE CASCADE,
    student_number VARCHAR(100) NOT NULL,
    grant_external_id VARCHAR(50) NOT NULL,
    project_title VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    form_data JSONB DEFAULT '{}',
    amount_requested DECIMAL(12, 2),
    award_amount DECIMAL(12, 2),
    applied_date DATE,
    review_notes TEXT,
    progress_pct INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_number, grant_external_id)
);

CREATE INDEX IF NOT EXISTS idx_sga_student ON student_grant_applications(student_number);
CREATE INDEX IF NOT EXISTS idx_sga_status ON student_grant_applications(status);
