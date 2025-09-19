-- Job Pass Database Setup
-- Run this with: mysql -u root -p < create_database.sql

CREATE DATABASE IF NOT EXISTS job_pass;

CREATE USER IF NOT EXISTS 'job_pass_user'@'localhost' IDENTIFIED BY 'jobpass2024';

GRANT ALL PRIVILEGES ON job_pass.* TO 'job_pass_user'@'localhost';

FLUSH PRIVILEGES;

USE job_pass;

-- Show confirmation
SELECT 'Database job_pass created successfully!' as Status;
SHOW DATABASES LIKE 'job_pass';
