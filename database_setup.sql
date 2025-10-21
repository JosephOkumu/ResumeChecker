-- JobPass Database Complete Setup
-- This file consolidates all database setup requirements
-- Run with: mysql -u root -p < database_setup.sql

-- ===================================================================
-- 1. DATABASE AND USER CREATION
-- ===================================================================

-- Drop existing database if it exists (use with caution in production)
-- DROP DATABASE IF EXISTS job_pass;

-- Create database
CREATE DATABASE IF NOT EXISTS job_pass;

-- Drop existing user if it exists
DROP USER IF EXISTS 'job_pass_user'@'localhost';

-- Create user with proper authentication
CREATE USER 'job_pass_user'@'localhost' IDENTIFIED BY 'JobPass2024';

-- Grant all privileges on the job_pass database to the user
GRANT ALL PRIVILEGES ON job_pass.* TO 'job_pass_user'@'localhost';

-- Apply privilege changes
FLUSH PRIVILEGES;

-- Use the job_pass database
USE job_pass;

-- ===================================================================
-- 2. TABLE CREATION
-- ===================================================================

-- Users table for Google OAuth authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Resumes table for storing resume metadata and files
CREATE TABLE IF NOT EXISTS resumes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    job_description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    image_path VARCHAR(500),
    file_size INT,
    mime_type VARCHAR(100),
    feedback JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Resume feedback table for detailed AI analysis results (normalized structure)
CREATE TABLE IF NOT EXISTS resume_feedback (
    id VARCHAR(36) PRIMARY KEY,
    resume_id VARCHAR(36) NOT NULL,
    overall_score INT,
    ats_score INT,
    ats_tips JSON,
    tone_style_score INT,
    tone_style_tips JSON,
    content_score INT,
    content_tips JSON,
    structure_score INT,
    structure_tips JSON,
    skills_score INT,
    skills_tips JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    INDEX idx_resume_id (resume_id)
);

-- ===================================================================
-- 3. PERFORMANCE INDEXES
-- ===================================================================

-- Additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_resumes_user_created ON resumes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_company ON resumes(company_name);
CREATE INDEX IF NOT EXISTS idx_resumes_job_title ON resumes(job_title);

-- ===================================================================
-- 4. DATA MIGRATION AND CLEANUP (if upgrading from older schema)
-- ===================================================================

-- Handle any existing data inconsistencies
-- Update file_name if it exists as filename or original_name
UPDATE resumes SET file_name = filename WHERE file_name IS NULL AND filename IS NOT NULL;
UPDATE resumes SET file_name = original_name WHERE file_name IS NULL AND original_name IS NOT NULL;

-- Drop any old columns that might exist from previous versions
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE table_name='resumes' AND column_name='filename' AND table_schema='job_pass') > 0,
    'ALTER TABLE resumes DROP COLUMN filename',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE table_name='resumes' AND column_name='original_name' AND table_schema='job_pass') > 0,
    'ALTER TABLE resumes DROP COLUMN original_name',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===================================================================
-- 5. VERIFICATION AND CONFIRMATION
-- ===================================================================

-- Display setup confirmation
SELECT 'JobPass Database Setup Complete!' as Status;
SELECT 'Database and tables created successfully' as Message;

-- Show created database
SHOW DATABASES LIKE 'job_pass';

-- Show user was created successfully
SELECT User, Host FROM mysql.user WHERE User='job_pass_user';

-- Show grants for the user
SHOW GRANTS FOR 'job_pass_user'@'localhost';

-- Show all tables in the database
SHOW TABLES FROM job_pass;

-- Display table structures for verification
SELECT 'USERS TABLE STRUCTURE:' as Info;
DESCRIBE users;

SELECT 'RESUMES TABLE STRUCTURE:' as Info;
DESCRIBE resumes;

SELECT 'RESUME_FEEDBACK TABLE STRUCTURE:' as Info;
DESCRIBE resume_feedback;

-- Show table row counts (should be 0 for fresh install)
SELECT
    'users' as table_name,
    COUNT(*) as row_count
FROM users
UNION ALL
SELECT
    'resumes' as table_name,
    COUNT(*) as row_count
FROM resumes
UNION ALL
SELECT
    'resume_feedback' as table_name,
    COUNT(*) as row_count
FROM resume_feedback;

-- ===================================================================
-- 6. NOTES FOR DEVELOPERS
-- ===================================================================

/*
IMPORTANT NOTES:

1. DUAL FEEDBACK STORAGE STRATEGY:
   - resumes.feedback (JSON): Used by Gemini AI route for direct storage
   - resume_feedback table: Used by Puter AI route for normalized storage
   - Both approaches are supported for flexibility

2. DATABASE CONNECTION:
   - Host: localhost
   - Database: job_pass
   - Username: job_pass_user
   - Password: JobPass2024

3. ENVIRONMENT VARIABLES NEEDED:
   DB_HOST=localhost
   DB_USER=job_pass_user
   DB_PASSWORD=JobPass2024
   DB_NAME=job_pass

4. FILE STORAGE:
   - Resume PDFs: server/uploads/resumes/
   - Generated images: server/uploads/images/ (optional)

5. SECURITY CONSIDERATIONS:
   - Change default password in production
   - Use environment variables for sensitive data
   - Consider SSL connections for production

6. BACKUP RECOMMENDATIONS:
   - Regular database backups
   - File system backups for uploaded resumes
   - Test restore procedures

7. CLEANUP (if needed):
   To completely remove everything:
   DROP DATABASE job_pass;
   DROP USER 'job_pass_user'@'localhost';
*/
