
import { GoogleGenAI, Modality, GenerateContentResponse, Part } from "@google/genai";
import { ImagePart } from '../types';
import { supabase } from '../lib/supabase';
import { checkUsageLimit, logUsage } from './usageService';

let cachedApiKey: string | null = null;
let ai: GoogleGenAI | null = null;

const getActiveApiKey = async (): Promise<string | null> => {
  if (cachedApiKey) return cachedApiKey;

  try {
    const { data } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('provider', 'google_gemini')
      .eq('is_active', true)
      .maybeSingle();

    if (data?.api_key) {
      cachedApiKey = data.api_key;
      return data.api_key;
    }
  } catch (error) {
    console.error('Error fetching API key:', error);
  }

  return process.env.API_KEY || null;
};

const getAiClient = async (): Promise<GoogleGenAI> => {
  if (ai) return ai;

  const apiKey = await getActiveApiKey();
  if (!apiKey) {
    throw new Error('No Google Gemini API key configured. Please contact your administrator to add an API key in the Admin Dashboard.');
  }

  if (!apiKey.trim() || apiKey.length < 20) {
    throw new Error('Invalid Google Gemini API key format. Please verify the API key in the Admin Dashboard.');
  }

  try {
    ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    return ai;
  } catch (error) {
    console.error('Failed to initialize Google GenAI client:', error);
    throw new Error('Failed to initialize AI client. Please verify your API key is valid.');
  }
};

const checkAndLogUsage = async (userId: string, actionType: 'thumbnail' | 'product_shoot' | 'reimagine' | 'scene') => {
  const { allowed, remaining } = await checkUsageLimit(userId);

  if (!allowed) {
    throw new Error(`Usage limit exceeded. You have ${remaining} generations remaining this month.`);
  }

  await logUsage(userId, actionType);
};

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const mockImageResponse = async (prompt: string): Promise<string> => {
    await new Promise(res => setTimeout(res, 1500));
    console.log(`Mock AI call for: ${prompt}`);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Failed to create canvas context');
    }

    const hue1 = Math.floor(Math.random() * 360);
    const hue2 = (hue1 + 60) % 360;
    const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
    gradient.addColorStop(0, `hsl(${hue1}, 70%, 60%)`);
    gradient.addColorStop(1, `hsl(${hue2}, 70%, 50%)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = prompt.slice(0, 50);
    const lines = text.match(/.{1,30}/g) || [text];
    const lineHeight = 40;
    const startY = 512 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
        ctx.fillText(line, 512, startY + i * lineHeight);
    });

    return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
};

export const generateScene = async (prompt: string, userId?: string): Promise<string | null> => {
    const apiKey = await getActiveApiKey();
    if (!apiKey) {
        return mockImageResponse(prompt);
    }

    if (userId) {
        await checkAndLogUsage(userId, 'scene');
    }

    try {
        const client = await getAiClient();
        const response = await client.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A high-quality, professional background scene for a thumbnail, based on the following description: ${prompt}`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        return null;
    } catch (error) {
        console.error("Error generating scene:", error);
        if (error instanceof Error && (error.message.includes('UNAUTHENTICATED') || error.message.includes('CREDENTIALS'))) {
            throw new Error('Invalid Google Gemini API key. Please verify your API key in the Admin Dashboard.');
        }
        throw new Error("Failed to generate scene. The prompt may have been rejected. Please try a different description.");
    }
};

export const generateProductPhotoShoot = async (base64ImageData: string, mimeType: string, prompt: string, examples: ImagePart[], userId?: string): Promise<string | null> => {
    const apiKey = await getActiveApiKey();
    if (!apiKey) {
        return mockImageResponse(prompt);
    }

    if (userId) {
        await checkAndLogUsage(userId, 'product_shoot');
    }

    try {
        const client = await getAiClient();
        let systemPrompt: string;
        const contentParts: Part[] = [];

        if (examples.length > 0) {
            systemPrompt = `You are a professional product photographer. Your task is to place the subject from the user's image into a new scene.
**Critically, you must emulate the exact style, lighting, mood, and composition of the example images provided.**
Use the examples as a strict style guide. Then, apply that style to the user's subject and the scene described in their prompt. Ensure the final image is photorealistic and of commercial quality.`;

            examples.forEach(ex => {
                contentParts.push({ inlineData: { data: ex.base64Data, mimeType: ex.mimeType } });
            });
        } else {
            systemPrompt = `You are a world-class commercial product photographer. Your task is to take the subject from the provided image and place it into a new, photorealistic scene based on the user's prompt.
**Key requirements:**
1.  **Photorealism:** The integration must be seamless. The lighting, shadows, reflections, and perspective on the subject MUST perfectly match the new environment described in the prompt.
2.  **Focus:** The product should be the clear hero of the image.
3.  **Quality:** The final output must be high-resolution, sharp, and suitable for a professional advertising campaign or e-commerce store.`;
        }

        contentParts.push({ inlineData: { data: base64ImageData, mimeType } });
        contentParts.push({ text: `${systemPrompt}\n\n**Scene Prompt:** ${prompt}` });

        const response: GenerateContentResponse = await client.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: contentParts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating product photoshoot:", error);
        if (error instanceof Error) {
            if (error.message.includes('API key') || error.message.includes('UNAUTHENTICATED') || error.message.includes('CREDENTIALS')) {
                throw new Error('Invalid or missing Google Gemini API key. Please verify your API key in the Admin Dashboard. Make sure you are using a valid API key from Google AI Studio (https://aistudio.google.com/app/apikey).');
            }
            if (error.message.includes('API key')) {
                throw error;
            }
        }
        throw new Error("Failed to generate product photoshoot. The image may have been rejected by the AI safety filters. Please try a different description or image.");
    }
};

