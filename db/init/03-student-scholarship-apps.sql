-- Student scholarship applications (portal drafts + submissions; keyed by student_number)

CREATE TABLE IF NOT EXISTS student_scholarship_applications (
    id SERIAL PRIMARY KEY,
    institution_id INT REFERENCES institutions(id) ON DELETE CASCADE,
    student_number VARCHAR(100) NOT NULL,
    scholarship_external_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    form_data JSONB DEFAULT '{}',
    references_data JSONB DEFAULT '[]',
    ferpa_waived BOOLEAN,
    progress_pct INT DEFAULT 0,
    gpa_at_application DECIMAL(4, 2),
    award_amount DECIMAL(12, 2),
    applied_date DATE,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_number, scholarship_external_id)
);

CREATE INDEX IF NOT EXISTS idx_ssa_student ON student_scholarship_applications(student_number);
CREATE INDEX IF NOT EXISTS idx_ssa_status ON student_scholarship_applications(status);
