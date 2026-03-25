import { GoogleGenAI, Type } from '@google/genai';
import { DraftResult, Sentiment, CaptainRequestResult, GrammarCheckResult } from '../types';

function getAI() {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API key is missing. Please ensure it is set.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateDraft(
  summaryInput: string,
  draftInput: string,
  tone: 'Professional' | 'Empathy Professional' = 'Professional',
  language: 'English' | 'Arabic' = 'English',
  replyTo: 'Customer' | 'Driver' | 'Both' = 'Both'
): Promise<DraftResult> {
  const ai = getAI();
  const prompt = `
    You are an expert Customer Support Agent.
    The user provided the following full conversation history (between user and driver/agent): "${summaryInput}"
    ${draftInput ? `The agent needs to say the following points (draft/bullet points): "${draftInput}"` : ''}
    
    Task 1: Analyze the sentiment of the customer in the conversation.
    Task 2: Summarize the issue into a short title (max 6 words).
    ${replyTo === 'Customer' || replyTo === 'Both' ? `Task 3: Write TWO different ${tone.toLowerCase()} and clear responses to the CUSTOMER. Give them as an array.` : `Task 3: You MUST return an empty array [] for the CUSTOMER responses.`}
    ${replyTo === 'Driver' || replyTo === 'Both' ? `Task 4: Write TWO different ${tone.toLowerCase()} and clear responses to the DRIVER. Give them as an array.` : `Task 4: You MUST return an empty array [] for the DRIVER responses.`}
    
    CRITICAL RULES:
    - DO NOT repeat what the user or driver already said.
    - Stick STRICTLY to the points provided in the draft/bullet points (if provided).
    - The responses in Task 3 and Task 4 MUST be written in ${language}.
  `;

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.STRING,
              description: 'The sentiment of the customer message. Must be one of: Angry, Neutral, Happy, Confused, Urgent.',
            },
            summary: {
              type: Type.STRING,
              description: 'A short title summarizing the issue (max 6 words).',
            },
            responses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Two different professional, empathetic, and clear responses to the user.',
            },
            driverResponses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Two different professional, empathetic, and clear responses to the driver.',
            },
          },
          required: ['sentiment', 'summary', 'responses', 'driverResponses'],
        },
      },
    });
  } catch (err: any) {
    if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
      console.warn("gemini-3-flash-preview failed with 403, falling back to gemini-2.5-flash");
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sentiment: { type: Type.STRING },
              summary: { type: Type.STRING },
              responses: { type: Type.ARRAY, items: { type: Type.STRING } },
              driverResponses: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['sentiment', 'summary', 'responses', 'driverResponses'],
          },
        },
      });
    } else {
      throw err;
    }
  }

  const text = response.text;
  if (!text) {
    throw new Error('Failed to generate draft.');
  }

  let result: any;
  try {
    result = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error('Failed to parse response from AI.');
  }

  if (!result.responses || !Array.isArray(result.responses)) {
    result.responses = result.response ? [result.response, result.response] : ["Could not generate response.", "Please try again."];
  }
  if (!result.driverResponses || !Array.isArray(result.driverResponses)) {
    result.driverResponses = ["Could not generate driver response.", "Please try again."];
  }

  return result as DraftResult;
}

export async function translateText(text: string, targetLanguage: string, onChunk?: (text: string) => void, image?: { data: string, mimeType: string }): Promise<string> {
  const ai = getAI();
  const prompt = `Translate the following text into ${targetLanguage}: \n\n${text}`;
  
  const contents: any = {
    parts: [
      { text: prompt }
    ]
  };

  if (image) {
    contents.parts.unshift({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType
      }
    });
  }

  if (onChunk) {
    let fullText = '';
    try {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: contents,
      });
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullText += chunk.text;
          onChunk(fullText);
        }
      }
      return fullText;
    } catch (err: any) {
      if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
        console.warn("gemini-3-flash-preview failed with 403, falling back to gemini-2.5-flash");
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: contents,
        });
        for await (const chunk of responseStream) {
          if (chunk.text) {
            fullText += chunk.text;
            onChunk(fullText);
          }
        }
        return fullText;
      } else {
        throw err;
      }
    }
  }

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
    });
  } catch (err: any) {
    if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
      console.warn("gemini-3-flash-preview failed with 403, falling back to gemini-2.5-flash");
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
      });
    } else {
      throw err;
    }
  }

  return response.text || '';
}

