import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Analyze resume with Gemini AI
router.post('/analyze/:resumeId', authenticateToken, async (req, res) => {
    try {
        console.log('🔍 Gemini analysis started for resume:', resumeId);
        console.log('📝 Job description provided:', !!req.body.jobDescription);
        
        // Check if Gemini API key is configured
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY not found in environment variables');
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }
        console.log('✅ Gemini API key found');

        const { resumeId } = req.params;
        const { jobDescription } = req.body;

        // Get resume file path from database
        const { db } = await import('../config/database.js');
        const [rows] = await db.execute(
            'SELECT file_path FROM resumes WHERE id = ? AND user_id = ?',
            [resumeId, req.user.id]
        );
        
        console.log('📊 Database query result:', rows.length, 'rows found');

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const filePath = rows[0].file_path;
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Resume file not found' });
        }

        // Read the PDF file
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');

        // Create the analysis prompt
        const analysisPrompt = `You are an expert in ATS (Applicant Tracking System) and resume analysis.
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
Return ONLY the JSON object, without any other text or markdown formatting.`;

        // Initialize Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Prepare the content for Gemini
        const parts = [
            {
                text: analysisPrompt
            },
            {
                inlineData: {
                    mimeType: "application/pdf",
                    data: base64Data
                }
            }
        ];

        // Generate content with Gemini
        console.log('🤖 Calling Gemini API...');
        const result = await model.generateContent(parts);
        const response = await result.response;
        let responseText = response.text();
        
        console.log('📤 Raw Gemini response length:', responseText.length);
        console.log('📤 Raw Gemini response preview:', responseText.substring(0, 200) + '...');

        // Clean the response text (remove any markdown formatting)
        responseText = responseText.replace(/```json\s*|\s*```/g, '').trim();
        
        console.log('🧹 Cleaned response preview:', responseText.substring(0, 200) + '...');

        // Parse the AI response
        let feedback;
        try {
            feedback = JSON.parse(responseText);
            console.log('✅ Successfully parsed JSON response');
            console.log('📊 Feedback structure:', Object.keys(feedback));
        } catch (parseError) {
            console.error('❌ Failed to parse Gemini response:', parseError.message);
            console.error('📄 Full response text:', responseText);
            throw new Error('Invalid JSON response from AI');
        }

        // Validate the feedback structure
        if (!feedback.overallScore || !feedback.ATS || !feedback.toneAndStyle || 
            !feedback.content || !feedback.structure || !feedback.skills) {
            throw new Error('Invalid feedback structure received from AI');
        }

        // Save feedback to database
        console.log('💾 Saving feedback to database...');
        await db.execute(
            'UPDATE resumes SET feedback = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
            [JSON.stringify(feedback), resumeId, req.user.id]
        );
        console.log('✅ Feedback saved to database successfully');

        console.log('📤 Sending response to frontend...');
        res.json(feedback);

    } catch (error) {
        console.error('❌ Gemini AI analysis error:', error);
        console.error('📍 Error stack:', error.stack);
        res.status(500).json({ 
            error: error.message || 'Failed to analyze resume with AI'
        });
    }
});

export default router;
