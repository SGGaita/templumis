-- Student Support Pipeline Migration
-- Creates tables for journey tracking, advisors, resources, interventions, and risk scoring

-- 1. Create student_journey_milestones table
CREATE TABLE IF NOT EXISTS student_journey_milestones (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    milestone_type VARCHAR(100) NOT NULL,
    milestone_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create student_advisors table
CREATE TABLE IF NOT EXISTS student_advisors (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    advisor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_date DATE DEFAULT CURRENT_DATE,
    advisor_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create library_resources table
CREATE TABLE IF NOT EXISTS library_resources (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    resource_name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    url VARCHAR(500),
    description TEXT,
    access_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create support_resource_links table
CREATE TABLE IF NOT EXISTS support_resource_links (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    resource_category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(500),
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    office_hours TEXT,
    program_level_filter VARCHAR(50) DEFAULT 'all',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create student_risk_scores table
CREATE TABLE IF NOT EXISTS student_risk_scores (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    risk_score INT NOT NULL DEFAULT 0,
    risk_level VARCHAR(50) NOT NULL,
    risk_factors JSONB,
    intervention_recommended BOOLEAN DEFAULT FALSE,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, calculated_at)
);

-- 6. Create postgrad_support table
CREATE TABLE IF NOT EXISTS postgrad_support (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    research_area TEXT,
    thesis_advisor_id INT REFERENCES users(id) ON DELETE SET NULL,
    thesis_status VARCHAR(50),
    conference_attendance JSONB,
    publications JSONB,
    grant_applications JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Add columns to support_tickets table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='support_tickets') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='support_tickets' AND column_name='journey_milestone_id') THEN
            ALTER TABLE support_tickets ADD COLUMN journey_milestone_id INT REFERENCES student_journey_milestones(id) ON DELETE SET NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='support_tickets' AND column_name='auto_generated') THEN
            ALTER TABLE support_tickets ADD COLUMN auto_generated BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='support_tickets' AND column_name='intervention_id') THEN
            ALTER TABLE support_tickets ADD COLUMN intervention_id INT REFERENCES student_interventions(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- 8. Add columns to students table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='students' AND column_name='current_milestone') THEN
        ALTER TABLE students ADD COLUMN current_milestone VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='students' AND column_name='risk_level') THEN
        ALTER TABLE students ADD COLUMN risk_level VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='students' AND column_name='last_advisor_contact_date') THEN
        ALTER TABLE students ADD COLUMN last_advisor_contact_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='students' AND column_name='program_level') THEN
        ALTER TABLE students ADD COLUMN program_level VARCHAR(50);
    END IF;
END $$;

-- 9. Enhance student_interventions table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='student_interventions' AND column_name='intervention_category') THEN
        ALTER TABLE student_interventions ADD COLUMN intervention_category VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='student_interventions' AND column_name='success_metric') THEN
        ALTER TABLE student_interventions ADD COLUMN success_metric TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='student_interventions' AND column_name='completion_date') THEN
        ALTER TABLE student_interventions ADD COLUMN completion_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='student_interventions' AND column_name='effectiveness_rating') THEN
        ALTER TABLE student_interventions ADD COLUMN effectiveness_rating INT;
    END IF;
END $$;

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_journey_milestones_student ON student_journey_milestones(student_id);
CREATE INDEX IF NOT EXISTS idx_journey_milestones_type ON student_journey_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_journey_milestones_status ON student_journey_milestones(status);

CREATE INDEX IF NOT EXISTS idx_student_advisors_student ON student_advisors(student_id);
CREATE INDEX IF NOT EXISTS idx_student_advisors_advisor ON student_advisors(advisor_id);
CREATE INDEX IF NOT EXISTS idx_student_advisors_active ON student_advisors(is_active);

CREATE INDEX IF NOT EXISTS idx_library_resources_institution ON library_resources(institution_id);
CREATE INDEX IF NOT EXISTS idx_library_resources_type ON library_resources(resource_type);

CREATE INDEX IF NOT EXISTS idx_support_resources_institution ON support_resource_links(institution_id);
CREATE INDEX IF NOT EXISTS idx_support_resources_category ON support_resource_links(resource_category);

CREATE INDEX IF NOT EXISTS idx_risk_scores_student ON student_risk_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_level ON student_risk_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_scores_calculated ON student_risk_scores(calculated_at);

CREATE INDEX IF NOT EXISTS idx_postgrad_support_student ON postgrad_support(student_id);
CREATE INDEX IF NOT EXISTS idx_postgrad_support_advisor ON postgrad_support(thesis_advisor_id);

CREATE INDEX IF NOT EXISTS idx_students_risk_level ON students(risk_level);
CREATE INDEX IF NOT EXISTS idx_students_program_level ON students(program_level);
