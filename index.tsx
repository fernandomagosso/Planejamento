import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- TYPES ---
interface UserProfile {
    name: string;
    email: string;
    picture: string;
}
interface FinancialDataItem {
  id: number;
  description: string;
  amount: number;
}
interface DebtItem {
  id: number;
  description: string;
  amount: number; // Valor da Parcela
  loanAmount: number; // Valor do Empréstimo
  outstandingBalance: number; // Saldo Devedor
  totalInstallments: number;
  monthlyInterestRate: number;
  annualInterestRate: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}
interface FinancialData {
  income: FinancialDataItem[];
  expenses: FinancialDataItem[];
  debts: DebtItem[];
}

// --- UTILITIES ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// --- GEMINI SERVICE ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analyzeFinancials = async (data: FinancialData): Promise<string> => {
  const formatItems = (items: FinancialDataItem[]) => items
    .filter(item => item.amount > 0)
    .map(item => `- ${item.description || '(Não especificado)'}: ${formatCurrency(item.amount)}`)
    .join('\n');

  const formatDebtItems = (items: DebtItem[]) => items
    .filter(item => item.loanAmount > 0)
    .map(item => `
- **${item.description || '(Não especificado)'}**
  - Valor do Empréstimo: ${formatCurrency(item.loanAmount)}
  - Saldo Devedor: ${formatCurrency(item.outstandingBalance)}
  - Valor da Parcela: ${formatCurrency(item.amount)}
  - Juros (CET): ${item.monthlyInterestRate}% a.m. | ${item.annualInterestRate}% a.a.
  - Duração: De ${item.startDate || 'N/A'} até ${item.endDate || 'N/A'}
  - Total de Parcelas: ${item.totalInstallments}
`).join('');


  const totalIncome = data.income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = data.expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalDebts = data.debts.reduce((sum, item) => sum + item.amount, 0);

  const prompt = `
    Analise a situação financeira com base nos seguintes dados mensais em BRL:

    ### Rendas
    ${formatItems(data.income)}
    - **Total de Rendas:** ${formatCurrency(totalIncome)}

    ### Gastos Essenciais
    ${formatItems(data.expenses)}
    - **Total de Gastos Essenciais:** ${formatCurrency(totalExpenses)}

    ### Dívidas
    ${formatDebtItems(data.debts)}
    - **Total de Pagamentos Mensais com Dívidas:** ${formatCurrency(totalDebts)}

    Meu objetivo é equilibrar minhas contas e construir um futuro financeiro estável.
    Forneça um diagnóstico claro, amigável e encorajador. Use markdown para formatar sua resposta.
    Estruture sua resposta em três seções obrigatórias usando ### como título:
    ### Panorama Geral
    ### Pontos de Atenção
    ### Recomendações Práticas

    Na seção "Recomendações Práticas", seja muito específico e forneça estratégias de economia acionáveis e personalizadas com base nos dados fornecidos. Por exemplo, sugira a revisão de categorias de despesas específicas e proponha metas percentuais de redução, se aplicável. Para as dívidas, sugira estratégias de quitação como o método "bola de neve" ou "avalanche" com base nos juros e saldos informados.
  `;
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: "Você é 'FinanZen', um assistente financeiro virtual amigável e especialista em finanças pessoais. Seu objetivo é ajudar os usuários a entenderem sua situação financeira e fornecer conselhos práticos, claros e encorajadores para que alcancem a saúde financeira. Use uma linguagem simples e evite jargões complexos. Sempre formate os títulos das seções com '###'.",
            temperature: 0.7,
        },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Desculpe, não consegui processar suas informações no momento. Por favor, tente novamente mais tarde.";
  }
};


