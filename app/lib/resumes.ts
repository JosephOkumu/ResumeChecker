import { api } from './auth';

export interface Resume {
    id: string;
    companyName?: string;
    jobTitle?: string;
    fileName: string;
    filePath: string;
    resumePath: string; // Add for compatibility with existing components
    imagePath?: string;
    createdAt: string;
    feedback?: Feedback;
    overallScore?: number;
    atsScore?: number;
}

export interface Feedback {
    overallScore: number;
    ATS: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
        }[];
    };
    toneAndStyle: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    content: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    structure: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    skills: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
}

export const resumeService = {
    // Upload resume
    uploadResume: async (file: File, companyName?: string, jobTitle?: string, jobDescription?: string): Promise<{ id: string; message: string }> => {
        const formData = new FormData();
        formData.append('resume', file);
        if (companyName) formData.append('companyName', companyName);
        if (jobTitle) formData.append('jobTitle', jobTitle);
        if (jobDescription) formData.append('jobDescription', jobDescription);

        const response = await api.post('/resumes/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        return response.data;
    },

    // Get all user resumes
    getResumes: async (): Promise<Resume[]> => {
        const response = await api.get('/resumes');
        return response.data;
    },

    // Get specific resume
    getResume: async (id: string): Promise<Resume> => {
        const response = await api.get(`/resumes/${id}`);
        return response.data;
    },

    // Get resume file URL
    getResumeFileUrl: (id: string): string => {
        const token = localStorage.getItem('auth_token');
        return `${api.defaults.baseURL}/resumes/${id}/file?token=${token}`;
    },

    // Delete resume
    deleteResume: async (id: string): Promise<void> => {
        await api.delete(`/resumes/${id}`);
    },

    // Save AI feedback
    saveFeedback: async (resumeId: string, feedback: Feedback): Promise<void> => {
        await api.post(`/ai/feedback/${resumeId}`, { feedback });
    },

    // Analyze resume with Puter.js AI (client-side)
    analyzeWithPuterAI: async (resumeId: string, jobDescription?: string): Promise<Feedback> => {
        if (typeof window === 'undefined' || !window.puter) {
            throw new Error('Puter.js not available');
        }

        try {
            // Get the resume file URL to download it
            const token = localStorage.getItem('auth_token');
            const fileUrl = `${api.defaults.baseURL}/resumes/${resumeId}/file`;
            
            // Download the PDF file with proper authorization
            const fileResponse = await fetch(fileUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!fileResponse.ok) {
                throw new Error('Failed to download resume file');
            }
            
            const fileBlob = await fileResponse.blob();
            const fileName = `resume_${resumeId}.pdf`;
            
            // Create a File object from the blob
            const file = new File([fileBlob], fileName, { type: 'application/pdf' });
            
            // Upload file to Puter.js file system first
            const puterFile = await window.puter.fs.upload([file]);
            const filePath = puterFile.path || puterFile.name || fileName;
            
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

            // Use Puter.js AI to analyze the PDF with the prompt
            const aiResponse = await window.puter.ai.chat([
                {
                    role: "user",
                    content: [
                        {
                            type: "file",
                            puter_path: filePath
                        },
                        {
                            type: "text",
                            text: analysisPrompt
                        }
                    ]
                }
            ], { 
                model: "claude-3-5-sonnet" 
            }) as any;
            
            console.log('AI Response:', aiResponse);
            
            // Extract and parse the response
            let responseText = '';
            if (aiResponse.message && aiResponse.message.content) {
                if (Array.isArray(aiResponse.message.content)) {
                    responseText = aiResponse.message.content[0].text;
                } else {
                    responseText = aiResponse.message.content;
                }
            } else if (typeof aiResponse === 'string') {
                responseText = aiResponse;
            }
            
            // Clean the response text (remove any markdown formatting)
            responseText = responseText.replace(/```json\s*|\s*```/g, '').trim();
            
            // Parse the AI response
            const feedback = JSON.parse(responseText);
            
            // Validate the feedback structure
            if (!feedback.overallScore || !feedback.ATS || !feedback.toneAndStyle || 
                !feedback.content || !feedback.structure || !feedback.skills) {
                throw new Error('Invalid feedback structure received from AI');
            }
            
            // Clean up the uploaded file from Puter.js
            try {
                await window.puter.fs.delete(filePath);
            } catch (cleanupError) {
                console.warn('Failed to cleanup temporary file:', cleanupError);
            }
            
            // Save feedback to database
            await resumeService.saveFeedback(resumeId, feedback);
            
            return feedback;
        } catch (error) {
            console.error('Puter AI analysis error:', error);
            if (error instanceof SyntaxError) {
                throw new Error('Failed to parse AI response. Please try again.');
            }
            throw new Error(`Failed to analyze resume with AI: ${(error as Error).message}`);
        }
    }
};
