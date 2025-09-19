import { Link } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import { useEffect, useState } from "react";
import { resumeService, type Resume } from "~/lib/resumes";

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath, overallScore } }: { resume: Resume }) => {
    const [resumeUrl, setResumeUrl] = useState('');

    useEffect(() => {
        const loadResumeImage = async () => {
            if (!imagePath) return;
            
            try {
                // For now, we'll use a placeholder or generate image from PDF
                // This would need to be implemented based on your image generation logic
                setResumeUrl('/images/resume-placeholder.png');
            } catch (error) {
                console.error('Failed to load resume image:', error);
            }
        };

        loadResumeImage();
    }, [imagePath]);

    return (
        <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000">
            <div className="resume-card-header">
                <div className="flex flex-col gap-2">
                    {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
                    {jobTitle && <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>}
                    {!companyName && !jobTitle && <h2 className="!text-black font-bold">Resume</h2>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={feedback?.overallScore || overallScore || 0} />
                </div>
            </div>
            {resumeUrl && (
                <div className="gradient-border animate-in fade-in duration-1000">
                    <div className="w-full h-full">
                        <img
                            src={resumeUrl}
                            alt="resume"
                            className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
                        />
                    </div>
                </div>
                )}
        </Link>
    )
}
export default ResumeCard
