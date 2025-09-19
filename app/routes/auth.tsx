import { useAuthStore } from "~/lib/auth";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import GoogleAuthButton from "~/components/GoogleAuthButton";

export const meta = () => ([
    { title: 'Resumind | Auth' },
    { name: 'description', content: 'Log into your account' },
])

const Auth = () => {
    const { isAuthenticated, isLoading, user, signOut, error, clearError } = useAuthStore();
    const location = useLocation();
    const next = location.search.split('next=')[1] || '/';
    const navigate = useNavigate();
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            navigate(next);
        }
    }, [isAuthenticated, next, navigate]);

    useEffect(() => {
        if (error) {
            setAuthError(error);
            clearError();
        }
    }, [error, clearError]);

    const handleAuthSuccess = () => {
        navigate(next);
    };

    const handleAuthError = (errorMessage: string) => {
        setAuthError(errorMessage);
    };

    return (
        <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
            <div className="gradient-border shadow-lg">
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>Welcome</h1>
                        <h2>Log In to Continue Your Job Journey</h2>
                    </div>
                    
                    {authError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {authError}
                        </div>
                    )}

                    <div>
                        {isLoading ? (
                            <button className="auth-button animate-pulse" disabled>
                                <p>Signing you in...</p>
                            </button>
                        ) : (
                            <>
                                {isAuthenticated && user ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="text-center">
                                            <p className="text-gray-600">Signed in as</p>
                                            <p className="font-semibold">{user.name}</p>
                                        </div>
                                        <button className="auth-button" onClick={signOut}>
                                            <p>Log Out</p>
                                        </button>
                                    </div>
                                ) : (
                                    <GoogleAuthButton 
                                        onSuccess={handleAuthSuccess}
                                        onError={handleAuthError}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>
        </main>
    )
}

export default Auth
