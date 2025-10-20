-- Complete JobPass Database Setup
-- Run this with: mysql -u root -p < complete_setup.sql

-- Create database
CREATE DATABASE IF NOT EXISTS job_pass;

-- Create user with proper authentication
DROP USER IF EXISTS 'job_pass_user'@'localhost';
CREATE USER 'job_pass_user'@'localhost' IDENTIFIED BY 'JobPass2024';

-- Grant privileges
GRANT ALL PRIVILEGES ON job_pass.* TO 'job_pass_user'@'localhost';
FLUSH PRIVILEGES;

-- Use the database
USE job_pass;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture VARCHAR(500),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    job_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Resume feedback table
CREATE TABLE IF NOT EXISTS resume_feedback (
    id VARCHAR(36) PRIMARY KEY,
    resume_id VARCHAR(36) NOT NULL,
    overall_score INT,
    ats_score INT,
    ats_tips TEXT,
    tone_style_score INT,
    tone_style_tips TEXT,
    content_score INT,
    content_tips TEXT,
    structure_score INT,
    structure_tips TEXT,
    skills_score INT,
    skills_tips TEXT,
    experience_score INT,
    experience_tips TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    INDEX idx_resume_id (resume_id)
);

-- Show confirmation
SELECT 'Database and tables created successfully!' as Status;
SHOW TABLES;

-- Show user was created
SELECT User, Host FROM mysql.user WHERE User='job_pass_user';
