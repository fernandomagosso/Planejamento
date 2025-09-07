// Fix: Populating empty types file with necessary interfaces.
export interface FinancialData {
  income: number;
  expenses: number;
  investments: number;
  debt: number;
  savingsGoal: number;
}

export interface AnalysisResult {
  summary: string;
  suggestions: string[];
}

export interface UserProfile {
    name: string;
    email: string;
    picture: string;
}
