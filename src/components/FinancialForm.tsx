import React, { useState } from 'react';
import type { FinancialData, FinancialDataItem, DebtItem, IncomeForecast } from '../types';

export const FinancialForm: React.FC<{
  data: FinancialData;
  setData: React.Dispatch<React.SetStateAction<FinancialData>>;
  onAnalyze: () => void;
  onLoadFromDrive: () => void;
  isLoadAvailable: boolean;
  isFindingFile: boolean;
}> = ({ data, setData, onAnalyze, onLoadFromDrive, isLoadAvailable, isFindingFile }) => {
  const [activeTab, setActiveTab] = useState<'income' | 'expenses' | 'debts' | 'forecast'>('income');

  const handleItemChange = (category: 'income' | 'expenses' | 'debts', id: number, field: keyof FinancialDataItem | keyof DebtItem, value: string | number) => {
    const finalValue = typeof value === 'string' && field !== 'description' && field !== 'startDate' && field !== 'endDate' ? parseFloat(value) || 0 : value;

    setData(prevData => ({
      ...prevData,
      [category]: prevData[category].map(item =>
        item.id === id ? { ...item, [field]: finalValue } : item
      ) as any,
    }));
  };
  
  const handleForecastChange = (field: keyof IncomeForecast, value: string) => {
    const finalValue = parseFloat(value) || 0;
    setData(prevData => ({
      ...prevData,
      incomeForecast: {
        ...prevData.incomeForecast,
        [field]: finalValue,
      },
    }));
  };

  const handleAddItem = (category: 'income' | 'expenses' | 'debts') => {
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

  const handleRemoveItem = (category: 'income' | 'expenses' | 'debts', id: number) => {
    if (data[category].length <= 1) return;
    setData(prevData => ({ ...prevData, [category]: prevData[category].filter(item => item.id !== id) }));
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onAnalyze(); };

  const renderCategory = (category: 'income' | 'expenses', title: string) => (
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
    const category = 'debts';
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

  const renderForecastCategory = () => (
    <article className="form-subcategory-card">
      <h3>Projeção de Renda Futura</h3>
      <p className="subcategory-description">Estime o crescimento da sua renda para receber conselhos sobre como alocar seus futuros ganhos.</p>
      <div className="forecast-grid">
        <div className="form-group">
          <label htmlFor="forecast-growth">Taxa de Crescimento Anual da Renda (%)</label>
          <input id="forecast-growth" type="number" placeholder="Ex: 5" value={data.incomeForecast.growthRate || ''} onChange={e => handleForecastChange('growthRate', e.target.value)} min="0" />
        </div>
        <div className="form-group">
          <label htmlFor="forecast-months">Meses para Projetar</label>
          <input id="forecast-months" type="number" placeholder="Ex: 12" value={data.incomeForecast.monthsToForecast || ''} onChange={e => handleForecastChange('monthsToForecast', e.target.value)} min="1" step="1" />
        </div>
      </div>
    </article>
  );
  
  const TABS = [ { key: 'income', label: 'Rendas'}, { key: 'expenses', label: 'Gastos Essenciais'}, { key: 'debts', label: 'Dívidas Ativas'}, { key: 'forecast', label: 'Projeção Futura'} ];

  return (
    <div className="card form-card">
      <h2>Vamos começar!</h2>
      <p>Preencha os campos abaixo com seus valores mensais para que nossa IA possa te ajudar.</p>
      
      {(isFindingFile || isLoadAvailable) && (
        <div className="drive-actions-container">
            {isFindingFile ? (
                <p className="drive-status-text">Buscando dados no Google Drive...</p>
            ) : isLoadAvailable && (
                <button type="button" onClick={onLoadFromDrive} className="btn-secondary btn-load-drive">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Carregar dados salvos do Drive
                </button>
            )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-tabs" role="tablist">
            {TABS.map(tab => ( <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key} className={`tab-button ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key as any)}>{tab.label}</button>))}
        </div>
        <div className="form-tab-content" data-active-tab={activeTab}>
            {activeTab === 'income' && renderCategory('income', 'Suas Rendas Mensais')}
            {activeTab === 'expenses' && renderCategory('expenses', 'Seus Gastos Essenciais')}
            {activeTab === 'debts' && renderDebtsCategory()}
            {activeTab === 'forecast' && renderForecastCategory()}
        </div>
        <button type="submit" className="btn">Analisar Minha Saúde Financeira</button>
      </form>
    </div>
  );
};