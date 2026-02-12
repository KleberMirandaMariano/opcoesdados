
import { GoogleGenAI, SchemaType } from "@google/genai";
import { StockData, OptionData, MarketInsight } from "../types";

// Initialize the Gemini API client
// Note: In a real production app, you'd never expose the API key on the client.
// This project uses a prompt-based approach to get the key from the user or environment.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

/**
 * Interface for the internal search response with grounding metadata
 */
interface SearchResponse extends StockData {
    sources?: { title: string; uri: string }[];
}

/**
 * Busca dados reais da B3 (preço, nome e variação) usando busca do Google
 */
export const fetchStockDataFromB3 = async (ticker: string): Promise<SearchResponse> => {
    try {
        const prompt = `Encontre o preço atual de fechamento ou cotação em tempo real, o nome oficial da empresa e a variação percentual do dia para o ticker ${ticker} na B3 (Brasil). 
    Responda APENAS com um objeto JSON válido, sem qualquer texto adicional ou formatação Markdown.
    Formato: {"ticker": "${ticker}", "name": "Nome da Empresa", "currentPrice": 0.00, "change": 0.00, "changePercent": 0.00}. Use ponto (.) como separador decimal.`;

        const model = ai.getGenerativeModel({
            model: "gemini-1.5-flash", // Using 1.5 Flash for speed and search tools
            systemInstruction: "Você é um assistente financeiro especializado na B3. Sempre retorne DADOS EM FORMATO JSON PURO, SEM TEXTO ADICIONAL, SEM INTRODUÇÕES OU CONCLUSÕES. Garanta que números decimais usem ponto (.).",
        });

        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            tools: [{ googleSearchRetrieval: {} } as any],
        });

        const rawText = response.response.text() || '';

        // Step 1: Clean up the raw text to isolate potential JSON
        let cleanedText = rawText.trim();
        if (cleanedText.startsWith('```json') && cleanedText.endsWith('```')) {
            cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
        } else if (cleanedText.startsWith('```') && cleanedText.endsWith('```')) {
            cleanedText = cleanedText.substring(3, cleanedText.length - 3).trim();
        }

        // Step 2: Replace comma decimal separators with dots
        cleanedText = cleanedText.replace(/(\d),(\d+)/g, '$1.$2');

        let result: any;
        try {
            result = JSON.parse(cleanedText);
        } catch (parseError) {
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch && jsonMatch[0]) {
                result = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("Invalid JSON response from AI");
            }
        }

        // Extract grounding sources
        const sources = response.response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
            .filter(Boolean) || [];

        return {
            ticker: (result.ticker || ticker).toUpperCase(),
            name: result.name || "Empresa Desconhecida",
            currentPrice: parseFloat(String(result.currentPrice)) || 0,
            change: parseFloat(String(result.change)) || 0,
            changePercent: parseFloat(String(result.changePercent)) || 0,
            sources: sources
        };

    } catch (error: any) {
        console.error(`[${ticker}] Error fetching data:`, error);
        return {
            ticker: ticker.toUpperCase(),
            name: "Erro na Busca",
            currentPrice: 0,
            change: 0,
            changePercent: 0,
            sources: []
        };
    }
};

export const getMarketInsights = async (
    stock: StockData,
    options: OptionData[]
): Promise<MarketInsight> => {
    try {
        const prompt = `Analise os seguintes dados do mercado de opções para a ação ${stock.ticker} (${stock.name}).
    Preço atual: R$ ${stock.currentPrice.toFixed(2)} (${stock.changePercent.toFixed(2)}%).
    
    Opções geradas para análise:
    ${options.map(o => `- ${o.type} Strike R$ ${o.strike.toFixed(2)} | Status: ${o.status}`).join('\n')}
    
    Explique o cenário atual de volatilidade e liquidez. Forneça um resumo do sentimento e uma recomendação.`;

        const model = ai.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        summary: { type: SchemaType.STRING },
                        sentiment: { type: SchemaType.STRING },
                        recommendation: { type: SchemaType.STRING }
                    },
                    required: ["summary", "sentiment", "recommendation"]
                }
            }
        });

        const response = await model.generateContent(prompt);
        return JSON.parse(response.response.text() || '{}') as MarketInsight;
    } catch (error: any) {
        console.error("Error getting market insights:", error);
        return {
            summary: "Análise indisponível temporariamente.",
            sentiment: "neutral",
            recommendation: "Aguarde a atualização dos dados de mercado."
        };
    }
};
