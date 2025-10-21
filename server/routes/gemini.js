import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { authenticateToken } from "../middleware/auth.js";
import pool from "../config/database.js";

const router = express.Router();

// Initialize Gemini AI
let genAI;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (error) {
  console.error("❌ Failed to initialize Gemini AI:", error);
}

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Analyze resume with Gemini AI
router.post("/analyze/:resumeId", authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;
    console.log("🔍 Gemini analysis started for resume:", resumeId);
    console.log("📝 Job description provided:", !!req.body.jobDescription);
    console.log("👤 User ID:", req.user.id);

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY not found in environment variables");
      return res.status(500).json({
        error:
          "Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.",
      });
    }
    console.log("✅ Gemini API key found");

    // Check if genAI was initialized successfully
    if (!genAI) {
      console.error("❌ Gemini AI not initialized");
      return res.status(500).json({
        error: "Gemini AI initialization failed",
      });
    }

    const { jobDescription } = req.body;

    // Get resume file path from database
    const [rows] = await pool.execute(
      "SELECT file_path, file_name FROM resumes WHERE id = ? AND user_id = ?",
      [resumeId, req.user.id]
    );

    console.log("📊 Database query result:", rows.length, "rows found");

    if (rows.length === 0) {
      console.log(
        "❌ Resume not found in database for ID:",
        resumeId,
        "User:",
        req.user.id
      );
      return res.status(404).json({ error: "Resume not found" });
    }

    const filePath = rows[0].file_path;
    const fileName = rows[0].file_name;
    console.log("📁 File path:", filePath);
    console.log("📄 File name:", fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("❌ File not found on filesystem:", filePath);
      return res.status(404).json({ error: "Resume file not found on server" });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    console.log("📊 File size:", stats.size, "bytes");

    // Read the PDF file
    let fileBuffer;
    try {
      fileBuffer = fs.readFileSync(filePath);
      console.log(
        "✅ File read successfully, size:",
        fileBuffer.length,
        "bytes"
      );
    } catch (readError) {
      console.error("❌ Failed to read file:", readError);
      return res.status(500).json({ error: "Failed to read resume file" });
    }

    const base64Data = fileBuffer.toString("base64");
    console.log("🔗 Base64 data length:", base64Data.length);

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

${jobDescription ? `Job Description to match against: ${jobDescription}` : ""}

Focus on ATS compatibility, readability, content quality, structure, and relevant skills.
Return ONLY the JSON object, without any other text or markdown formatting.`;

    // Initialize Gemini model
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      console.log("✅ Gemini model initialized");
    } catch (modelError) {
      console.error("❌ Failed to initialize Gemini model:", modelError);
      return res.status(500).json({ error: "Failed to initialize AI model" });
    }

    // Prepare the content for Gemini
    const parts = [
      {
        text: analysisPrompt,
      },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
    ];

    // Generate content with Gemini
    console.log("🤖 Calling Gemini API...");
    let result, response, responseText;
    try {
      result = await model.generateContent(parts);
      response = await result.response;
      responseText = response.text();
      console.log("✅ Gemini API call successful");
    } catch (aiError) {
      console.error("❌ Gemini API error:", aiError);
      console.error("📍 Error details:", {
        message: aiError.message,
        code: aiError.code,
        status: aiError.status,
      });
      return res.status(500).json({
        error: "AI analysis failed: " + (aiError.message || "Unknown error"),
      });
    }

    console.log("📤 Raw Gemini response length:", responseText.length);
    console.log(
      "📤 Raw Gemini response preview:",
      responseText.substring(0, 200) + "..."
    );

    // Clean the response text (remove any markdown formatting)
    responseText = responseText.replace(/```json\s*|\s*```/g, "").trim();

    console.log(
      "🧹 Cleaned response preview:",
      responseText.substring(0, 200) + "..."
    );

    // Parse the AI response
    let feedback;
    try {
      feedback = JSON.parse(responseText);
      console.log("✅ Successfully parsed JSON response");
      console.log("📊 Feedback structure:", Object.keys(feedback));
    } catch (parseError) {
      console.error("❌ Failed to parse Gemini response:", parseError.message);
      console.error("📄 Full response text:", responseText);
      throw new Error("Invalid JSON response from AI");
    }

    // Validate the feedback structure
    if (
      !feedback.overallScore ||
      !feedback.ATS ||
      !feedback.toneAndStyle ||
      !feedback.content ||
      !feedback.structure ||
      !feedback.skills
    ) {
      throw new Error("Invalid feedback structure received from AI");
    }

    // Save feedback to database
    console.log("💾 Saving feedback to database...");

    // First, check if feedback column exists, if not add it
    try {
      await pool.execute(`
                ALTER TABLE resumes
                ADD COLUMN IF NOT EXISTS feedback JSON
            `);
      console.log("✅ Ensured feedback column exists");
    } catch (columnError) {
      console.log(
        "📝 Feedback column already exists or error:",
        columnError.message
      );
    }

    // Save the feedback
    try {
      await pool.execute(
        "UPDATE resumes SET feedback = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
        [JSON.stringify(feedback), resumeId, req.user.id]
      );
      console.log("✅ Feedback saved to database successfully");
    } catch (saveError) {
      console.error("❌ Failed to save feedback to database:", saveError);
      // Fallback: save to resume_feedback table
      console.log("📝 Attempting fallback save to resume_feedback table...");

      const feedbackId = resumeId + "_feedback";
      await pool.execute(
        `INSERT INTO resume_feedback
                 (id, resume_id, overall_score, ats_score, ats_tips,
                  tone_style_score, tone_style_tips, content_score, content_tips,
                  structure_score, structure_tips, skills_score, skills_tips)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 overall_score = VALUES(overall_score),
                 ats_score = VALUES(ats_score),
                 ats_tips = VALUES(ats_tips),
                 tone_style_score = VALUES(tone_style_score),
                 tone_style_tips = VALUES(tone_style_tips),
                 content_score = VALUES(content_score),
                 content_tips = VALUES(content_tips),
                 structure_score = VALUES(structure_score),
                 structure_tips = VALUES(structure_tips),
                 skills_score = VALUES(skills_score),
                 skills_tips = VALUES(skills_tips)`,
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
          JSON.stringify(feedback.skills.tips),
        ]
      );
      console.log("✅ Fallback save to resume_feedback table successful");
    }

    console.log("📤 Sending response to frontend...");
    res.json(feedback);
  } catch (error) {
    console.error("❌ Gemini AI analysis error:", error);
    console.error("📍 Error stack:", error.stack);
    console.error("📍 Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });

    // Send appropriate error response
    let statusCode = 500;
    let errorMessage = "Failed to analyze resume with AI";

    if (error.message.includes("not found")) {
      statusCode = 404;
      errorMessage = error.message;
    } else if (error.message.includes("API key")) {
      statusCode = 500;
      errorMessage = "AI service configuration error";
    } else if (error.message.includes("Invalid JSON")) {
      statusCode = 500;
      errorMessage = "AI response parsing error";
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: error.message,
    });
  }
});

// Test endpoint to check Gemini AI status
router.get("/test", authenticateToken, async (req, res) => {
  try {
    console.log("🧪 Testing Gemini AI configuration...");

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        status: "error",
        message: "Gemini API key not configured",
        instructions: "Add GEMINI_API_KEY to your environment variables",
      });
    }

    // Check if genAI was initialized
    if (!genAI) {
      return res.status(500).json({
        status: "error",
        message: "Gemini AI not initialized",
      });
    }

    // Try to initialize a model
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Test with a simple prompt
      const result = await model.generateContent(
        "Hello, respond with just 'OK'"
      );
      const response = await result.response;
      const text = response.text();

      res.json({
        status: "success",
        message: "Gemini AI is working correctly",
        testResponse: text.trim(),
        apiKeyConfigured: true,
        modelInitialized: true,
      });
    } catch (modelError) {
      console.error("❌ Model test failed:", modelError);
      res.status(500).json({
        status: "error",
        message: "Gemini AI model test failed",
        error: modelError.message,
        apiKeyConfigured: true,
        modelInitialized: false,
      });
    }
  } catch (error) {
    console.error("❌ Gemini test error:", error);
    res.status(500).json({
      status: "error",
      message: "Gemini AI test failed",
      error: error.message,
    });
  }
});

export default router;
