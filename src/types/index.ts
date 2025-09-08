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

// Add types for search grounding results
export interface GroundingChunk {
    // FIX: Made the `web` property optional to align with the Gemini SDK's type definition.
    // This resolves the type assignment error in geminiService.
    web?: {
        // Fix: Made uri and title optional to match the SDK type from @google/genai.
        uri?: string;
        title?: string;
    };
}

export interface InsightResult {
    text: string;
    sources: GroundingChunk[];
}