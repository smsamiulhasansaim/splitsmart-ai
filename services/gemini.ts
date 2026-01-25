
import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData, CommandAction } from "../types";

const MODEL_NAME = 'gemini-3-pro-preview';

export const parseReceiptImage = async (base64Image: string): Promise<ReceiptData> => {
  // Fix: Strictly follow Gemini API guidelines for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analyze this receipt image. Extract all items with their individual prices. 
  Also extract the subtotal, tax, and tip. If tax or tip aren't found, default them to 0.
  Return the data as a clean JSON object. Ensure item names are concise.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                price: { type: Type.NUMBER }
              },
              required: ['id', 'name', 'price']
            }
          },
          subtotal: { type: Type.NUMBER },
          tax: { type: Type.NUMBER },
          tip: { type: Type.NUMBER }
        },
        required: ['items', 'subtotal', 'tax', 'tip']
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return data as ReceiptData;
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("Could not interpret receipt. Please try a clearer photo.");
  }
};

export const interpretCommand = async (
  userMessage: string, 
  availableItems: string[],
  currentAssignments: string
): Promise<CommandAction> => {
  // Fix: Strictly follow Gemini API guidelines for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Context: You are managing a bill splitting app.
    Available Items on Receipt: ${availableItems.join(', ')}
    Current Assignments: ${currentAssignments}

    User Command: "${userMessage}"

    Goal: Determine who had what based on the command. 
    Match the user's mentioned items to the closest "Available Items".
    Extract the names of the people.
    
    If they say "Sarah had the pizza", action is ASSIGN, itemNames is ["Pizza"], peopleNames is ["Sarah"].
    If they say "Sarah and Bob shared the nachos", action is ASSIGN, itemNames is ["Nachos"], peopleNames is ["Sarah", "Bob"].
    If they say "Everything for me", assume one person (use "Me" or their name if known) and assign all items.
    
    Return the result as JSON.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, description: 'ASSIGN or REMOVE' },
          itemNames: { type: Type.ARRAY, items: { type: Type.STRING } },
          peopleNames: { type: Type.ARRAY, items: { type: Type.STRING } },
          explanation: { type: Type.STRING, description: 'A short sentence explaining what you did.' }
        },
        required: ['action', 'itemNames', 'peopleNames', 'explanation']
      }
    }
  });

  return JSON.parse(response.text || '{}') as CommandAction;
};
