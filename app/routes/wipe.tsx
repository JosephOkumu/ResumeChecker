import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "~/lib/auth";
import { resumeService } from "~/lib/resumes";

const WipeApp = () => {
    const { isAuthenticated, user } = useAuthStore();
    const navigate = useNavigate();
    const [resumes, setResumes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadResumes = async () => {
        try {
            const userResumes = await resumeService.getResumes();
            setResumes(userResumes);
        } catch (error) {
            console.error('Failed to load resumes:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadResumes();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/auth");
        }
    }, [isAuthenticated, navigate]);

    const handleDeleteAllResumes = async () => {
        setIsLoading(true);
        try {
            for (const resume of resumes) {
                await resumeService.deleteResume(resume.id);
            }
            await loadResumes(); // Refresh the list
        } catch (error) {
            console.error('Failed to delete resumes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) {
        return <div>Redirecting to authentication...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Data Management</h1>
            <p className="mb-4">Authenticated as: {user?.name} ({user?.email})</p>
            
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Your Resumes ({resumes.length})</h2>
                <div className="flex flex-col gap-2 mb-4">
                    {resumes.map((resume) => (
                        <div key={resume.id} className="flex flex-row gap-4 p-2 border rounded">
                            <p>{resume.fileName}</p>
                            <p className="text-gray-500">{resume.companyName || 'No company'}</p>
                        </div>
                    ))}
                </div>
            </div>
            
            <div>
                <button
                    className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer disabled:opacity-50"
                    onClick={handleDeleteAllResumes}
                    disabled={isLoading || resumes.length === 0}
                >
                    {isLoading ? 'Deleting...' : 'Delete All Resumes'}
                </button>
            </div>
        </div>
    );
};

export default WipeApp;
