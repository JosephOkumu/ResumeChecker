-- Fix database schema to match backend expectations
USE job_pass;

-- Add missing columns to resumes table
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS image_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS job_description TEXT;

-- Update existing data if needed (copy from filename to file_name if exists)
UPDATE resumes SET file_name = filename WHERE file_name = '' AND filename IS NOT NULL;
UPDATE resumes SET file_name = original_name WHERE file_name = '' AND original_name IS NOT NULL;

-- Drop old columns if they exist
ALTER TABLE resumes DROP COLUMN IF EXISTS filename;
ALTER TABLE resumes DROP COLUMN IF EXISTS original_name;

-- Ensure resume_feedback table has correct structure
ALTER TABLE resume_feedback 
MODIFY COLUMN ats_tips JSON,
MODIFY COLUMN tone_style_tips JSON,
MODIFY COLUMN content_tips JSON,
MODIFY COLUMN structure_tips JSON,
MODIFY COLUMN skills_tips JSON;

-- Add experience columns if missing
ALTER TABLE resume_feedback 
ADD COLUMN IF NOT EXISTS experience_score INT,
ADD COLUMN IF NOT EXISTS experience_tips JSON;

SELECT 'Database schema fixed successfully!' as Status;
