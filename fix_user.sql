-- Fix user creation and set password
-- Run this with: mysql -u root -p < fix_user.sql

DROP USER IF EXISTS 'job_pass_user'@'localhost';

CREATE USER 'job_pass_user'@'localhost' IDENTIFIED BY 'jobpass2024';

GRANT ALL PRIVILEGES ON job_pass.* TO 'job_pass_user'@'localhost';

FLUSH PRIVILEGES;

-- Verify user was created
SELECT User, Host FROM mysql.user WHERE User='job_pass_user';

-- Show grants for the user
SHOW GRANTS FOR 'job_pass_user'@'localhost';