// --- COMPONENTS ---
const Header: React.FC<{ user: UserProfile | null; onLogin: () => void; onLogout: () => void; isAuthReady: boolean; }> = ({ user, onLogin, onLogout, isAuthReady }) => (
    <header className="header" role="banner">
        <div className="header-content">
            <svg className="logo" width="48" height="48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="FinanZen Logo">
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary-color)" />
                        <stop offset="100%" stopColor="var(--secondary-color)" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGradient)" strokeWidth="8"/>
                <path d="M50 75 C 60 65, 65 50, 50 35 C 35 50, 40 65, 50 75 Z" fill="url(#logoGradient)"/>
                <path d="M50 45 C 55 40, 60 30, 50 20 C 40 30, 45 40, 50 45 Z" fill="url(#logoGradient)"/>
            </svg>
            <div className="header-text">
                <h1>Finan<span>Zen</span></h1>
                <p>Seu assessor financeiro pessoal com o poder da Inteligência Artificial.</p>
            </div>
        </div>
        <div className="auth-controls">
            {user ? (
                <div className="user-profile">
                    <img src={user.picture} alt={`Foto de perfil de ${user.name}`} />
                    <span>{user.name}</span>
                    <button onClick={onLogout} className="btn-secondary">Sair</button>
                </div>
            ) : (
                <button onClick={onLogin} className="btn-google" disabled={!isAuthReady}>
                    <svg viewBox="0 0 18 18" width="18" height="18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9.18v3.48h4.74c-.2 1.13-.83 2.08-1.78 2.72v2.26h2.9c1.7-1.56 2.67-3.87 2.67-6.62z"></path><path fill="#34A853" d="M9.18 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.35-1.58-5.06-3.71H1.1v2.33C2.5 16.23 5.59 18 9.18 18z"></path><path fill="#FBBC05" d="M4.12 10.71c-.13-.4-.2-.83-.2-1.28s.07-.88.2-1.28V5.82H1.1C.46 7.1.1 8.53.1 10c0 1.47.36 2.9.98 4.18l3.03-2.33z"></path><path fill="#EA4335" d="M9.18 3.54c1.32 0 2.52.45 3.46 1.35l2.58-2.58C13.65.8 11.61 0 9.18 0 5.59 0 2.5 2.23 1.1 5.34l3.02 2.33c.7-2.13 2.7-3.71 5.06-3.71z"></path></svg>
                    <span>{isAuthReady ? 'Login com Google' : 'Carregando...'}</span>
                </button>
            )}
        </div>
    </header>
);

const Loader: React.FC<{text: string}> = ({text}) => (
  <div className="loader-container" aria-live="polite">
    <div className="loader"></div>
    <p>{text}</p>
  </div>
);

