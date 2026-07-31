-- ============================================
-- RETENTION & LIFECYCLE TRACKING SCHEMA
-- ============================================
-- Purpose: Track student lifecycle milestones, status changes, 
-- and enable retention analytics

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE milestone_type AS ENUM (
    'application_submitted',
    'admitted',
    'enrolled',
    'first_semester_complete',
    'first_year_complete',
    'second_year_complete',
    'third_year_complete',
    'fourth_year_complete',
    'thesis_submitted',
    'graduated',
    'withdrawn',
    'transferred_out',
    'transferred_in'
);

CREATE TYPE withdrawal_reason AS ENUM (
    'academic_performance',
    'financial_difficulties',
    'personal_reasons',
    'health_issues',
    'transfer_to_other_institution',
    'employment_opportunity',
    'family_obligations',
    'dissatisfaction_with_program',
    'relocation',
    'other'
);

-- ============================================
-- STUDENT LIFECYCLE MILESTONES
-- ============================================

CREATE TABLE student_milestones (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    milestone_type milestone_type NOT NULL,
    milestone_date DATE NOT NULL,
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_milestones_student ON student_milestones(student_id);
CREATE INDEX idx_milestones_type ON student_milestones(milestone_type);
CREATE INDEX idx_milestones_date ON student_milestones(milestone_date);

-- ============================================
-- STUDENT STATUS HISTORY
-- ============================================

CREATE TABLE student_status_history (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    old_status student_status,
    new_status student_status NOT NULL,
    old_compliance compliance_status,
    new_compliance compliance_status,
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    changed_by INT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT
);

CREATE INDEX idx_status_history_student ON student_status_history(student_id);
CREATE INDEX idx_status_history_date ON student_status_history(change_date);
CREATE INDEX idx_status_history_new_status ON student_status_history(new_status);

-- ============================================
-- WITHDRAWAL/DROPOUT TRACKING
-- ============================================

CREATE TABLE student_withdrawals (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    withdrawal_date DATE NOT NULL,
    withdrawal_reason withdrawal_reason NOT NULL,
    detailed_reason TEXT,
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    gpa_at_withdrawal DECIMAL(3, 2),
    credits_at_withdrawal INT,
    financial_balance DECIMAL(12, 2),
    exit_interview_completed BOOLEAN DEFAULT FALSE,
    exit_interview_notes TEXT,
    is_eligible_for_readmission BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_withdrawals_student ON student_withdrawals(student_id);
CREATE INDEX idx_withdrawals_date ON student_withdrawals(withdrawal_date);
CREATE INDEX idx_withdrawals_reason ON student_withdrawals(withdrawal_reason);

-- ============================================
-- SEMESTER ENROLLMENT TRACKING
-- ============================================

CREATE TABLE semester_enrollments (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    enrollment_date DATE NOT NULL,
    is_enrolled BOOLEAN DEFAULT TRUE,
    credits_enrolled INT DEFAULT 0,
    is_full_time BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, academic_year, semester)
);

CREATE INDEX idx_semester_enrollments_student ON semester_enrollments(student_id);
CREATE INDEX idx_semester_enrollments_year ON semester_enrollments(academic_year);
CREATE INDEX idx_semester_enrollments_semester ON semester_enrollments(semester);

-- ============================================
-- COHORT RETENTION SNAPSHOTS
-- ============================================
-- Pre-calculated retention metrics for performance

CREATE TABLE cohort_retention_metrics (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    cohort_id INT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    program_id INT REFERENCES programs(id) ON DELETE SET NULL,
    snapshot_date DATE NOT NULL,
    
    -- Cohort size metrics
    initial_cohort_size INT NOT NULL,
    current_enrolled INT NOT NULL,
    graduated INT DEFAULT 0,
    withdrawn INT DEFAULT 0,
    on_leave INT DEFAULT 0,
    transferred_out INT DEFAULT 0,
    
    -- Retention rates (as percentages)
    retention_rate_1yr DECIMAL(5, 2),
    retention_rate_2yr DECIMAL(5, 2),
    retention_rate_3yr DECIMAL(5, 2),
    retention_rate_4yr DECIMAL(5, 2),
    
    -- Graduation rates
    graduation_rate_4yr DECIMAL(5, 2),
    graduation_rate_5yr DECIMAL(5, 2),
    graduation_rate_6yr DECIMAL(5, 2),
    
    -- Average metrics
    avg_gpa DECIMAL(3, 2),
    avg_credits_completed INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(cohort_id, program_id, snapshot_date)
);

CREATE INDEX idx_cohort_metrics_institution ON cohort_retention_metrics(institution_id);
CREATE INDEX idx_cohort_metrics_cohort ON cohort_retention_metrics(cohort_id);
CREATE INDEX idx_cohort_metrics_program ON cohort_retention_metrics(program_id);
CREATE INDEX idx_cohort_metrics_date ON cohort_retention_metrics(snapshot_date);

-- ============================================
-- EARLY WARNING INDICATORS
-- ============================================

CREATE TABLE early_warning_alerts (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,  -- 'low_gpa', 'low_attendance', 'missing_assignments', 'financial_hold', etc.
    severity VARCHAR(20) NOT NULL,  -- 'low', 'medium', 'high', 'critical'
    alert_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_date DATE,
    resolution_notes TEXT,
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_early_warning_student ON early_warning_alerts(student_id);
CREATE INDEX idx_early_warning_type ON early_warning_alerts(alert_type);
CREATE INDEX idx_early_warning_severity ON early_warning_alerts(severity);
CREATE INDEX idx_early_warning_resolved ON early_warning_alerts(is_resolved);
CREATE INDEX idx_early_warning_date ON early_warning_alerts(alert_date);

-- ============================================
-- INTERVENTION TRACKING
-- ============================================

CREATE TABLE student_interventions (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    alert_id INT REFERENCES early_warning_alerts(id) ON DELETE SET NULL,
    intervention_type VARCHAR(100) NOT NULL,  -- 'academic_advising', 'tutoring', 'counseling', 'financial_aid', etc.
    intervention_date DATE NOT NULL,
    provider VARCHAR(255),  -- Who provided the intervention
    description TEXT,
    outcome TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_interventions_student ON student_interventions(student_id);
CREATE INDEX idx_interventions_alert ON student_interventions(alert_id);
CREATE INDEX idx_interventions_type ON student_interventions(intervention_type);
CREATE INDEX idx_interventions_date ON student_interventions(intervention_date);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Current retention rates by cohort
CREATE OR REPLACE VIEW v_cohort_retention_current AS
SELECT 
    c.id as cohort_id,
    c.name as cohort_name,
    c.start_year,
    i.name as institution_name,
    COUNT(s.id) as initial_size,
    COUNT(CASE WHEN s.status = 'active' THEN 1 END) as currently_active,
    COUNT(CASE WHEN s.status = 'graduated' THEN 1 END) as graduated,
    COUNT(CASE WHEN s.status = 'withdrawn' THEN 1 END) as withdrawn,
    COUNT(CASE WHEN s.status = 'on_leave' THEN 1 END) as on_leave,
    ROUND(
        (COUNT(CASE WHEN s.status IN ('active', 'graduated') THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(s.id), 0)) * 100, 2
    ) as retention_rate
FROM cohorts c
JOIN institutions i ON c.institution_id = i.id
LEFT JOIN students s ON s.cohort_id = c.id
GROUP BY c.id, c.name, c.start_year, i.name;

-- Students at risk with active alerts
CREATE OR REPLACE VIEW v_students_at_risk AS
SELECT 
    s.id as student_id,
    s.student_number,
    s.full_name,
    s.email,
    s.status,
    s.compliance_status,
    s.gpa,
    p.name as program_name,
    c.name as cohort_name,
    COUNT(ewa.id) as active_alerts,
    MAX(ewa.severity) as highest_severity,
    STRING_AGG(DISTINCT ewa.alert_type, ', ') as alert_types
FROM students s
LEFT JOIN programs p ON s.program_id = p.id
LEFT JOIN cohorts c ON s.cohort_id = c.id
LEFT JOIN early_warning_alerts ewa ON s.id = ewa.student_id AND ewa.is_resolved = FALSE
WHERE s.status = 'active'
GROUP BY s.id, s.student_number, s.full_name, s.email, s.status, s.compliance_status, s.gpa, p.name, c.name
HAVING COUNT(ewa.id) > 0
ORDER BY COUNT(ewa.id) DESC, s.compliance_status DESC;

-- Graduation rates by program
CREATE OR REPLACE VIEW v_graduation_rates_by_program AS
SELECT 
    p.id as program_id,
    p.name as program_name,
    p.institution_id,
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT CASE WHEN s.status = 'graduated' THEN s.id END) as graduated_students,
    ROUND(
        (COUNT(DISTINCT CASE WHEN s.status = 'graduated' THEN s.id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT s.id), 0)) * 100, 2
    ) as graduation_rate,
    AVG(CASE WHEN s.status = 'graduated' AND s.actual_graduation IS NOT NULL 
        THEN EXTRACT(YEAR FROM AGE(s.actual_graduation, s.enrollment_date)) 
    END) as avg_years_to_graduate
FROM programs p
LEFT JOIN students s ON s.program_id = p.id
GROUP BY p.id, p.name, p.institution_id;

-- ============================================
-- FUNCTIONS FOR RETENTION CALCULATIONS
-- ============================================

-- Function to calculate retention rate for a specific cohort
CREATE OR REPLACE FUNCTION calculate_cohort_retention(
    p_cohort_id INT,
    p_years_after_start INT DEFAULT 1
) RETURNS DECIMAL AS $$
DECLARE
    v_initial_count INT;
    v_retained_count INT;
    v_retention_rate DECIMAL;
BEGIN
    -- Get initial cohort size
    SELECT COUNT(*) INTO v_initial_count
    FROM students
    WHERE cohort_id = p_cohort_id;
    
    -- Get retained students (active or graduated)
    SELECT COUNT(*) INTO v_retained_count
    FROM students
    WHERE cohort_id = p_cohort_id
    AND status IN ('active', 'graduated');
    
    -- Calculate retention rate
    IF v_initial_count > 0 THEN
        v_retention_rate := (v_retained_count::DECIMAL / v_initial_count) * 100;
    ELSE
        v_retention_rate := 0;
    END IF;
    
    RETURN ROUND(v_retention_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to automatically create status history when student status changes
CREATE OR REPLACE FUNCTION track_student_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) OR 
       (OLD.compliance IS DISTINCT FROM NEW.compliance) THEN
        INSERT INTO student_status_history (
            student_id, 
            old_status, 
            new_status, 
            old_compliance, 
            new_compliance,
            reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            OLD.compliance,
            NEW.compliance,
            'Automatic status change tracking'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_status_change
AFTER UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION track_student_status_change();

-- Trigger to create milestone when student graduates
CREATE OR REPLACE FUNCTION track_graduation_milestone()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'graduated' AND (OLD.status IS NULL OR OLD.status != 'graduated') THEN
        INSERT INTO student_milestones (
            student_id,
            milestone_type,
            milestone_date,
            notes
        ) VALUES (
            NEW.id,
            'graduated',
            COALESCE(NEW.actual_graduation, CURRENT_DATE),
            'Automatic milestone creation on graduation'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_graduation
AFTER UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION track_graduation_milestone();
