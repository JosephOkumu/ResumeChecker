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

    useEffect(() => {
        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            setIsGoogleLoaded(true);
            initializeGoogleAuth();
        };
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const initializeGoogleAuth = () => {
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse,
                use_fedcm_for_prompt: false,
                cancel_on_tap_outside: false,
            });

            // Render the button
            const buttonElement = document.getElementById('google-signin-button');
            if (buttonElement) {
                window.google.accounts.id.renderButton(buttonElement, {
                    theme: 'outline',
                    size: 'large',
                    width: 400,
                    text: 'signin_with',
                });
            }
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

    if (!isGoogleLoaded || isLoading) {
        return (
            <button className="auth-button animate-pulse" disabled>
                <p>Loading...</p>
            </button>
        );
    }

    return <div id="google-signin-button" className="w-full" />;
};

export default GoogleAuthButton;
