import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { FinancialForm } from './components/FinancialForm';
import { AiDiagnosis, DashboardSummary, FormSummary } from './components/Dashboard';
import { analyzeFinancials } from './services/geminiService';
import type { FinancialData, UserProfile, FinancialDataItem, DebtItem } from './types';
import './components/index.css';

// --- Constants ---
const GOOGLE_CLIENT_ID = '893573004367-bmlcptqthf4o8ipp0u0t2uuo632l76s6.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const SPREADSHEET_NAME = 'FinanZen - Análise Financeira';

const INITIAL_FINANCIAL_DATA: FinancialData = {
    income: [{ id: Date.now(), description: 'Salário Líquido', amount: 0 }],
    expenses: [{ id: Date.now() + 1, description: 'Aluguel', amount: 0 }],
    debts: [{ id: Date.now() + 2, description: 'Cartão de Crédito', amount: 0, loanAmount: 0, outstandingBalance: 0, totalInstallments: 0, monthlyInterestRate: 0, annualInterestRate: 0, startDate: '', endDate: '' }],
    incomeForecast: { growthRate: 0, monthsToForecast: 12 },
};

// --- Main Application Component ---
const App: React.FC = () => {
    // --- State Management ---
    const [view, setView] = useState<'form' | 'dashboard'>('form');
    const [financialData, setFinancialData] = useState<FinancialData>(INITIAL_FINANCIAL_DATA);
    const [analyzedData, setAnalyzedData] = useState<FinancialData | null>(null);
    const [aiResponse, setAiResponse] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingText, setLoadingText] = useState<string>('');

    // Authentication State
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    
    // Google API State
    const [isGapiClientReady, setIsGapiClientReady] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [driveFileLink, setDriveFileLink] = useState<string | null>(null);
    const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
    const [isFindingFile, setIsFindingFile] = useState(false);

    // --- Authentication Logic ---
    const handleSignOut = useCallback(() => {
        setIsAuthLoading(true);
        const token = (window as any).gapi?.client?.getToken();
        if (token?.access_token && (window as any).google?.accounts?.oauth2) {
            (window as any).google.accounts.oauth2.revoke(token.access_token, () => {});
        }
        (window as any).gapi?.client?.setToken(null);
        setUserProfile(null);
        setSpreadsheetId(null);
        setDriveFileLink(null);
        setIsAuthLoading(false);
    }, []);

    const fetchUserProfile = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error(`Failed to fetch user profile. Status: ${response.status}`);
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
        } catch (error) {
            console.error("Failed to initialize Google Token Client:", error);
            setIsAuthLoading(false);
        }
    }, [fetchUserProfile]);

    // --- Google API Initialization and Drive Logic ---
    const initializeGapiClient = useCallback(async () => {
        if (isGapiClientReady) return true;
        try {
            await new Promise<void>((resolve, reject) => {
                (window as any).gapi.load('client', () => {
                    (window as any).gapi.client.init({})
                        .then(() => Promise.all([
                            (window as any).gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4'),
                            (window as any).gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest')
                        ]))
                        .then(() => resolve())
                        .catch(reject);
                });
            });
            setIsGapiClientReady(true);
            return true;
        } catch (error) {
            console.error("GAPI client initialization error:", error);
            return false;
        }
    }, [isGapiClientReady]);

    const findSpreadsheet = useCallback(async () => {
        setIsFindingFile(true);
        setSpreadsheetId(null);
        try {
            const response = await (window as any).gapi.client.drive.files.list({
                q: `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed = false`,
                fields: 'files(id)',
                spaces: 'drive',
            });
            if (response.result.files && response.result.files.length > 0) {
                setSpreadsheetId(response.result.files[0].id);
            }
        } catch (error) {
            console.error("Error finding spreadsheet:", error);
        } finally {
            setIsFindingFile(false);
        }
    }, []);
    
    // --- Effects for Initialization ---
    useEffect(() => {
        const interval = setInterval(() => {
            if ((window as any).google?.accounts?.oauth2) {
                clearInterval(interval);
                if (GOOGLE_CLIENT_ID) setIsAuthReady(true);
                else console.warn("Google Client ID is missing. Google Drive features will be disabled.");
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);
    
    useEffect(() => {
        const initAndSearch = async () => {
            if (userProfile) {
                const gapiReady = await initializeGapiClient();
                if (gapiReady) await findSpreadsheet();
            } else {
                setSpreadsheetId(null);
            }
        };
        initAndSearch();
    }, [userProfile, initializeGapiClient, findSpreadsheet]);

    // --- Core Application Logic ---
    const handleAnalyze = async () => {
        setLoadingText("Aguarde, nossa IA está preparando seu diagnóstico financeiro...");
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

    const handleLoadFromDrive = async () => {
        if (!spreadsheetId) return;
        setLoadingText("Carregando seus dados do Google Drive...");
        setIsLoading(true);
        try {
            const ranges = ['Rendas!A2:B', 'Gastos!A2:B', 'Dívidas!A2:I'];
            const response = await (window as any).gapi.client.sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges });
            
            const parseFinancialData = (values?: string[][]): FinancialDataItem[] => {
                if (!values || values.length === 0) return [{ id: Date.now(), description: '', amount: 0 }];
                return values.map((row, i) => ({ id: Date.now() + i, description: row[0] || '', amount: parseFloat(row[1]?.replace(/[^0-9,-]+/g,"").replace(",", ".")) || 0 }));
            };
            const parseDebtData = (values?: string[][]): DebtItem[] => {
                 if (!values || values.length === 0) return [{ ...INITIAL_FINANCIAL_DATA.debts[0], id: Date.now() }];
                 return values.map((row, i) => ({
                    id: Date.now() + i + 1000,
                    description: row[0] || '',
                    loanAmount: parseFloat(row[1]?.replace(/[^0-9,-]+/g,"").replace(",", ".")) || 0,
                    outstandingBalance: parseFloat(row[2]?.replace(/[^0-9,-]+/g,"").replace(",", ".")) || 0,
                    amount: parseFloat(row[3]?.replace(/[^0-9,-]+/g,"").replace(",", ".")) || 0,
                    monthlyInterestRate: parseFloat(row[4]) || 0,
                    annualInterestRate: parseFloat(row[5]) || 0,
                    totalInstallments: parseInt(row[6], 10) || 0,
                    startDate: row[7] || '',
                    endDate: row[8] || '',
                 }));
            };
            
            const valueRanges = response.result.valueRanges;
            setFinancialData(prev => ({ ...prev,
                income: parseFinancialData(valueRanges?.[0]?.values),
                expenses: parseFinancialData(valueRanges?.[1]?.values),
                debts: parseDebtData(valueRanges?.[2]?.values)
            }));
        } catch (error) {
            console.error("Error loading data:", error);
            alert("Não foi possível carregar os dados. Tente fazer login novamente.");
            handleSignOut();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToDrive = async () => {
        if (!analyzedData || !userProfile) return;
        setIsSaving(true);
        setDriveFileLink(null);

        const gapiReady = await initializeGapiClient();
        if (!gapiReady) {
            console.error("GAPI client could not be initialized.");
            setIsSaving(false);
            return;
        }

        let currentSpreadsheetId = spreadsheetId;
        try {
            if (!currentSpreadsheetId) {
                const createResponse = await (window as any).gapi.client.sheets.spreadsheets.create({
                    properties: { title: SPREADSHEET_NAME },
                    sheets: [{ properties: { title: 'Resumo' } }, { properties: { title: 'Rendas' } }, { properties: { title: 'Gastos' } }, { properties: { title: 'Dívidas' } }]
                });
                currentSpreadsheetId = createResponse.result.spreadsheetId;
                setSpreadsheetId(currentSpreadsheetId);
            }

            if (!currentSpreadsheetId) throw new Error("Could not create or find spreadsheet.");

            await (window as any).gapi.client.sheets.spreadsheets.values.batchClear({
                spreadsheetId: currentSpreadsheetId,
                resource: { ranges: ["Resumo!A1:Z", "Rendas!A1:Z", "Gastos!A1:Z", "Dívidas!A1:Z"] }
            });

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

            await (window as any).gapi.client.sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: currentSpreadsheetId,
                resource: { data: dataToWrite, valueInputOption: 'USER_ENTERED' }
            });

            setDriveFileLink(`https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/`);
        } catch (error: any) {
            console.error("Error saving to Google Drive:", error);
            if (error?.result?.error?.code === 401 || error?.result?.error?.code === 403) {
                alert("Sua sessão expirou. Por favor, faça login novamente.");
                handleSignOut();
            }
        } finally {
            setIsSaving(false);
        }
    };

    // --- Render Logic ---
    return (
        <div className="app-container">
            <Header
                user={userProfile}
                onLogin={handleSignIn}
                onLogout={handleSignOut}
                isAuthReady={isAuthReady}
                isAuthLoading={isAuthLoading}
            />
            <main role="main" className="main-layout">
                <div className="main-content">
                    {isLoading ? <Loader text={loadingText} /> : (
                        view === 'form'
                            ? <FinancialForm
                                data={financialData}
                                setData={setFinancialData}
                                onAnalyze={handleAnalyze}
                                onLoadFromDrive={handleLoadFromDrive}
                                isLoadAvailable={!!spreadsheetId && !!userProfile}
                                isFindingFile={isFindingFile}
                              />
                            : <AiDiagnosis aiResponse={aiResponse} />
                    )}
                </div>
                <aside className="sidebar">
                    {view === 'form' ? (
                        <FormSummary data={financialData} />
                    ) : (
                        analyzedData && <DashboardSummary
                                            data={analyzedData}
                                            onEdit={handleEdit}
                                            isLoggedIn={!!userProfile}
                                            onSave={handleSaveToDrive}
                                            isSaving={isSaving}
                                            driveFileLink={driveFileLink}
                                        />
                    )}
                </aside>
            </main>
        </div>
    );
};

export default App;