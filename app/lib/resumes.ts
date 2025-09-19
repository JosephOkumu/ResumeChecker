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
    uploadResume: async (file: File, companyName?: string, jobTitle?: string): Promise<{ id: string; message: string }> => {
        const formData = new FormData();
        formData.append('resume', file);
        if (companyName) formData.append('companyName', companyName);
        if (jobTitle) formData.append('jobTitle', jobTitle);

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
        // This will use Puter.js AI directly from the frontend
        // Get the analysis prompt from backend
        const response = await api.post(`/ai/analyze/${resumeId}`, { jobDescription });
        const { prompt } = response.data;

        // Use Puter.js AI for analysis
        if (typeof window !== 'undefined' && window.puter) {
            try {
                const aiResponse = await window.puter.ai.chat(prompt, { 
                    model: "claude-3-5-sonnet" 
                }) as any;
                
                // Parse the AI response
                const feedback = JSON.parse(aiResponse.message.content[0].text);
                
                // Save feedback to database
                await resumeService.saveFeedback(resumeId, feedback);
                
                return feedback;
            } catch (error) {
                console.error('Puter AI analysis error:', error);
                throw new Error('Failed to analyze resume with AI');
            }
        } else {
            throw new Error('Puter.js not available');
        }
    }
};
