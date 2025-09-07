import React, { useMemo } from 'react';
import { marked } from 'marked';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import type { FinancialData } from '../types';
import { formatCurrency } from '../utils/formatters';

export const AiDiagnosis: React.FC<{ aiResponse: string; }> = ({ aiResponse }) => {
    const parsedAiResponse = useMemo(() => ({ __html: marked.parse(aiResponse) as string }), [aiResponse]);
    return (
        <div className="card dashboard-card">
            <h3>Diagnóstico da IA</h3>
            <div className="ai-response" dangerouslySetInnerHTML={parsedAiResponse}></div>
        </div>
    );
};

export const IncomeForecastChart: React.FC<{ data: FinancialData }> = ({ data }) => {
    const { incomeForecast, income } = data;
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const monthlyGrowthRate = Math.pow(1 + incomeForecast.growthRate / 100, 1 / 12) - 1;

    const forecastData = useMemo(() => {
        if (incomeForecast.monthsToForecast <= 0 || totalIncome <= 0 || incomeForecast.growthRate <= 0) {
            return [];
        }

        return Array.from({ length: incomeForecast.monthsToForecast + 1 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() + i);
            const monthName = date.toLocaleString('pt-BR', { month: 'short' });
            const projectedIncome = totalIncome * Math.pow(1 + monthlyGrowthRate, i);

            return {
                month: `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}`,
                "Renda Projetada": projectedIncome,
            };
        });
    }, [totalIncome, incomeForecast, monthlyGrowthRate]);

    if (forecastData.length === 0) return null;

    return (
        <div className="card">
            <h3>Projeção de Renda</h3>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={forecastData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(tick) => `${(tick / 1000)}k`} />
                        <Tooltip
                            formatter={(value: number) => [formatCurrency(value), "Renda Projetada"]}
                            cursor={{ stroke: 'var(--primary-color)', strokeDasharray: '3 3' }}
                            contentStyle={{ backgroundColor: 'var(--card-background)', borderRadius: '8px', borderColor: 'var(--border-color)' }}
                        />
                        <Line type="monotone" dataKey="Renda Projetada" stroke="var(--primary-color)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


export const DashboardSummary: React.FC<{ data: FinancialData; onEdit: () => void; isLoggedIn: boolean; onSave: () => void; isSaving: boolean; driveFileLink: string | null; }> = ({ data, onEdit, isLoggedIn, onSave, isSaving, driveFileLink }) => {
    const { totalIncome, totalExpenses, paymentCapacity } = useMemo(() => {
        const income = data.income.reduce((sum, item) => sum + item.amount, 0);
        const essentialExpenses = data.expenses.reduce((sum, item) => sum + item.amount, 0);
        const debtPayments = data.debts.reduce((sum, item) => sum + item.amount, 0);
        const totalExp = essentialExpenses + debtPayments;
        return { totalIncome: income, totalExpenses: totalExp, paymentCapacity: income - totalExp };
    }, [data]);

    const chartData = useMemo(() => [ { name: 'Rendas', value: totalIncome }, { name: 'Despesas', value: totalExpenses } ], [totalIncome, totalExpenses]);

    return (
        <>
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
            <IncomeForecastChart data={data} />
        </>
    );
};

export const FormSummary: React.FC<{ data: FinancialData }> = ({ data }) => {
    const totalIncome = data.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalDebts = data.debts.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="card"><h3>Resumo em Tempo Real</h3><div className="summary-grid-sidebar"><div className="summary-item"><p>Total de Rendas</p><span className="amount positive">{formatCurrency(totalIncome)}</span></div><div className="summary-item"><p>Gastos Essenciais</p><span className="amount negative">{formatCurrency(totalExpenses)}</span></div><div className="summary-item"><p>Dívidas Ativas</p><span className="amount negative">{formatCurrency(totalDebts)}</span></div></div></div>
    );
};