const FinancialForm: React.FC<{
  data: FinancialData;
  setData: React.Dispatch<React.SetStateAction<FinancialData>>;
  onAnalyze: () => void;
}> = ({ data, setData, onAnalyze }) => {
  const [activeTab, setActiveTab] = useState<'income' | 'expenses' | 'debts'>('income');

  const handleItemChange = (category: keyof FinancialData, id: number, field: keyof FinancialDataItem | keyof DebtItem, value: string | number) => {
    const finalValue = typeof value === 'string' && field !== 'description' && field !== 'startDate' && field !== 'endDate' ? parseFloat(value) || 0 : value;

    setData(prevData => ({
      ...prevData,
      [category]: prevData[category].map(item =>
        item.id === id ? { ...item, [field]: finalValue } : item
      ) as any,
    }));
  };

  const handleAddItem = (category: keyof FinancialData) => {
    if (category === 'debts') {
      const newItem: DebtItem = {
        id: Date.now(), description: '', amount: 0, loanAmount: 0,
        outstandingBalance: 0, totalInstallments: 0, monthlyInterestRate: 0,
        annualInterestRate: 0, startDate: '', endDate: '',
      };
       setData(prevData => ({ ...prevData, debts: [...prevData.debts, newItem] }));
    } else {
        const newItem: FinancialDataItem = { id: Date.now(), description: '', amount: 0 };
        setData(prevData => ({ ...prevData, [category]: [...prevData[category], newItem] }));
    }
  };

  const handleRemoveItem = (category: keyof FinancialData, id: number) => {
    if (data[category].length <= 1) return;
    setData(prevData => ({ ...prevData, [category]: prevData[category].filter(item => item.id !== id) }));
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onAnalyze(); };

  const renderCategory = (category: keyof FinancialData, title: string) => (
      <article className="form-subcategory-card">
        <h3>{title}</h3>
        <div className="category-items-list">
          <div className="category-item-row header-row">
            <span>Descrição</span>
            <span style={{textAlign: 'right'}}>Valor (R$)</span>
          </div>
          {data[category].map((item, index) => (
            <div key={item.id} className="category-item-row">
              <input type="text" placeholder="Ex: Salário" value={item.description} onChange={e => handleItemChange(category, item.id, 'description', e.target.value)} aria-label={`Descrição para ${title} item ${index + 1}`} />
              <input type="number" placeholder="R$ 100,00" value={item.amount || ''} min="0" step="0.01" onChange={e => handleItemChange(category, item.id, 'amount', e.target.value)} aria-label={`Valor para ${title} item ${index + 1}`} />
              <button type="button" className="btn-remove-item" onClick={() => handleRemoveItem(category, item.id)} disabled={data[category].length <= 1} aria-label={`Remover ${title} item ${index + 1}`} >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              </button>
            </div>
          ))}
        </div>
        <div className="category-controls">
            <button type="button" className="btn-add-item" onClick={() => handleAddItem(category)}>+ Adicionar Item</button>
        </div>
      </article>
    );

  const renderDebtsCategory = () => {
    const category: keyof FinancialData = 'debts';
    return (
      <article className="form-subcategory-card">
        <h3>Suas Dívidas Ativas</h3>
        <p className="subcategory-description">Detalhe suas dívidas para uma análise mais precisa.</p>
        <div className="category-items-list">
          {data.debts.map((item) => (
              <div key={item.id} className="debt-item-card">
                <button type="button" className="btn-remove-item" onClick={() => handleRemoveItem(category, item.id)} disabled={data[category].length <= 1} aria-label={`Remover dívida ${item.description}`} >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                </button>
                <div className="debt-item-grid">
                  <div className="form-group description-group"><label htmlFor={`debt-desc-${item.id}`}>Descrição da Dívida</label><input id={`debt-desc-${item.id}`} type="text" placeholder="Ex: Financiamento do Carro" value={item.description} onChange={e => handleItemChange(category, item.id, 'description', e.target.value)} /></div>
                  <div className="form-group"><label htmlFor={`debt-loan-${item.id}`}>Valor do Empréstimo (R$)</label><input id={`debt-loan-${item.id}`} type="number" placeholder="20.000,00" value={item.loanAmount || ''} onChange={e => handleItemChange(category, item.id, 'loanAmount', e.target.value)} /></div>
                  <div className="form-group"><label htmlFor={`debt-balance-${item.id}`}>Saldo Devedor (R$)</label><input id={`debt-balance-${item.id}`} type="number" placeholder="15.000,00" value={item.outstandingBalance || ''} onChange={e => handleItemChange(category, item.id, 'outstandingBalance', e.target.value)} /></div>
                  <div className="form-group"><label htmlFor={`debt-payment-${item.id}`}>Valor da Parcela (R$)</label><input id={`debt-payment-${item.id}`} type="number" placeholder="300,00" value={item.amount || ''} onChange={e => handleItemChange(category, item.id, 'amount', e.target.value)} /></div>
                  <div className="form-group"><label htmlFor={`debt-monthly-cet-${item.id}`}>CET a.m. (%)</label><input id={`debt-monthly-cet-${item.id}`} type="number" placeholder="1.5" value={item.monthlyInterestRate || ''} onChange={e => handleItemChange(category, item.id, 'monthlyInterestRate', e.target.value)} /></div>
                  <div className="form-group"><label htmlFor={`debt-annual-cet-${item.id}`}>CET a.a. (%)</label><input id={`debt-annual-cet-${item.id}`} type="number" placeholder="19.56" value={item.annualInterestRate || ''} onChange={e => handleItemChange(category, item.id, 'annualInterestRate', e.target.value)} /></div>
                  <div className="form-group"><label htmlFor={`debt-total-inst-${item.id}`}>Total de Parcelas</label><input id={`debt-total-inst-${item.id}`} type="number" placeholder="48" value={item.totalInstallments || ''} onChange={e => handleItemChange(category, item.id, 'totalInstallments', e.target.value)} /></div>
                  <div className="form-group"><label htmlFor={`debt-start-date-${item.id}`}>Data de Início</label><input id={`debt-start-date-${item.id}`} type="date" value={item.startDate} onChange={e => handleItemChange(category, item.id, 'startDate', e.target.value)} /></div>
                  <div className="form-group"><label htmlFor={`debt-end-date-${item.id}`}>Data Final</label><input id={`debt-end-date-${item.id}`} type="date" value={item.endDate} onChange={e => handleItemChange(category, item.id, 'endDate', e.target.value)} /></div>
                </div>
              </div>
          ))}
        </div>
        <div className="category-controls"><button type="button" className="btn-add-item" onClick={() => handleAddItem(category)}>+ Adicionar Dívida</button></div>
      </article>
    );
  };
  
  const TABS = [ { key: 'income', label: 'Rendas'}, { key: 'expenses', label: 'Gastos Essenciais'}, { key: 'debts', label: 'Dívidas Ativas'} ];

  return (
    <div className="card form-card">
      <h2>Vamos começar!</h2>
      <p>Preencha os campos abaixo com seus valores mensais para que nossa IA possa te ajudar.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-tabs" role="tablist">
            {TABS.map(tab => ( <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key} className={`tab-button ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key as any)}>{tab.label}</button>))}
        </div>
        <div className="form-tab-content" data-active-tab={activeTab}>
            {activeTab === 'income' && renderCategory('income', 'Suas Rendas Mensais')}
            {activeTab === 'expenses' && renderCategory('expenses', 'Seus Gastos Essenciais')}
            {activeTab === 'debts' && renderDebtsCategory()}
        </div>
        <button type="submit" className="btn">Analisar Minha Saúde Financeira</button>
      </form>
    </div>
  );
};

const AiDiagnosis: React.FC<{ aiResponse: string; }> = ({ aiResponse }) => {
    const parsedAiResponse = useMemo(() => ({ __html: marked.parse(aiResponse) as string }), [aiResponse]);
    return (
        <div className="card dashboard-card">
            <h3>Diagnóstico da IA</h3>
            <div className="ai-response" dangerouslySetInnerHTML={parsedAiResponse}></div>
        </div>
    );
};

const DashboardSummary: React.FC<{ data: FinancialData; onEdit: () => void; isLoggedIn: boolean; onSave: () => void; isSaving: boolean; driveFileLink: string | null; }> = ({ data, onEdit, isLoggedIn, onSave, isSaving, driveFileLink }) => {
    const { totalIncome, totalExpenses, paymentCapacity } = useMemo(() => {
        const income = data.income.reduce((sum, item) => sum + item.amount, 0);
        const essentialExpenses = data.expenses.reduce((sum, item) => sum + item.amount, 0);
        const debtPayments = data.debts.reduce((sum, item) => sum + item.amount, 0);
        const totalExp = essentialExpenses + debtPayments;
        return { totalIncome: income, totalExpenses: totalExp, paymentCapacity: income - totalExp };
    }, [data]);

    const chartData = useMemo(() => [ { name: 'Rendas', value: totalIncome }, { name: 'Despesas', value: totalExpenses } ], [totalIncome, totalExpenses]);

    return (
        <div className="card">
            <h3>Resumo Mensal</h3>
            <div className="chart-container"><ResponsiveContainer width="100%" height={250}><BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}><XAxis dataKey="name" /><YAxis tickFormatter={(tick) => `${(tick / 1000)}k`} /><Tooltip formatter={(value: number) => [formatCurrency(value), null]} cursor={{ fill: 'rgba(206, 206, 206, 0.1)' }} contentStyle={{ backgroundColor: 'var(--card-background)', borderRadius: '8px', borderColor: 'var(--border-color)' }} /><Bar dataKey="value" barSize={80} radius={[4, 4, 0, 0]}><Cell fill={'var(--accent-positive)'} /><Cell fill={'var(--accent-negative)'} /></Bar></BarChart></ResponsiveContainer></div>
            <div className="summary-grid-sidebar"><div className="summary-item"><p>Total de Rendas</p><span className="amount positive">{formatCurrency(totalIncome)}</span></div><div className="summary-item"><p>Total de Despesas</p><span className="amount negative">{formatCurrency(totalExpenses)}</span></div><div className="summary-item"><p>Capacidade de Pagamento</p><span className={`amount ${paymentCapacity >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(paymentCapacity)}</span></div></div>
            <div className="dashboard-actions">
                <button onClick={onEdit} className="btn btn-secondary">Editar Informações</button>
                <button onClick={onSave} className="btn-google" disabled={!isLoggedIn || isSaving}>
                    <svg viewBox="0 0 18 18" width="18" height="18"><g fill="none" fillRule="evenodd"><path d="M12.832 3.168H5.168A2.168 2.168 0 0 0 3 5.336v7.328A2.168 2.168 0 0 0 5.168 14.832h7.664A2.168 2.168 0 0 0 15 12.664V5.336A2.168 2.168 0 0 0 12.832 3.168z" fill="#00A85D"></path><path d="M11.248 3.168L6.752 7.664H15v-.992A3.344 3.344 0 0 0 11.248 3.168z" fill="#008347"></path><path d="M3 8.336l4.496-4.496v8.992L3 8.336z" fill="#006737"></path><path d="M15 8.336L7.5 15.832h3.748A3.344 3.344 0 0 0 15 12.08V8.336z" fill="#00C473"></path></g></svg>
                    {isSaving ? 'Salvando...' : 'Salvar no Google Drive'}
                </button>
            </div>
            {driveFileLink && <div className="save-drive-status">Análise salva! <a href={driveFileLink} target="_blank" rel="noopener noreferrer">Ver planilha</a></div>}
        </div>
    );
};

const FormSummary: React.FC<{ data: FinancialData }> = ({ data }) => {
    const totalIncome = data.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalDebts = data.debts.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="card"><h3>Resumo em Tempo Real</h3><div className="summary-grid-sidebar"><div className="summary-item"><p>Total de Rendas</p><span className="amount positive">{formatCurrency(totalIncome)}</span></div><div className="summary-item"><p>Gastos Essenciais</p><span className="amount negative">{formatCurrency(totalExpenses)}</span></div><div className="summary-item"><p>Dívidas Ativas</p><span className="amount negative">{formatCurrency(totalDebts)}</span></div></div></div>
    );
};

// --- MAIN APP ---
const App: React.FC = () => {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const SHEETS_API_KEY = process.env.API_KEY; // Using the same key for Sheets API
    const SCOPES = 'https://www.googleapis.com/auth/drive.file';
    
    // App State
    const [view, setView] = useState<'form' | 'dashboard'>('form');
    const [financialData, setFinancialData] = useState<FinancialData>({
        income: [{ id: Date.now(), description: 'Salário Líquido', amount: 0 }],
        expenses: [{ id: Date.now() + 1, description: 'Aluguel', amount: 0 }],
        debts: [{ id: Date.now() + 2, description: 'Cartão de Crédito', amount: 0, loanAmount: 0, outstandingBalance: 0, totalInstallments: 0, monthlyInterestRate: 0, annualInterestRate: 0, startDate: '', endDate: '' }],
    });
    const [analyzedData, setAnalyzedData] = useState<FinancialData | null>(null);
    const [aiResponse, setAiResponse] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Google Auth State
    const [gapiReady, setGapiReady] = useState(false);
    const [gisReady, setGisReady] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [driveFileLink, setDriveFileLink] = useState<string|null>(null);

    useEffect(() => {
        (window as any).onGapiLoad = () => {
            (window as any).gapi.load('client', () => setGapiReady(true));
        };
        (window as any).onGisLoad = () => setGisReady(true);
        if (document.getElementById('gapi-script')) return;

        const gapiScript = document.createElement('script');
        gapiScript.id = 'gapi-script';
        gapiScript.src = 'https://apis.google.com/js/api.js?onload=onGapiLoad';
        gapiScript.async = true;
        gapiScript.defer = true;
        document.body.appendChild(gapiScript);

        const gisScript = document.createElement('script');
        gisScript.id = 'gis-script';
        gisScript.src = 'https://accounts.google.com/gsi/client?onload=onGisLoad';
        gisScript.async = true;
        gisScript.defer = true;
        document.body.appendChild(gisScript);
    }, []);

     useEffect(() => {
        if (gapiReady) {
            (window as any).gapi.client.init({ apiKey: SHEETS_API_KEY })
                .then(() => (window as any).gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4'));
        }
        if (gisReady && GOOGLE_CLIENT_ID) {
            const client = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: SCOPES,
                callback: (tokenResponse: any) => {
                    if (tokenResponse.error) {
                        console.error("Google Auth Error:", tokenResponse.error, tokenResponse.error_description);
                        alert(`Erro de autenticação: ${tokenResponse.error_description || 'Por favor, tente novamente.'}`);
                        return;
                    }
                    if (tokenResponse && tokenResponse.access_token) {
                       fetchUserProfile(tokenResponse.access_token);
                    }
                },
            });
            setTokenClient(client);
            setIsAuthReady(true);
        }
    }, [gapiReady, gisReady, GOOGLE_CLIENT_ID, SHEETS_API_KEY]);
    
    const fetchUserProfile = useCallback(async (accessToken: string) => {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
            const profile = await response.json();
            setUserProfile({ name: profile.name, email: profile.email, picture: profile.picture });
        }
    }, []);

    const handleSignIn = () => tokenClient?.requestAccessToken({ prompt: 'consent' });
    const handleSignOut = () => {
        const token = (window as any).gapi?.client?.getToken();
        if (token) {
            (window as any).google.accounts.oauth2.revoke(token.access_token, () => {});
        }
        (window as any).gapi?.client?.setToken(null);
        setUserProfile(null);
    };

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
        try {
            const date = new Date().toLocaleDateString('pt-BR');
            const spreadsheetBody = { properties: { title: `Análise FinanZen - ${date}` } };
            const createResponse = await (window as any).gapi.client.sheets.spreadsheets.create({}, spreadsheetBody);
            const spreadsheetId = createResponse.result.spreadsheetId;
            setDriveFileLink(createResponse.result.spreadsheetUrl);
            
            const incomeData = [["Descrição", "Valor (R$)"], ...analyzedData.income.map(i => [i.description, i.amount])];
            const expensesData = [["Descrição", "Valor (R$)"], ...analyzedData.expenses.map(e => [e.description, e.amount])];
            const debtsData = [
                ["Descrição", "Valor do Empréstimo", "Saldo Devedor", "Valor da Parcela", "CET a.m. (%)", "CET a.a. (%)", "Total de Parcelas", "Data de Início", "Data Final"],
                ...analyzedData.debts.map(d => [d.description, d.loanAmount, d.outstandingBalance, d.amount, d.monthlyInterestRate, d.annualInterestRate, d.totalInstallments, d.startDate, d.endDate])
            ];
            
            const data = [
                { range: "Resumo!A1", values: [[aiResponse.replace(/###\s/g, '')]] },
                { range: "Rendas!A1", values: incomeData },
                { range: "Gastos!A1", values: expensesData },
                { range: "Dívidas!A1", values: debtsData },
            ];

            const batchUpdateRequest = { spreadsheetId, resource: { data, valueInputOption: 'USER_ENTERED' } };
            await (window as any).gapi.client.sheets.spreadsheets.values.batchUpdate(batchUpdateRequest);

        } catch (error) {
            console.error("Error saving to Google Drive:", error);
            alert("Não foi possível salvar na planilha. Tente fazer login novamente.");
        } finally {
            setIsSaving(false);
        }
    };

  return (
    <div className="app-container">
      <Header user={userProfile} onLogin={handleSignIn} onLogout={handleSignOut} isAuthReady={isAuthReady} />
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

// --- RENDER ---
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}