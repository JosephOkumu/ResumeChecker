// Dynamic Puter.js loader for AI functionality only
let puterLoaded = false;
let puterLoadPromise: Promise<void> | null = null;

export const loadPuterJS = (): Promise<void> => {
    if (puterLoaded) {
        return Promise.resolve();
    }

    if (puterLoadPromise) {
        return puterLoadPromise;
    }

    puterLoadPromise = new Promise((resolve, reject) => {
        // Check if Puter is already available
        if (typeof window !== 'undefined' && window.puter) {
            puterLoaded = true;
            resolve();
            return;
        }

        // Create and load the script
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        script.async = true;
        
        script.onload = () => {
            // Wait for Puter to be available
            const checkPuter = () => {
                if (window.puter) {
                    puterLoaded = true;
                    resolve();
                } else {
                    setTimeout(checkPuter, 100);
                }
            };
            checkPuter();
        };
        
        script.onerror = () => {
            reject(new Error('Failed to load Puter.js'));
        };
        
        document.head.appendChild(script);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (!puterLoaded) {
                reject(new Error('Puter.js load timeout'));
            }
        }, 10000);
    });

    return puterLoadPromise;
};

export const isPuterLoaded = (): boolean => {
    return puterLoaded && typeof window !== 'undefined' && !!window.puter;
};
