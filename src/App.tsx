// Fix: Implementing the main App component and fixing module resolution error.
import { useState } from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Header } from "./components/Header";
import { FinancialForm } from "./components/FinancialForm";
import { Dashboard } from "./components/Dashboard";
import { Loader } from "./components/Loader";
import { getFinancialAnalysis } from "./services/geminiService";
import { FinancialData, AnalysisResult, UserProfile } from "./types";

function App() {
  // Mock user state and auth functions as no auth provider is implemented.
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    // This would be replaced by actual Google login logic
    setIsAuthLoading(true);
    setIsAuthReady(false); // Disable button while "logging in"
    setTimeout(() => {
      setUser({
        name: "Alex Doe",
        email: "alex.doe@example.com",
        picture: "https://via.placeholder.com/40",
      });
      setIsAuthLoading(false);
      setIsAuthReady(true);
    }, 1000);
  };

  const handleLogout = () => {
    setUser(null);
    setAnalysis(null);
    setError(null);
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
            _jsx(FinancialForm, { onSubmit: handleFormSubmit, isLoading: isLoading }),
            isLoading && _jsx(Loader, {}),
            error && _jsx("div", { role: "alert", className: "error-message", children: `Error: ${error}` }),
            !isLoading && analysis && _jsx(Dashboard, { analysis: analysis })
          ] })
        )
      })
    ] })
  );
}

export default App;