export async function generateCaptainRequest(input: string): Promise<CaptainRequestResult> {
  const ai = getAI();
  const prompt = `
    You are an expert Customer Support Agent preparing an escalation request for your team captain/manager.
    The user provided the following text (which may contain a customer message, notes, and possibly a ticket link):
    "${input}"
    
    Extract and generate the following information:
    1. ticketLink: Any URL or ticket ID found in the text. If none, leave empty.
    2. summary: A concise summary of the customer's issue.
    3. validation: What the agent has already checked or validated based on the text. If not explicitly stated, infer what basic troubleshooting steps would have been taken or state what is known.
    4. needsFromCaptain: What specifically the agent needs the captain to do (e.g., approve a refund, check backend logs, provide guidance).
  `;

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ticketLink: { type: Type.STRING },
            summary: { type: Type.STRING },
            validation: { type: Type.STRING },
            needsFromCaptain: { type: Type.STRING },
          },
          required: ['ticketLink', 'summary', 'validation', 'needsFromCaptain'],
        },
      },
    });
  } catch (err: any) {
    if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
      console.warn("gemini-3-flash-preview failed with 403, falling back to gemini-2.5-flash");
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ticketLink: { type: Type.STRING },
              summary: { type: Type.STRING },
              validation: { type: Type.STRING },
              needsFromCaptain: { type: Type.STRING },
            },
            required: ['ticketLink', 'summary', 'validation', 'needsFromCaptain'],
          },
        },
      });
    } else {
      throw err;
    }
  }

  const text = response.text;
  if (!text) {
    throw new Error('Failed to generate captain request.');
  }

  try {
    return JSON.parse(text) as CaptainRequestResult;
  } catch (e) {
    console.error("Failed to parse JSON for captain request:", text);
    throw new Error('Failed to parse response from AI.');
  }
}

export async function generateTollEstimate(pickup: string, dropoff: string, time: string, onChunk?: (text: string) => void): Promise<string> {
  const ai = getAI();
  const prompt = `
    You are an expert on UAE toll gates (Salik in Dubai and Darb in Abu Dhabi).
    A user wants to travel from "${pickup}" to "${dropoff}" at "${time}".
    
    Based on typical routes between these locations, estimate:
    1. Which specific toll gates (Salik and/or Darb) they are likely to cross.
    2. The estimated total cost in AED.
    
    Keep in mind:
    - Salik (Dubai) is a flat 4 AED per gate at all times (NO peak time pricing), except Al Maktoum Bridge which is free from 10 PM to 6 AM (Mon-Sat) and all day Sunday.
    - Darb (Abu Dhabi) is 4 AED per gate ONLY during peak hours (Mon-Sat 7-9 AM, 5-7 PM). It is free outside these hours and on Sundays/Public Holidays.
    
    Provide a clear, concise, and professional summary of the expected toll gates and the total cost. Format it nicely using Markdown.
  `;

  if (onChunk) {
    let fullText = '';
    try {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullText += chunk.text;
          onChunk(fullText);
        }
      }
      return fullText;
    } catch (err: any) {
      if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
        console.warn("gemini-3-flash-preview failed with 403, falling back to gemini-2.5-flash");
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        for await (const chunk of responseStream) {
          if (chunk.text) {
            fullText += chunk.text;
            onChunk(fullText);
          }
        }
        return fullText;
      } else {
        throw err;
      }
    }
  }

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
  } catch (err: any) {
    if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
      console.warn("gemini-3-flash-preview failed with 403, falling back to gemini-2.5-flash");
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
    } else {
      throw err;
    }
  }

  return response.text || 'Could not generate toll estimate.';
}

export async function transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
  const ai = getAI();
  const prompt = `
    You are an expert transcriptionist.
    Please transcribe the following audio message accurately.
    The language might be English (including Indian, Pakistani, or Native accents), Urdu, or Arabic (including non-native speakers).
    
    If the audio is in English, provide the exact transcription.
    If the audio is in Urdu or Arabic, provide the transcription in the original language, followed by an English translation.
    
    Format the output clearly.
  `;

  const audioPart = {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };

  const textPart = {
    text: prompt,
  };

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [audioPart, textPart] },
    });
  } catch (err: any) {
    if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
      console.warn("gemini-3-flash-preview failed with 403, falling back to gemini-2.5-flash");
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, textPart] },
      });
    } else {
      throw err;
    }
  }

  return response.text || 'Could not transcribe audio.';
}

export async function checkGrammar(text: string, language: string = 'English', tone: string = 'Neutral'): Promise<GrammarCheckResult> {

  const ai = getAI();
  const prompt = `
    You are an expert proofreader and editor.
    Review the following ${language} text for grammar, punctuation, spelling, and clarity.
    Text to check: "${text}"
    
    ${tone !== 'Neutral' ? `CRITICAL: Rewrite the text to sound more ${tone}. Ensure the final text matches this tone while keeping the original meaning.` : ''}
    
    Provide the fully corrected text. Also, provide a list of specific changes made and a brief explanation for each.
    If the text is already perfect and matches the requested tone, return the original text and an empty changes array.
  `;

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctedText: { type: Type.STRING },
            changes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  corrected: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['original', 'corrected', 'explanation']
              }
            }
          },
          required: ['correctedText', 'changes']
        }
      }
    });
  } catch (err: any) {
    if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
      console.warn("gemini-3-flash-preview failed with 403, falling back to gemini-2.5-flash");
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correctedText: { type: Type.STRING },
              changes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    corrected: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ['original', 'corrected', 'explanation']
                }
              }
            },
            required: ['correctedText', 'changes']
          }
        }
      });
    } else {
      throw err;
    }
  }

  const responseText = response.text;
  if (!responseText) throw new Error('Failed to check grammar.');
  
  try {
    return JSON.parse(responseText) as GrammarCheckResult;
  } catch (e) {
    console.error("Failed to parse JSON for grammar check:", responseText);
    throw new Error('Failed to parse response from AI.');
  }
}
