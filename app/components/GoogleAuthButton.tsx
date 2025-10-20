import { useEffect, useState } from 'react';
import { useAuthStore } from '~/lib/auth';

declare global {
    interface Window {
        google: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, config: any) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

interface GoogleAuthButtonProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

const GoogleAuthButton = ({ onSuccess, onError }: GoogleAuthButtonProps) => {
    const { signInWithGoogle, isLoading } = useAuthStore();
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);

    useEffect(() => {
        let script: HTMLScriptElement | null = null;
        
        const loadGoogleScript = () => {
            // Check if Google script is already loaded
            if (window.google?.accounts?.id) {
                setIsGoogleLoaded(true);
                initializeGoogleAuth();
                return;
            }

            // Load Google Identity Services script
            script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                // Wait a bit for Google to be fully available
                setTimeout(() => {
                    if (window.google?.accounts?.id) {
                        setIsGoogleLoaded(true);
                        initializeGoogleAuth();
                    } else {
                        setInitError('Google Sign-In failed to initialize');
                    }
                }, 100);
            };
            
            script.onerror = () => {
                setInitError('Failed to load Google Sign-In script');
            };
            
            document.head.appendChild(script);
        };

        loadGoogleScript();

        return () => {
            if (script && document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    const initializeGoogleAuth = () => {
        try {
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            
            if (!clientId) {
                setInitError('Google Client ID not configured');
                return;
            }

            if (window.google?.accounts?.id) {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleGoogleResponse,
                    use_fedcm_for_prompt: false,
                    cancel_on_tap_outside: false,
                });

                // Wait for the DOM element to be available
                setTimeout(() => {
                    const buttonElement = document.getElementById('google-signin-button');
                    if (buttonElement) {
                        window.google.accounts.id.renderButton(buttonElement, {
                            theme: 'outline',
                            size: 'large',
                            width: 400,
                            text: 'signin_with',
                        });
                    } else {
                        setInitError('Button element not found');
                    }
                }, 50);
            }
        } catch (error) {
            console.error('Google Auth initialization error:', error);
            setInitError('Failed to initialize Google Sign-In');
        }
    };

    const handleGoogleResponse = async (response: any) => {
        try {
            await signInWithGoogle(response.credential);
            onSuccess?.();
        } catch (error: any) {
            onError?.(error.message);
        }
    };

    // Show error state
    if (initError) {
        return (
            <div className="w-full">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {initError}
                </div>
                <button 
                    className="auth-button" 
                    onClick={() => {
                        setInitError(null);
                        setIsGoogleLoaded(false);
                        // Retry initialization
                        setTimeout(() => {
                            const script = document.createElement('script');
                            script.src = 'https://accounts.google.com/gsi/client';
                            script.async = true;
                            script.defer = true;
                            script.onload = () => {
                                setTimeout(() => {
                                    if (window.google?.accounts?.id) {
                                        setIsGoogleLoaded(true);
                                        initializeGoogleAuth();
                                    } else {
                                        setInitError('Google Sign-In failed to initialize');
                                    }
                                }, 100);
                            };
                            document.head.appendChild(script);
                        }, 100);
                    }}
                >
                    <p>Retry Google Sign-In</p>
                </button>
            </div>
        );
    }

    // Show loading state only for auth loading, not Google script loading
    if (isLoading) {
        return (
            <button className="auth-button animate-pulse" disabled>
                <p>Signing you in...</p>
            </button>
        );
    }

    // Show nothing while Google is loading instead of loading button
    if (!isGoogleLoaded) {
        return null;
    }

    // Render the Google button container
    return (
        <div className="w-full flex justify-center">
            <div id="google-signin-button" className="flex justify-center" />
        </div>
    );
};

export default GoogleAuthButton;
