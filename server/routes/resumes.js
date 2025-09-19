import express from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';
import fs from 'fs/promises';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'uploads/resumes';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Upload resume
router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { companyName, jobTitle } = req.body;
        const resumeId = randomUUID();

        // Insert resume record
        await pool.execute(
            `INSERT INTO resumes (id, user_id, company_name, job_title, file_name, file_path, file_size, mime_type) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                resumeId,
                req.user.id,
                companyName || null,
                jobTitle || null,
                req.file.originalname,
                req.file.path,
                req.file.size,
                req.file.mimetype
            ]
        );

        res.json({
            id: resumeId,
            message: 'Resume uploaded successfully',
            fileName: req.file.originalname
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload resume' });
    }
});

// Get user's resumes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [resumes] = await pool.execute(
            `SELECT r.*, rf.overall_score, rf.ats_score 
             FROM resumes r 
             LEFT JOIN resume_feedback rf ON r.id = rf.resume_id 
             WHERE r.user_id = ? 
             ORDER BY r.created_at DESC`,
            [req.user.id]
        );

        res.json(resumes);
    } catch (error) {
        console.error('Get resumes error:', error);
        res.status(500).json({ error: 'Failed to fetch resumes' });
    }
});

// Get specific resume
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [resumes] = await pool.execute(
            `SELECT r.*, rf.* 
             FROM resumes r 
             LEFT JOIN resume_feedback rf ON r.id = rf.resume_id 
             WHERE r.id = ? AND r.user_id = ?`,
            [req.params.id, req.user.id]
        );

        if (resumes.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const resume = resumes[0];
        
        // Structure the feedback data
        const feedback = resume.overall_score ? {
            overallScore: resume.overall_score,
            ATS: {
                score: resume.ats_score,
                tips: JSON.parse(resume.ats_tips || '[]')
            },
            toneAndStyle: {
                score: resume.tone_style_score,
                tips: JSON.parse(resume.tone_style_tips || '[]')
            },
            content: {
                score: resume.content_score,
                tips: JSON.parse(resume.content_tips || '[]')
            },
            structure: {
                score: resume.structure_score,
                tips: JSON.parse(resume.structure_tips || '[]')
            },
            skills: {
                score: resume.skills_score,
                tips: JSON.parse(resume.skills_tips || '[]')
            }
        } : null;

        res.json({
            id: resume.id,
            companyName: resume.company_name,
            jobTitle: resume.job_title,
            fileName: resume.file_name,
            filePath: resume.file_path,
            imagePath: resume.image_path,
            createdAt: resume.created_at,
            feedback
        });

    } catch (error) {
        console.error('Get resume error:', error);
        res.status(500).json({ error: 'Failed to fetch resume' });
    }
});

// Serve resume files
router.get('/:id/file', authenticateToken, async (req, res) => {
    try {
        const [resumes] = await pool.execute(
            'SELECT file_path, file_name, mime_type FROM resumes WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (resumes.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const resume = resumes[0];
        
        res.setHeader('Content-Type', resume.mime_type);
        res.setHeader('Content-Disposition', `inline; filename="${resume.file_name}"`);
        
        const fileBuffer = await fs.readFile(resume.file_path);
        res.send(fileBuffer);

    } catch (error) {
        console.error('Serve file error:', error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

// Delete resume
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const [resumes] = await pool.execute(
            'SELECT file_path, image_path FROM resumes WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (resumes.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const resume = resumes[0];

        // Delete files
        try {
            await fs.unlink(resume.file_path);
            if (resume.image_path) {
                await fs.unlink(resume.image_path);
            }
        } catch (fileError) {
            console.warn('File deletion warning:', fileError.message);
        }

        // Delete from database (cascade will handle feedback)
        await pool.execute('DELETE FROM resumes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        res.json({ message: 'Resume deleted successfully' });

    } catch (error) {
        console.error('Delete resume error:', error);
        res.status(500).json({ error: 'Failed to delete resume' });
    }
});

export default router;
