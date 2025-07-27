import { GoogleGenAI, Type } from "@google/genai";
import type { StoryEntry, GeminiStoryResponse, CampaignType, GeminiRecommendationResponse } from '../types';
import { 
    SYSTEM_INSTRUCTION_NORMAL, 
    SYSTEM_INSTRUCTION_FAMILY,
    SYSTEM_INSTRUCTION_SUMMARIZE_NORMAL,
    SYSTEM_INSTRUCTION_SUMMARIZE_FAMILY,
    SYSTEM_INSTRUCTION_RECOMMENDATION
} from "../constants";

// Memoize the client so we don't create it on every call
let ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
    if (ai) {
        return ai;
    }
    // Deferring this check until the first API call allows the app to load.
    if (typeof process === 'undefined' || !process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set or accessible.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai;
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        scene: { type: Type.STRING, description: "A detailed description of the current situation, environment, and any characters present." },
        summaryForImage: { type: Type.STRING, description: "A concise, visual summary of the scene, suitable for an image generation AI. Focus on the key subjects, setting, and mood." },
        ambiance: { type: Type.STRING, description: "A one or two word descriptor for the scene's mood to select background music. Examples: 'tavern', 'combat', 'forest', 'travel', 'city'."},
        isGameOver: { type: Type.BOOLEAN },
        gameOverReason: { type: Type.STRING, description: "A brief explanation if the game has ended." },
        suggestedActions: { 
            type: Type.ARRAY, 
            description: "A list of 3-4 suggested actions for the player. The last option should always allow for custom input.",
            items: { type: Type.STRING } 
        },
        skillCheck: {
            type: Type.OBJECT,
            description: "OPTIONAL. A request for the player to make a skill check roll. Omit this field entirely if no check is needed.",
            properties: {
                skill: { type: Type.STRING, description: 'The skill to be checked, e.g., "Perception" or "Strength (Athletics)".' },
                difficultyClass: { type: Type.INTEGER, description: 'The DC the player must beat.' }
            },
        },
        shopInventory: {
            type: Type.ARRAY,
            description: "OPTIONAL. A list of items for sale in a shop. Omit if not in a shop.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    cost: { type: Type.STRING }
                },
                required: ["name", "cost"]
            }
        },
        readableContent: {
            type: Type.OBJECT,
            description: "OPTIONAL. The content of a readable item like a book or scroll. Omit if not reading.",
            properties: {
                title: { type: Type.STRING },
                text: { type: Type.STRING }
            }
        },
        transaction: {
            type: Type.OBJECT,
            description: "OPTIONAL. The details of a single item transaction. Omit if no transaction occurred.",
            properties: {
                type: { type: Type.STRING, description: "'buy' or 'sell'" },
                itemName: { type: Type.STRING },
                cost: { type: Type.INTEGER }
            },
            required: ["type", "itemName", "cost"]
        }
    },
    required: ["scene", "summaryForImage", "isGameOver", "gameOverReason", "suggestedActions", "ambiance"]
};

export async function generateStory(history: StoryEntry[], type: CampaignType, overrideSystemInstruction?: string): Promise<GeminiStoryResponse> {
    const localAi = getAiClient();
    const contents = history.map(entry => {
        return {
            role: entry.type === 'player' ? 'user' : 'model',
            parts: [{ text: entry.text }]
        }
    });

    let systemInstruction = type === 'Family' ? SYSTEM_INSTRUCTION_FAMILY : SYSTEM_INSTRUCTION_NORMAL;
    if(overrideSystemInstruction) {
        systemInstruction = overrideSystemInstruction;
    }


    const response = await localAi.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents, // Pass the entire conversation history for context
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });
    
    try {
        const jsonText = response.text.trim();
        // The service can sometimes return an incomplete JSON object, so we'll do a basic check.
        if (!jsonText.endsWith('}')) {
             throw new Error("Incomplete JSON response from API.");
        }
        return JSON.parse(jsonText) as GeminiStoryResponse;
    } catch (e) {
        console.error("Failed to parse Gemini response:", response.text, e);
        // Fallback in case of parsing error
        return {
            scene: "The weave of fate is tangled. The world seems to shimmer and break. (Error: The DM's response was garbled). Please try a different action.",
            summaryForImage: "a glitch in a fantasy world, digital artifacts",
            ambiance: "default",
            isGameOver: false,
            gameOverReason: "",
            suggestedActions: ["Try again.", "Do something else..."],
            skillCheck: null,
            shopInventory: null,
            readableContent: null,
            transaction: null,
        };
    }
}

export async function summarizeHistory(history: StoryEntry[], type: CampaignType): Promise<string> {
    const localAi = getAiClient();
    // Don't include the initial character sheet prompt in the summarization history
    const historyToSummarize = history.slice(1);
    const contents = historyToSummarize.map(entry => {
        return {
            role: entry.type === 'player' ? 'user' : 'model',
            parts: [{ text: entry.text }]
        }
    });

    const systemInstruction = type === 'Family' ? SYSTEM_INSTRUCTION_SUMMARIZE_FAMILY : SYSTEM_INSTRUCTION_SUMMARIZE_NORMAL;

    const response = await localAi.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return response.text;
}


export async function generateSceneImage(prompt: string): Promise<string> {
    const localAi = getAiClient();
    if (!prompt || prompt.trim() === "") {
        console.warn("generateSceneImage called with an empty prompt. Skipping image generation.");
        throw new Error("Image generation failed: prompt was empty.");
    }
    const imagePrompt = `Epic fantasy digital painting, ${prompt}, highly detailed, dramatic lighting, intricate, artstation trending.`;
    
    const response = await localAi.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: imagePrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    }

    throw new Error("Failed to generate image: No images were returned from the API.");
}

export async function generateCharacterRecommendations(race: string, pClass: string, loyalty: string): Promise<GeminiRecommendationResponse> {
    const localAi = getAiClient();
    const prompt = `Character concept: Race=${race}, Class=${pClass}, Loyalty=${loyalty}.`;
    
    const recommendationSchema = {
        type: Type.OBJECT,
        properties: {
            suggestedName: { type: Type.STRING },
            suggestedBackstory: { type: Type.STRING, description: "A short, creative backstory of 2-3 sentences." }
        },
        required: ["suggestedName", "suggestedBackstory"]
    };

    const response = await localAi.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION_RECOMMENDATION,
            responseMimeType: "application/json",
            responseSchema: recommendationSchema
        }
    });
    
    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as GeminiRecommendationResponse;
    } catch (e) {
        console.error("Failed to parse recommendation response:", response.text);
        // Fallback response
        return {
            suggestedName: "Aleron the Lost",
            suggestedBackstory: "Once a scholar with a promising future, they were exiled after an experiment went awry, and now seek to clear their name."
        };
    }
}