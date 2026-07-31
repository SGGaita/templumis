-- University Rankings Feature Migration
-- Creates tables for ranking systems, indicators, and institution ranking data

-- 1. Create ranking_systems table
CREATE TABLE IF NOT EXISTS ranking_systems (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    website_url VARCHAR(500),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create ranking_indicators table
CREATE TABLE IF NOT EXISTS ranking_indicators (
    id SERIAL PRIMARY KEY,
    ranking_system_id INT NOT NULL REFERENCES ranking_systems(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    weight_percentage DECIMAL(5,2),
    category VARCHAR(100),
    measurement_unit VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ranking_system_id, code)
);

-- 3. Create institution_ranking_data table
CREATE TABLE IF NOT EXISTS institution_ranking_data (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    indicator_id INT NOT NULL REFERENCES ranking_indicators(id) ON DELETE CASCADE,
    satisfies_indicator BOOLEAN DEFAULT FALSE,
    current_value DECIMAL(10,2),
    target_value DECIMAL(10,2),
    notes TEXT,
    last_assessed_date DATE,
    assessed_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institution_id, indicator_id)
);

-- 4. Create institution_rankings table
CREATE TABLE IF NOT EXISTS institution_rankings (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    ranking_system_id INT NOT NULL REFERENCES ranking_systems(id) ON DELETE CASCADE,
    ranking_year INT NOT NULL,
    overall_rank INT,
    overall_score DECIMAL(10,2),
    national_rank INT,
    regional_rank INT,
    subject_area VARCHAR(255),
    ranking_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institution_id, ranking_system_id, ranking_year, subject_area)
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ranking_indicators_system ON ranking_indicators(ranking_system_id);
CREATE INDEX IF NOT EXISTS idx_ranking_indicators_category ON ranking_indicators(category);

CREATE INDEX IF NOT EXISTS idx_institution_ranking_data_institution ON institution_ranking_data(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_ranking_data_indicator ON institution_ranking_data(indicator_id);
CREATE INDEX IF NOT EXISTS idx_institution_ranking_data_satisfies ON institution_ranking_data(satisfies_indicator);

CREATE INDEX IF NOT EXISTS idx_institution_rankings_institution ON institution_rankings(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_rankings_system ON institution_rankings(ranking_system_id);
CREATE INDEX IF NOT EXISTS idx_institution_rankings_year ON institution_rankings(ranking_year);
