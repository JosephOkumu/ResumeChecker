import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import Footer from "~/components/Footer";
import { useAuthStore } from "~/lib/auth";
import { resumeService, type Resume } from "~/lib/resumes";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

export function meta() {
  return [
    { title: "JobPass" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  // Removed automatic redirect - users must click "Get Started" to go to auth

  useEffect(() => {
    const loadResumes = async () => {
      if (!isAuthenticated) return;
      
      setLoadingResumes(true);
      try {
        const fetchedResumes = await resumeService.getResumes();
        setResumes(fetchedResumes);
      } catch (error) {
        console.error('Failed to load resumes:', error);
      } finally {
        setLoadingResumes(false);
      }
    };

    loadResumes();
  }, [isAuthenticated]);

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />

    <section className="main-section">
      <div className="page-heading py-16">
        {isAuthenticated ? (
          <>
            <h1>Track Your Applications & Resume Ratings</h1>
            {!loadingResumes && resumes?.length === 0 ? (
                <h2>No resumes found. Upload your first resume to get feedback.</h2>
            ): (
              <h2>Review your submissions and check resume analyzer feedback.</h2>
            )}
          </>
        ) : (
          <>
            <h1>Beat the ATS and Land Your Dream Job</h1>
            <h2>Get resume analyzer feedback with ATS scoring and personalized improvement tips</h2>
            
            {/* Features Section */}
            <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <img src="/icons/ats-warning.svg" alt="AI Analysis" className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800">Resume Analyzer Technology</h3>
                </div>
                <p className="text-gray-600 text-center">
                  Advanced resume analyzer reviews your resume content, structure, tone, and skills against job requirements for comprehensive feedback.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <img src="/icons/ats-good.svg" alt="ATS Score" className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800">ATS Compatibility Check</h3>
                </div>
                <p className="text-gray-600 text-center">
                  Ensure your resume passes Applicant Tracking Systems used by 99% of Fortune 500 companies. Get detailed compatibility scores and fixes.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <img src="/icons/ats-bad.svg" alt="Improvement Tips" className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800">Detailed Recommendations</h3>
                </div>
                <p className="text-gray-600 text-center">
                  Receive specific, actionable recommendations to optimize your resume and increase your chances of getting interviews.
                </p>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="mt-16 bg-white rounded-xl p-8 max-w-4xl mx-auto shadow-lg">
              <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">Why Use Our ATS System?</h3>
              <div className="text-center space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 text-lg text-gray-800">🎯 Used by top companies Globally</h4>
                  <p className="text-gray-600">Trusted by Fortune 500 companies and leading organizations worldwide to streamline their recruitment process.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-lg text-gray-800">📈 Get Selected for Interviews</h4>
                  <p className="text-gray-600">Our system ensures you get a chance to be shortlisted for an interview.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-lg text-gray-800">🔍 Detailed Scoring</h4>
                  <p className="text-gray-600">Receive scores for ATS compatibility, content quality, structure, tone, and skills alignment.</p>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="mt-16 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">How It Works</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold text-2xl">1</span>
                  </div>
                  <h4 className="font-semibold mb-2 text-gray-800">Sign In</h4>
                  <p className="text-gray-600 text-sm">Sign in with Google and upload your PDF resume along with job details for targeted analysis</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 font-bold text-2xl">2</span>
                  </div>
                  <h4 className="font-semibold mb-2 text-gray-800">Analyze Resume</h4>
                  <p className="text-gray-600 text-sm">Our resume analyzer system reviews your resume against ATS requirements and job-specific criteria</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-purple-600 font-bold text-2xl">3</span>
                  </div>
                  <h4 className="font-semibold mb-2 text-gray-800">Get Results</h4>
                  <p className="text-gray-600 text-sm">Receive detailed scores, feedback, and specific recommendations to improve your resume</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <Link to="/auth" className="primary-button text-xl font-semibold px-8 py-4">
                Get Started
              </Link>
            </div>
          </>
        )}
      </div>
      
      {isAuthenticated && (
        <>
          {loadingResumes && (
              <div className="flex flex-col items-center justify-center">
                <img src="/images/resume-scan-2.gif" className="w-[200px]" />
              </div>
          )}

          {!loadingResumes && resumes.length > 0 && (
            <div className="resumes-section">
              {resumes.map((resume) => (
                  <ResumeCard key={resume.id} resume={resume} />
              ))}
            </div>
          )}

          {!loadingResumes && resumes?.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-10 gap-4">
                <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
                  Upload Resume
                </Link>
              </div>
          )}
        </>
      )}
    </section>
    <Footer />
  </main>
}
