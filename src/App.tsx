import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';

// --- Types ---
interface UserProfile {
    name: string;
    email: string;
    picture: string;
}

// Fix: Add type definitions for gapi and google on the window object to fix TypeScript errors.
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

// --- Constants ---
const GOOGLE_CLIENT_ID = '893573004367-bmlcptqthf4o8ipp0u0t2uuo632l76s6.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const App = () => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    const fetchUserProfile = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch user profile. Status: ${response.status}`);
            }
            const profile = await response.json();
            setUserProfile({
                name: profile.name,
                email: profile.email,
                picture: profile.picture,
            });
        } catch (error) {
            console.error("Error fetching user profile, signing out:", error);
            handleSignOut();
        }
    }, []);

    const handleSignOut = useCallback(() => {
        setIsAuthLoading(true);
        const token = window.gapi?.client?.getToken();
        if (token?.access_token && window.google?.accounts?.oauth2) {
            window.google.accounts.oauth2.revoke(token.access_token, () => {});
        }
        window.gapi?.client?.setToken(null);
        setUserProfile(null);
        setIsAuthLoading(false);
    }, []);

    const handleSignIn = useCallback(() => {
        setIsAuthLoading(true);
        if (!window.google?.accounts?.oauth2 || !GOOGLE_CLIENT_ID) {
            console.error("Google Identity Services not ready or Client ID is missing.");
            setIsAuthLoading(false);
            return;
        }
        try {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: SCOPES,
                prompt: 'consent',
                callback: (tokenResponse) => {
                    setIsAuthLoading(false);
                    if (tokenResponse.error) {
                        if (tokenResponse.error !== 'popup_closed_by_user' && tokenResponse.error !== 'access_denied') {
                             console.error("Google Auth Error:", tokenResponse.error, tokenResponse.error_description);
                        }
                        return;
                    }
                    if (tokenResponse.access_token) {
                        window.gapi.client.setToken(tokenResponse);
                        fetchUserProfile(tokenResponse.access_token);
                    }
                },
                error_callback: (error) => {
                    setIsAuthLoading(false);
                    console.error("Google Auth Client Error:", error);
                }
            });
            client.requestAccessToken();
        } catch (error) {
             console.error("Failed to initialize Google Token Client:", error);
             setIsAuthLoading(false);
        }

    }, [fetchUserProfile]);


    useEffect(() => {
        const interval = setInterval(() => {
            if (window.gapi && window.google?.accounts?.oauth2) {
                clearInterval(interval);
                 if (GOOGLE_CLIENT_ID) {
                    setIsAuthReady(true);
                } else {
                    console.warn("Google Client ID is missing. Google Drive features will be disabled.");
                }
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);


    return (
        _jsx("div", { className: "app-container", children:
            _jsx(Header, {
                user: userProfile,
                onLogin: handleSignIn,
                onLogout: handleSignOut,
                isAuthReady: isAuthReady,
                isAuthLoading: isAuthLoading
            })
        })
    );
};

export default App;
