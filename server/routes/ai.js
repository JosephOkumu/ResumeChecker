import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const router = express.Router();

// Analyze resume with Puter.js AI
router.post('/analyze/:resumeId', authenticateToken, async (req, res) => {
    try {
        const { resumeId } = req.params;
        const { jobDescription } = req.body;

        // Get resume from database
        const [resumes] = await pool.execute(
            'SELECT * FROM resumes WHERE id = ? AND user_id = ?',
            [resumeId, req.user.id]
        );

        if (resumes.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const resume = resumes[0];

        // Read the PDF file
        const fileBuffer = await fs.readFile(resume.file_path);
        const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' });

        // Create analysis prompt
        const analysisPrompt = `
        Please analyze this resume and provide detailed feedback in the following JSON format:
        {
            "overallScore": number (0-100),
            "ATS": {
                "score": number (0-100),
                "tips": [
                    {
                        "type": "good" | "improve",
                        "tip": "string"
                    }
                ]
            },
            "toneAndStyle": {
                "score": number (0-100),
                "tips": [
                    {
                        "type": "good" | "improve",
                        "tip": "string",
                        "explanation": "string"
                    }
                ]
            },
            "content": {
                "score": number (0-100),
                "tips": [
                    {
                        "type": "good" | "improve",
                        "tip": "string",
                        "explanation": "string"
                    }
                ]
            },
            "structure": {
                "score": number (0-100),
                "tips": [
                    {
                        "type": "good" | "improve",
                        "tip": "string",
                        "explanation": "string"
                    }
                ]
            },
            "skills": {
                "score": number (0-100),
                "tips": [
                    {
                        "type": "good" | "improve",
                        "tip": "string",
                        "explanation": "string"
                    }
                ]
            }
        }

        ${jobDescription ? `Job Description to match against: ${jobDescription}` : ''}
        
        Focus on ATS compatibility, readability, content quality, structure, and relevant skills.
        `;

        // Call Puter.js AI (this will be called from frontend for now since Puter.js is client-side)
        // For now, return a placeholder response structure
        res.json({
            message: 'Analysis request received. Use frontend Puter.js to complete analysis.',
            resumeId: resumeId,
            prompt: analysisPrompt
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze resume' });
    }
});

// Save AI feedback
router.post('/feedback/:resumeId', authenticateToken, async (req, res) => {
    try {
        const { resumeId } = req.params;
        const { feedback } = req.body;

        // Verify resume belongs to user
        const [resumes] = await pool.execute(
            'SELECT id FROM resumes WHERE id = ? AND user_id = ?',
            [resumeId, req.user.id]
        );

        if (resumes.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        // Check if feedback already exists
        const [existingFeedback] = await pool.execute(
            'SELECT id FROM resume_feedback WHERE resume_id = ?',
            [resumeId]
        );

        const feedbackId = existingFeedback.length > 0 ? existingFeedback[0].id : randomUUID();

        if (existingFeedback.length > 0) {
            // Update existing feedback
            await pool.execute(
                `UPDATE resume_feedback SET 
                 overall_score = ?, ats_score = ?, ats_tips = ?,
                 tone_style_score = ?, tone_style_tips = ?,
                 content_score = ?, content_tips = ?,
                 structure_score = ?, structure_tips = ?,
                 skills_score = ?, skills_tips = ?,
                 updated_at = CURRENT_TIMESTAMP
                 WHERE resume_id = ?`,
                [
                    feedback.overallScore,
                    feedback.ATS.score,
                    JSON.stringify(feedback.ATS.tips),
                    feedback.toneAndStyle.score,
                    JSON.stringify(feedback.toneAndStyle.tips),
                    feedback.content.score,
                    JSON.stringify(feedback.content.tips),
                    feedback.structure.score,
                    JSON.stringify(feedback.structure.tips),
                    feedback.skills.score,
                    JSON.stringify(feedback.skills.tips),
                    resumeId
                ]
            );
        } else {
            // Insert new feedback
            await pool.execute(
                `INSERT INTO resume_feedback 
                 (id, resume_id, overall_score, ats_score, ats_tips,
                  tone_style_score, tone_style_tips, content_score, content_tips,
                  structure_score, structure_tips, skills_score, skills_tips)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    feedbackId,
                    resumeId,
                    feedback.overallScore,
                    feedback.ATS.score,
                    JSON.stringify(feedback.ATS.tips),
                    feedback.toneAndStyle.score,
                    JSON.stringify(feedback.toneAndStyle.tips),
                    feedback.content.score,
                    JSON.stringify(feedback.content.tips),
                    feedback.structure.score,
                    JSON.stringify(feedback.structure.tips),
                    feedback.skills.score,
                    JSON.stringify(feedback.skills.tips)
                ]
            );
        }

        res.json({ message: 'Feedback saved successfully' });

    } catch (error) {
        console.error('Save feedback error:', error);
        res.status(500).json({ error: 'Failed to save feedback' });
    }
});

export default router;
