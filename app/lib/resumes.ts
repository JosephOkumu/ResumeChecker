import { api } from "./auth";

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
  uploadResume: async (
    file: File,
    companyName?: string,
    jobTitle?: string,
    jobDescription?: string
  ): Promise<{ id: string; message: string }> => {
    const formData = new FormData();
    formData.append("resume", file);
    if (companyName) formData.append("companyName", companyName);
    if (jobTitle) formData.append("jobTitle", jobTitle);
    if (jobDescription) formData.append("jobDescription", jobDescription);

    const response = await api.post("/resumes/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Get all user resumes
  getResumes: async (): Promise<Resume[]> => {
    const response = await api.get("/resumes");
    return response.data;
  },

  // Get specific resume
  getResume: async (id: string): Promise<Resume> => {
    const response = await api.get(`/resumes/${id}`);
    return response.data;
  },

  // Get resume file URL
  getResumeFileUrl: (id: string): string => {
    const token = localStorage.getItem("auth_token");
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

  // Analyze resume with Gemini AI (backend)
  analyzeWithGeminiAI: async (
    resumeId: string,
    jobDescription?: string
  ): Promise<Feedback> => {
    const response = await api.post(`/ai/analyze/${resumeId}`, {
      jobDescription,
    });
    return response.data;
  },
};
