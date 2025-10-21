import dotenv from "dotenv";
import { testConnection } from "./config/database.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

console.log("🔍 JobPass Environment Check\n");

// Check Node.js version
console.log(`Node.js version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || "development"}\n`);

// Database Configuration Check
console.log("📊 Database Configuration:");
console.log(`DB_HOST: ${process.env.DB_HOST || "NOT SET"}`);
console.log(`DB_USER: ${process.env.DB_USER || "NOT SET"}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? "SET" : "NOT SET"}`);
console.log(`DB_NAME: ${process.env.DB_NAME || "NOT SET"}`);

// Test database connection
console.log("\n🔌 Testing database connection...");
try {
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log("✅ Database connection successful");
  } else {
    console.log("❌ Database connection failed");
  }
} catch (error) {
  console.log("❌ Database connection error:", error.message);
}

// Google OAuth Configuration Check
console.log("\n🔐 Google OAuth Configuration:");
console.log(
  `GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET"}`
);
console.log(
  `GOOGLE_CLIENT_SECRET: ${
    process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET"
  }`
);

// JWT Configuration Check
console.log("\n🔑 JWT Configuration:");
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? "SET" : "NOT SET"}`);

// Gemini AI Configuration Check
console.log("\n🤖 Gemini AI Configuration:");
console.log(
  `GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "SET" : "NOT SET"}`
);

if (process.env.GEMINI_API_KEY) {
  console.log("\n🧪 Testing Gemini AI connection...");
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent('Hello, respond with just "OK"');
    const response = await result.response;
    const text = response.text();

    console.log("✅ Gemini AI connection successful");
    console.log(`✅ Test response: ${text.trim()}`);
  } catch (error) {
    console.log("❌ Gemini AI connection failed:", error.message);

    if (error.message.includes("API_KEY_INVALID")) {
      console.log(
        "💡 The API key appears to be invalid. Please check your Gemini API key."
      );
    } else if (error.message.includes("quota")) {
      console.log(
        "💡 API quota exceeded. Please check your Gemini API usage limits."
      );
    }
  }
} else {
  console.log("❌ Gemini API key not configured");
  console.log("💡 To get a Gemini API key:");
  console.log("   1. Go to https://makersuite.google.com/app/apikey");
  console.log("   2. Create a new API key");
  console.log("   3. Add it to your .env file as GEMINI_API_KEY=your_key_here");
}

// Server Configuration Check
console.log("\n🌐 Server Configuration:");
console.log(`PORT: ${process.env.PORT || "3001 (default)"}`);
console.log(
  `FRONTEND_URL: ${
    process.env.FRONTEND_URL || "http://localhost:5173 (default)"
  }`
);

// Required Environment Variables Summary
console.log("\n📋 Environment Variables Summary:");
const requiredVars = {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

let allConfigured = true;
for (const [key, value] of Object.entries(requiredVars)) {
  const status = value ? "✅" : "❌";
  console.log(`${status} ${key}`);
  if (!value) allConfigured = false;
}

console.log(
  `\n${allConfigured ? "✅" : "❌"} Overall Status: ${
    allConfigured
      ? "All required variables configured"
      : "Missing required variables"
  }`
);

if (!allConfigured) {
  console.log("\n🔧 Next Steps:");
  console.log("1. Copy server/.env.example to server/.env");
  console.log("2. Fill in all the missing environment variables");
  console.log("3. Restart the server after configuration");
  console.log("4. Run this check again: node check_env.js");
}

console.log("\n🚀 Ready to start server!");
