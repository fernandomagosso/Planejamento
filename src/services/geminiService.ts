import { GoogleGenAI } from '@google/genai';
import type { FinancialData, FinancialDataItem, DebtItem } from '../types';
import { formatCurrency } from '../utils/formatters';

export const analyzeFinancials = async (data: FinancialData, apiKey: string): Promise<string> => {
  // AI analysis is temporarily disabled to test Google Login and Drive integration.
  console.log("AI analysis is temporarily disabled for testing purposes.");
  
  const mockResponse = `
  ### Panorama Geral
  A análise de IA está temporariamente desabilitada para testes. Esta é uma resposta simulada para que a funcionalidade de login e salvamento no Google Drive possa ser verificada.

  ### Pontos de Atenção
  - Verifique se o login com o Google funciona corretamente.
  - Tente salvar estes dados de teste na planilha do Google Drive.

  ### Recomendações Práticas
  - Se o login e o salvamento funcionarem, a integração com o Google está correta. O próximo passo será reativar a conexão com a IA.
  `;
  
  return Promise.resolve(mockResponse);

  /* --- Original implementation below ---
  if (!apiKey) {
    return "### Erro na Análise\n\nA chave da API do Google GenAI não foi fornecida.";
  }

  const ai = new GoogleGenAI({ apiKey });

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

  const forecastPromptSection = data.incomeForecast.growthRate > 0 && data.incomeForecast.monthsToForecast > 0
    ? `
    ### Projeção de Renda Futura
    - Aumento anual de renda projetado: ${data.incomeForecast.growthRate}%
    - Período da projeção: ${data.incomeForecast.monthsToForecast} meses

    Com base nessa projeção, analise o impacto do aumento de renda na capacidade de pagamento, quitação de dívidas e potencial de investimento.
    `
    : '';

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

    ${forecastPromptSection}

    Meu objetivo é equilibrar minhas contas e construir um futuro financeiro estável.
    Forneça um diagnóstico claro, amigável e encorajador. Use markdown para formatar sua resposta.
    Estruture sua resposta em três seções obrigatórias usando ### como título:
    ### Panorama Geral
    ### Pontos de Atenção
    ### Recomendações Práticas

    Na seção "Recomendações Práticas", seja muito específico e forneça estratégias de economia acionáveis e personalizadas com base nos dados fornecidos. Por exemplo, sugira a revisão de categorias de despesas específicas e proponha metas percentuais de redução, se aplicável. Para as dívidas, sugira estratégias de quitação como o método "bola de neve" ou "avalanche" com base nos juros e saldos informados. Se uma projeção de renda foi fornecida, incorpore-a nas recomendações, sugerindo como alocar o futuro aumento de renda.
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

    const text = response.text;
    if (text) {
        return text;
    }

    // If text is empty, it might be due to a block or other reason
    const blockReason = response?.promptFeedback?.blockReason || 'desconhecido';
    const blockMessage = response?.promptFeedback?.blockReasonMessage ? `(${response.promptFeedback.blockReasonMessage})` : '';
    console.error(`Gemini API returned an empty or blocked response. Reason: ${blockReason} ${blockMessage}`);

    // FIX: Cast blockReason to a string to fix a TypeScript type comparison error.
    // The Gemini API returns a string-based enum for the block reason, and casting it
    // ensures the comparison with the string literal is valid.
    if (blockReason !== 'desconhecido' && String(blockReason) !== 'BLOCK_REASON_UNSPECIFIED') {
        return `### Erro na Análise\n\nDesculpe, a IA não conseguiu gerar uma resposta. A solicitação foi bloqueada.\n\n**Motivo:** ${blockReason} ${blockMessage}\n\nPor favor, revise os dados inseridos e tente novamente.`;
    }

    return `### Erro na Análise\n\nDesculpe, a IA retornou uma resposta vazia. Isso pode acontecer por diversos motivos. Por favor, tente ajustar os valores ou tente novamente.`;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `### Erro na Análise\n\nDesculpe, ocorreu um erro ao comunicar com a IA: ${error.message}. Por favor, tente novamente mais tarde.`;
    }
    return "### Erro na Análise\n\nDesculpe, ocorreu um erro inesperado ao comunicar com a IA. Por favor, tente novamente mais tarde.";
  }
  */
};