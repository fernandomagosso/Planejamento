import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { FinancialForm } from './components/FinancialForm';
import { AiDiagnosis, DashboardSummary, FormSummary } from './components/Dashboard';
import { analyzeFinancials } from './services/geminiService';
import type { FinancialData, UserProfile } from './types';
import './components/index.css';

// Define constants outside the component to avoid re-declarations and simplify dependency arrays
const GOOGLE_CLIENT_ID = '893573004367-bmlcptqthf4o8ipp0u0t2uuo632l76s6.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const App: React.FC = () => {
    // App State
    const [view, setView] = useState<'form' | 'dashboard'>('form');
    const [financialData, setFinancialData] = useState<FinancialData>({
        income: [{ id: Date.now(), description: 'Salário Líquido', amount: 0 }],
        expenses: [{ id: Date.now() + 1, description: 'Aluguel', amount: 0 }],
        debts: [{ id: Date.now() + 2, description: 'Cartão de Crédito', amount: 0, loanAmount: 0, outstandingBalance: 0, totalInstallments: 0, monthlyInterestRate: 0, annualInterestRate: 0, startDate: '', endDate: '' }],
        incomeForecast: { growthRate: 0, monthsToForecast: 12 },
    });
    const [analyzedData, setAnalyzedData] = useState<FinancialData | null>(null);
    const [aiResponse, setAiResponse] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Google Auth State
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isGapiClientReady, setIsGapiClientReady] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [driveFileLink, setDriveFileLink] = useState<string|null>(null);

    const handleSignOut = useCallback(() => {
        setIsAuthLoading(true);
        const token = (window as any).gapi?.client?.getToken();
        if (token?.access_token && (window as any).google?.accounts?.oauth2) {
            (window as any).google.accounts.oauth2.revoke(token.access_token, () => {});
        }
        (window as any).gapi?.client?.setToken(null);
        setUserProfile(null);
        setIsAuthLoading(false);
    }, []);

    const fetchUserProfile = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch user profile. Status: ${response.status}`);
            }
            const profile = await response.json();
            setUserProfile({ name: profile.name, email: profile.email, picture: profile.picture });
        } catch (error) {
            console.error("Error fetching user profile, signing out:", error);
            handleSignOut();
        }
    }, [handleSignOut]);

    const handleSignIn = useCallback(() => {
        setIsAuthLoading(true);
        if (!(window as any).google?.accounts?.oauth2 || !GOOGLE_CLIENT_ID) {
            console.error("Google Identity Services not ready or Client ID is missing.");
            setIsAuthLoading(false);
            return;
        }

        try {
            const client = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: SCOPES,
                prompt: 'consent',
                callback: (tokenResponse: any) => {
                    setIsAuthLoading(false);
                    if (tokenResponse.error) {
                        if (tokenResponse.error !== 'popup_closed_by_user' && tokenResponse.error !== 'access_denied') {
                             console.error("Google Auth Error:", tokenResponse.error, tokenResponse.error_description);
                        }
                        return;
                    }
                    if (tokenResponse.access_token) {
                       (window as any).gapi.client.setToken(tokenResponse);
                       fetchUserProfile(tokenResponse.access_token);
                    }
                },
                error_callback: (error: any) => {
                   setIsAuthLoading(false);
                   console.error("Google Auth Client Error:", error);
                }
            });
            client.requestAccessToken();
        } catch(error) {
            console.error("Failed to initialize Google Token Client:", error);
            setIsAuthLoading(false);
        }
    }, [fetchUserProfile]);


    useEffect(() => {
        // This effect now only checks for the readiness of the Google Identity Services
        // to enable the login button. No other API initialization happens on page load.
        const interval = setInterval(() => {
            if ((window as any).google?.accounts?.oauth2) {
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

    const initializeGapiClient = useCallback(async () => {
        if (isGapiClientReady) return true;
        try {
             await new Promise<void>((resolve, reject) => {
                (window as any).gapi.load('client', () => {
                    (window as any).gapi.client.init({})
                        .then(() => (window as any).gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4'))
                        .then(resolve)
                        .catch(reject);
                });
            });
            setIsGapiClientReady(true);
            return true;
        } catch(error) {
            console.error("GAPI client initialization error:", error);
            return false;
        }
    }, [isGapiClientReady]);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setDriveFileLink(null);
        setAnalyzedData(financialData);
        const response = await analyzeFinancials(financialData);
        setAiResponse(response);
        setView('dashboard');
        setIsLoading(false);
    };

    const handleEdit = () => {
        setView('form');
        setAiResponse('');
        setAnalyzedData(null);
        setDriveFileLink(null);
    };

    const handleSaveToDrive = async () => {
        if (!analyzedData || !userProfile) return;

        setIsSaving(true);
        setDriveFileLink(null);
        
        const gapiReady = await initializeGapiClient();
        if (!gapiReady) {
            console.error("Google Sheets API client could not be initialized.");
            setIsSaving(false);
            return;
        }
        
        const SPREADSHEET_ID = '1M6NsWyLGMiMV32cJEE2Ntm9Ccn_tTx1pbaoA4cIBw-8';

        try {
            const clearRequest = {
                spreadsheetId: SPREADSHEET_ID,
                resource: { ranges: ["Resumo!A1:Z", "Rendas!A1:Z", "Gastos!A1:Z", "Dívidas!A1:Z"] }
            };
            await (window as any).gapi.client.sheets.spreadsheets.values.batchClear(clearRequest);
            
            const incomeData = [["Descrição", "Valor (R$)"], ...analyzedData.income.map(i => [i.description, i.amount])];
            const expensesData = [["Descrição", "Valor (R$)"], ...analyzedData.expenses.map(e => [e.description, e.amount])];
            const debtsData = [
                ["Descrição", "Valor do Empréstimo", "Saldo Devedor", "Valor da Parcela", "CET a.m. (%)", "CET a.a. (%)", "Total de Parcelas", "Data de Início", "Data Final"],
                ...analyzedData.debts.map(d => [d.description, d.loanAmount, d.outstandingBalance, d.amount, d.monthlyInterestRate, d.annualInterestRate, d.totalInstallments, d.startDate, d.endDate])
            ];
            
            const dataToWrite = [
                { range: "Resumo!A1", values: [[aiResponse.replace(/###\s/g, '')]] },
                { range: "Rendas!A1", values: incomeData },
                { range: "Gastos!A1", values: expensesData },
                { range: "Dívidas!A1", values: debtsData },
            ];

            const batchUpdateRequest = { spreadsheetId: SPREADSHEET_ID, resource: { data: dataToWrite, valueInputOption: 'USER_ENTERED' } };
            await (window as any).gapi.client.sheets.spreadsheets.values.batchUpdate(batchUpdateRequest);

            setDriveFileLink(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/`);

        } catch (error: any) {
            console.error("Error saving to Google Drive:", error);
            if (error?.result?.error?.code === 401 || error?.result?.error?.code === 403) {
                handleSignOut();
            }
        } finally {
            setIsSaving(false);
        }
    };

  return (
    <div className="app-container">
      <Header user={userProfile} onLogin={handleSignIn} onLogout={handleSignOut} isAuthReady={isAuthReady} isAuthLoading={isAuthLoading} />
      <main role="main" className="main-layout">
        <div className="main-content">
             {isLoading ? <Loader text="Aguarde, nossa IA está preparando seu diagnóstico financeiro..." /> : (
                view === 'form'
                    ? <FinancialForm data={financialData} setData={setFinancialData} onAnalyze={handleAnalyze} />
                    : <AiDiagnosis aiResponse={aiResponse} />
            )}
        </div>
        <aside className="sidebar">
             {view === 'form' ? (
                <FormSummary data={financialData} />
            ) : (
                analyzedData && <DashboardSummary data={analyzedData} onEdit={handleEdit} isLoggedIn={!!userProfile} onSave={handleSaveToDrive} isSaving={isSaving} driveFileLink={driveFileLink} />
            )}
        </aside>
      </main>
    </div>
  );
};

export default App;