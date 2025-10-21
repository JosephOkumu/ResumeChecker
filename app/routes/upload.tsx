import { type FormEvent, useState, useEffect } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import Footer from "~/components/Footer";
import { useAuthStore } from "~/lib/auth";
import { useNavigate } from "react-router";
import { resumeService } from "~/lib/resumes";
import { convertPdfToImage } from "~/lib/pdf2img";
import { prepareInstructions } from "../../constants";

const Upload = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const generateUUID = () => {
    return crypto.randomUUID();
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    setIsProcessing(true);

    try {
      console.log("Starting analysis process...");
      console.log("Company:", companyName, "Job Title:", jobTitle);
      console.log("Job Description:", jobDescription);
      console.log("File:", file.name, file.type, file.size);

      setStatusText("Uploading the file...");
      const uploadResult = await resumeService.uploadResume(
        file,
        companyName,
        jobTitle,
        jobDescription
      );
      console.log("Upload result:", uploadResult);

      setStatusText("Analyzing with AI...");
      console.log("Starting Gemini AI analysis...");

      const feedback = await resumeService.analyzeWithGeminiAI(
        uploadResult.id,
        jobDescription
      );
      console.log("Analysis feedback received:", feedback);

      setStatusText("Analysis complete, redirecting...");
      navigate(`/resume/${uploadResult.id}`);
    } catch (error) {
      console.error("Upload/Analysis error:", error);
      setStatusText(
        `Error: ${(error as Error).message || "Failed to process resume"}`
      );
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;
    const formData = new FormData(form);

    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    if (!file) return;

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-8">
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 mt-4">
              <h2>{statusText}</h2>
              <img src="/images/resume-scan-2.gif" className="w-[200px]" />
            </div>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}
          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
};
export default Upload;
