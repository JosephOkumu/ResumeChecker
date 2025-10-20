import { useAuthStore } from "~/lib/auth";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import GoogleAuthButton from "~/components/GoogleAuthButton";

export const meta = () => ([
    { title: 'JobPass | Auth' },
    { name: 'description', content: 'Log into your account' },
])

const Auth = () => {
    const { isAuthenticated, isLoading, user, signOut, error, clearError } = useAuthStore();
    const location = useLocation();
    const next = new URLSearchParams(location.search).get('next') || '/upload';
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
        <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center p-4">
            <div className="gradient-border shadow-2xl max-w-md w-full">
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-8 md:p-10">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-2">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Welcome to JobPass</h1>
                    </div>
                    
                    {authError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {authError}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-4">
                        {isLoading ? (
                            <div className="w-full flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <p className="text-gray-600">Signing you in...</p>
                            </div>
                        ) : (
                            <>
                                {isAuthenticated && user ? (
                                    <div className="flex flex-col gap-6 w-full">
                                        <div className="text-center bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <p className="text-green-700 font-medium">Successfully signed in</p>
                                            </div>
                                            <p className="text-green-600">{user.name}</p>
                                        </div>
                                        <button className="auth-button bg-red-500 hover:bg-red-600 text-white" onClick={signOut}>
                                            <p>Sign Out</p>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full flex flex-col items-center gap-4">
                                        <p className="text-gray-600 text-center">Continue with your Google account to get started</p>
                                        <div className="w-full flex justify-center">
                                            <GoogleAuthButton 
                                                onSuccess={handleAuthSuccess}
                                                onError={handleAuthError}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <span>Secure authentication with Google</span>
                                        </div>
                                    </div>
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
