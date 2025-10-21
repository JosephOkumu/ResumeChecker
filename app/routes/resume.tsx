import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "~/lib/auth";
import { resumeService, type Resume, type Feedback } from "~/lib/resumes";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import Footer from "~/components/Footer";

export const meta = () => [
  { title: "JobPass | Review " },
  { name: "description", content: "Detailed overview of your resume" },
];

const Resume = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate, id]);

  useEffect(() => {
    const loadResume = async () => {
      if (!isAuthenticated || !id) return;

      try {
        const resumeData = await resumeService.getResume(id);
        setResume(resumeData);
        setFeedback(resumeData.feedback || null);

        // Set resume file URL
        const fileUrl = resumeService.getResumeFileUrl(id);
        setResumeUrl(fileUrl);

        // Convert PDF to image for display
        const { convertPdfToImage } = await import("~/lib/pdf2img");

        // Fetch the PDF file
        const pdfResponse = await fetch(fileUrl, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });

        if (pdfResponse.ok) {
          const pdfBlob = await pdfResponse.blob();
          const pdfFile = new File([pdfBlob], `resume_${id}.pdf`, {
            type: "application/pdf",
          });

          // Convert to image
          const conversionResult = await convertPdfToImage(pdfFile);
          if (conversionResult.imageUrl && !conversionResult.error) {
            setImageUrl(conversionResult.imageUrl);
          } else {
            console.warn(
              "PDF to image conversion failed:",
              conversionResult.error
            );
            setImageUrl("/images/resume-placeholder.png");
          }
        } else {
          setImageUrl("/images/resume-placeholder.png");
        }
      } catch (error) {
        console.error("Failed to load resume:", error);
        navigate("/");
      }
    };

    loadResume();
  }, [id, isAuthenticated, navigate]);

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link
          to="/upload"
          className="primary-button inline-flex items-center justify-center gap-2 w-auto"
        >
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span>Back</span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  title="resume"
                />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS
                score={feedback.ATS.score || 0}
                suggestions={feedback.ATS.tips || []}
              />
              <Details feedback={feedback} />
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" className="w-full" />
          )}
        </section>
      </div>
      <Footer />
    </main>
  );
};
export default Resume;
