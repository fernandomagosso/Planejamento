// Fix: Implementing Gemini service based on provided guidelines.
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialData, AnalysisResult } from "../types";

// As per guidelines, initialize with a named apiKey parameter from process.env.API_KEY.
// The API key is assumed to be pre-configured and accessible.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const generatePrompt = (data: FinancialData): string => {
  return `
    Analyze the following financial data for an individual and provide personalized advice.
    - Monthly Income: $${data.income}
    - Monthly Expenses: $${data.expenses}
    - Total Investments: $${data.investments}
    - Total Debt: $${data.debt}
    - Savings Goal: $${data.savingsGoal}

    Based on this data, provide:
    1. A brief summary of their current financial health.
    2. A list of actionable suggestions to improve their financial situation and reach their savings goal.
    
    Return a JSON object.
  `;
};

export const getFinancialAnalysis = async (data: FinancialData): Promise<AnalysisResult> => {
  try {
    const prompt = generatePrompt(data);
    
    // As per guidelines, use ai.models.generateContent to query GenAI.
    const response = await ai.models.generateContent({
      // As per guidelines, use 'gemini-2.5-flash' for general text tasks.
      model: "gemini-2.5-flash",
      contents: prompt,
      // As per guidelines, configure response for JSON output.
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A brief summary of the user's financial health."
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "A list of actionable financial suggestions."
            }
          }
        }
      }
    });

    // As per guidelines, access the generated text content via the .text property.
    const jsonString = response.text;
    const result: AnalysisResult = JSON.parse(jsonString);
    
    return result;
  } catch (error) {
    console.error("Error getting financial analysis from Gemini API:", error);
    // Implement robust error handling.
    if (error instanceof Error) {
        throw new Error(`Failed to get financial analysis: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching financial analysis.");
  }
};
