export interface UserProfile {
    name: string;
    email: string;
    picture: string;
}
export interface FinancialDataItem {
  id: number;
  description: string;
  amount: number;
}
export interface DebtItem {
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
export interface IncomeForecast {
  growthRate: number; // annual percentage
  monthsToForecast: number;
}
export interface FinancialData {
  income: FinancialDataItem[];
  expenses: FinancialDataItem[];
  debts: DebtItem[];
  incomeForecast: IncomeForecast;
}