export const generateThumbnail = async (prompt: string, images: ImagePart[], presetName: string, examples: ImagePart[], userId?: string): Promise<string | null> => {
    const apiKey = await getActiveApiKey();
    if (!apiKey) {
        return mockImageResponse(`Thumbnail for: ${prompt}`);
    }

    if (userId) {
        await checkAndLogUsage(userId, 'thumbnail');
    }

    try {
        const client = await getAiClient();
        let systemPrompt: string;
        const contentParts: Part[] = [];

        if (examples.length > 0) {
            systemPrompt = `You are a professional graphic designer tasked with creating a thumbnail.
**Your primary goal is to replicate the artistic style, composition, and visual energy of the example thumbnails provided.**
Analyze the examples for their use of color, text effects, layout, and overall mood.
Then, apply this exact style to the new assets and prompt provided by the user to create a new, cohesive thumbnail for the ${presetName} platform.`

            examples.forEach(ex => {
                contentParts.push({ inlineData: { data: ex.base64Data, mimeType: ex.mimeType } });
            });
        } else {
            systemPrompt = `You are a world-class graphic designer specializing in creating viral, eye-catching thumbnails for platforms like YouTube.
Your task is to generate a single, cohesive, and professional thumbnail image based on the provided assets and user prompt.

**Core Design Principles:**
1.  **High Contrast & Readability:** Use bold, contrasting colors. If text is requested, it must be large, easy to read, and pop from the background (e.g., using strokes, shadows, or contrasting color blocks).
2.  **Focal Point:** There must be a clear, primary subject. If a person is present in the assets, make them the focal point. Use dynamic poses and exaggerated emotions if appropriate for the topic.
3.  **Dynamic Composition:** Arrange elements using principles like the rule of thirds. Create a sense of depth and energy. Avoid flat, centered layouts unless specifically requested.
4.  **Emotional Impact:** The thumbnail should evoke curiosity, excitement, or another strong emotion relevant to the prompt.
5.  **Asset Integration:** You MUST use all the image assets provided. If an asset has a background, it should be expertly removed and the subject seamlessly blended into the new scene.

**Your Task:**
Adhere to these principles and the user's prompt to create a complete thumbnail for the ${presetName} platform.`;
        }

        images.forEach(image => {
            contentParts.push({
                inlineData: { data: image.base64Data, mimeType: image.mimeType }
            });
        });

        contentParts.push({ text: `${systemPrompt}\n\nUser Prompt: ${prompt}` });

        const response: GenerateContentResponse = await client.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: contentParts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        return null;

    } catch (error) {
        console.error("Error generating thumbnail:", error);
        if (error instanceof Error && (error.message.includes('UNAUTHENTICATED') || error.message.includes('CREDENTIALS'))) {
            throw new Error('Invalid Google Gemini API key. Please verify your API key in the Admin Dashboard.');
        }
        throw new Error("Failed to generate thumbnail. Please try again.");
    }
};

export const reimagineImage = async (prompt: string, image?: ImagePart, userId?: string): Promise<string | null> => {
    const apiKey = await getActiveApiKey();
    if (!apiKey) {
        return mockImageResponse(prompt);
    }

    if (userId) {
        await checkAndLogUsage(userId, 'reimagine');
    }

    try {
        const client = await getAiClient();

        if (image) {
            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        { inlineData: { data: image.base64Data, mimeType: image.mimeType } },
                        { text: prompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
            return null;
        }
        else {
            const response = await client.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/jpeg',
                  aspectRatio: '1:1',
                },
            });
            if (response.generatedImages && response.generatedImages.length > 0) {
                return response.generatedImages[0].image.imageBytes;
            }
            return null;
        }
    } catch (error) {
        console.error("Error in reimagineImage:", error);
        if (error instanceof Error && (error.message.includes('UNAUTHENTICATED') || error.message.includes('CREDENTIALS'))) {
            throw new Error('Invalid Google Gemini API key. Please verify your API key in the Admin Dashboard.');
        }
        throw new Error("Failed to generate image. The prompt may have been rejected or the service is unavailable.");
    }
};