// Fix: Implementing the main App component and fixing module resolution error.
import { useState, useEffect, useCallback } from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Header } from "./components/Header";
import { FinancialForm } from "./components/FinancialForm";
import { Dashboard } from "./components/Dashboard";
import { Loader } from "./components/Loader";
// Import new component and service function
import { FinancialInsights } from "./components/FinancialInsights";
import { getFinancialAnalysis, getFinancialInsights } from "./services/geminiService";
// Import new types
import { FinancialData, AnalysisResult, UserProfile, InsightResult } from "./types";

// Add a declaration for the google object from the script
declare global {
  // FIX: Augment the Window interface to declare the 'google' property for Google Sign-In and OAuth2.
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (cb: any) => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => any;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = "893573004367-bmlcptqthf4o8ipp0u0t2uuo632l76s6.apps.googleusercontent.com";

// Simple JWT decoder for Google's credential response
const decodeJwtResponse = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT", e);
        return null;
    }
}

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // State for financial analysis
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for financial insights
  const [insights, setInsights] = useState<InsightResult | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // New state for Google Drive connection
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [driveTokenClient, setDriveTokenClient] = useState<any>(null);


  const handleAuthCallback = useCallback((response: any) => {
    setIsAuthLoading(true);
    const userObject = decodeJwtResponse(response.credential);
    if (userObject) {
      setUser({
        name: userObject.name,
        email: userObject.email,
        picture: userObject.picture,
      });
    }
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    const initGsi = () => {
      if (!window.google || !window.google.accounts) {
        // If google is not on window, wait and retry. This is to handle the script loading delay.
        setTimeout(initGsi, 100);
        return;
      }
      
      // Fix: Access google object via window.
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleAuthCallback,
        // FIX: Disable FedCM to prevent the 'identity-credentials-get' error.
        use_fedcm_for_prompt: false,
      });

      // Initialize token client for Google Drive API
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            console.log("Successfully connected to Google Drive.");
            setIsDriveConnected(true);
          }
        },
      });
      setDriveTokenClient(tokenClient);

      setIsAuthReady(true);
    };

    initGsi();
  }, [handleAuthCallback]);

  const handleLogin = () => {
    if (!isAuthReady || !window.google) {
        console.error("Google Auth not ready.");
        return;
    }
    setIsAuthLoading(true);
    // Fix: Access google object via window.
    window.google.accounts.id.prompt((notification: any) => {
        // This callback is useful for handling when the prompt doesn't show.
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setIsAuthLoading(false);
        }
    });
  };

  const handleLogout = () => {
    if (window.google) {
        // Fix: Access google object via window.
        window.google.accounts.id.disableAutoSelect();
    }
    setUser(null);
    setAnalysis(null);
    setError(null);
    setInsights(null);
    setInsightsError(null);
    setIsDriveConnected(false); // Reset drive connection
  };

  const handleDriveConnect = () => {
    if (driveTokenClient) {
      driveTokenClient.requestAccessToken();
    } else {
      console.error("Google Drive token client not initialized.");
    }
  };

  const handleFormSubmit = async (data: FinancialData) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await getFinancialAnalysis(data);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // New handler for fetching insights
  const handleFetchInsights = async (topic: string) => {
    setIsInsightsLoading(true);
    setInsightsError(null);
    setInsights(null);
    try {
      const result = await getFinancialInsights(topic);
      setInsights(result);
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsInsightsLoading(false);
    }
  };


  return (
    _jsxs("div", { className: "app-container", children: [
      _jsx(Header, {
        user: user,
        onLogin: handleLogin,
        onLogout: handleLogout,
        isAuthReady: isAuthReady,
        isAuthLoading: isAuthLoading
      }),
      _jsx("main", { className: "main-content", children:
        !user ? (
          _jsx("div", { className: "welcome-message", children:
            _jsxs("div", { children: [
                _jsx("h2", { children: "Welcome to FinanZen" }),
                _jsx("p", { children: "Your personal AI financial assistant. Please log in to continue."})
            ]})
          })
        ) : (
          _jsxs(_Fragment, { children: [
            _jsxs("div", { className: "drive-connect-section", children: [
              _jsx("h3", { children: "Expand Your Experience" }),
              !isDriveConnected ? 
                _jsxs(_Fragment, { children: [
                  _jsx("p", { style: { color: 'var(--text-color)', marginBottom: '1rem'}, children: "Connect to Google Drive to save and manage your financial reports." }),
                  _jsx("button", {
                    onClick: handleDriveConnect,
                    className: "btn btn-secondary",
                    disabled: !isAuthReady,
                    children: "Connect to Google Drive"
                  })
                ]})
                : 
                _jsx("p", { children: "\u2705 Connected to Google Drive" })
            ]}),
            _jsx("hr", { className: "section-divider" }),
            _jsx(FinancialForm, { onSubmit: handleFormSubmit, isLoading: isLoading }),
            isLoading && _jsx(Loader, {}),
            error && _jsx("div", { role: "alert", className: "error-message", children: `Error: ${error}` }),
            !isLoading && analysis && _jsx(Dashboard, { analysis: analysis }),
            // Render new FinancialInsights component
            _jsx("hr", { className: "section-divider" }),
            _jsx(FinancialInsights, {
                onFetchInsights: handleFetchInsights,
                isLoading: isInsightsLoading,
                error: insightsError,
                insights: insights
            })
          ] })
        )
      })
    ] })
  );
}

export default App;