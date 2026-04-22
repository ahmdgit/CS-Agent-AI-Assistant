import { GoogleGenAI, Type } from '@google/genai';
import { DraftResult, Sentiment, CaptainRequestResult, GrammarCheckResult } from '../types';

// Define an array of API keys for fallback route.
const apiKeys = [
  "AIzaSyB3yMdd_hbiHfVHuQxgEcnjpQEaz9_Zd0U",
  "AIzaSyBIDLhrLpZl2r5WqwndDCXmPacpwYg87NE",
  "AIzaSyD9n7t8sMxoT0V5KcKo5ZtByZnSMfqgftI",
  "AIzaSyDJmreGlmpXzxJ5rimYlI1k4C7w1QomASc",
  "AIzaSyDzt0vGp0eqJA65T3uFx0Pp5WDxXANtbaE",
  process.env.GEMINI_API_KEY // Backup environment variable just in case
].filter(Boolean) as string[];

let currentApiKeyIndex = 0;

function getAI() {
  if (apiKeys.length === 0) {
    throw new Error("No API keys are available.");
  }
  const apiKey = apiKeys[currentApiKeyIndex];
  return new GoogleGenAI({ apiKey });
}

// Custom wrapper to execute calls and seamlessly rotate keys on Quota Exhaustion
async function executeWithFallback<T>(callFunc: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  const maxAttempts = apiKeys.length;
  let attempts = 0;
  let lastError: any;

  while (attempts < maxAttempts) {
    try {
      const ai = getAI();
      return await callFunc(ai);
    } catch (err: any) {
      lastError = err;
      const errorMessage = err.message || "";
      // Check if the error is related to Quota or Rate Limits
      if (
        errorMessage.includes('429') || 
        errorMessage.includes('quota') || 
        errorMessage.includes('RESOURCE_EXHAUSTED')
      ) {
        console.warn(`API Key ${currentApiKeyIndex + 1} exhausted. Failing over to next key...`);
        currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length; // Move to the next key
        attempts++;
      } else {
        // If it's a different error (like a bad request or 403), throw immediately
        throw err;
      }
    }
  }

  throw new Error("All available API keys have exhausted their quota: " + (lastError?.message || ""));
}

export async function generateDraft(
  summaryInput: string,
  draftInput: string,
  tone: 'Professional' | 'Empathy Professional' = 'Professional',
  language: 'English' | 'Arabic' = 'English',
  replyTo: 'Customer' | 'Driver' | 'Both' = 'Both',
  replyLength: string = 'Auto',
  agentName: string = '',
  company: string = 'Yango',
  includeGreeting: boolean = true,
  includeEnding: boolean = true
): Promise<DraftResult> {
  const ai = getAI();

  const englishGreeting = `Hi,\n\nThank you for contacting us. I'm ${agentName || '[Name]'} from the ${company} support team, and I'm happy to help you with your problem.`;
  const arabicGreeting = `مرحباً،\n\nشكراً لتواصلك معنا. أنا ${agentName || '[الاسم]'} من فريق دعم ${company}، ويسعدني مساعدتك في حل مشكلتك.`;
  const greetingText = language === 'Arabic' ? arabicGreeting : englishGreeting;

  const englishClosing = `If you need any further assistance, please don't hesitate to reach out to us.\n\nThank you for contacting ${company} customer support! We would greatly appreciate it if you could rate your experience with us in this chat (5 being the highest). Your feedback is incredibly valuable and helps us serve you better.\n\nHave a wonderful day!`;
  
  const arabicClosing = `إذا احتجت أي مساعدة إضافية، فلا تتردد في التواصل معنا في أي وقت.\n\nشكراً لتواصلك مع خدمة عملاء ${company}! نرجو منك التكرم بتقييم تجربتك معنا في هذه الدردشة (حيث 5 هو التقييم الأعلى). ملاحظاتك تهمنا جداً وتساعدنا على تقديم خدمة أفضل لك دائماً.\n\nنتمنى لك يوماً سعيداً!`;

  const closingText = language === 'Arabic' ? arabicClosing : englishClosing;

  const prompt = `
    You are an elite, world-class Customer Support Specialist. Your goal is to draft the perfect, most effective response that maximizes Customer Satisfaction (CSAT) and resolves the issue efficiently.

    === INPUT CONTEXT ===
    Conversation History: "${summaryInput}"
    ${draftInput ? `Required Resolution/Action Points (You MUST include these in your reply): "${draftInput}"` : 'No specific resolution points provided. Infer the best standard support response based on the conversation.'}
    Target Audience: ${replyTo}
    Tone: ${tone}
    Language: ${language}
    ${agentName ? `Agent Name: ${agentName}` : ''}
    Company: ${company}
    ${replyLength !== 'Auto' ? `Length Constraint: Exactly ${replyLength} sentences (excluding the greeting and closing).` : ''}

    === TASKS ===
    Task 1: Analyze the customer's sentiment (Angry, Neutral, Happy, Confused, Urgent).
    Task 2: Create a concise, 6-word max summary of the core issue.
    ${replyTo === 'Customer' || replyTo === 'Both' ? `Task 3: Write TWO distinct, highly polished responses to the CUSTOMER.` : `Task 3: Return an empty array [] for CUSTOMER responses.`}
    ${replyTo === 'Driver' || replyTo === 'Both' ? `Task 4: Write TWO distinct, highly polished, clear, and directive responses to the DRIVER.` : `Task 4: Return an empty array [] for DRIVER responses.`}

    === CRITICAL GUIDELINES FOR REPLIES ===
    1. DIRECT COMMUNICATION (NO INSTRUCTIONS):
       - You are writing the EXACT message the support agent will copy and paste to the recipient.
       - DO NOT write instructions for the agent (e.g., do NOT write "Inform the driver to..." or "Tell the customer that...").
       - Write directly TO the recipient using "you" (e.g., "Please restart your app...").
       - Use "I" or "we" to refer to the support team.
    2. STRUCTURE & FORMATTING (MANDATORY):
       - DO NOT write a single block of text. You MUST use paragraph breaks (empty lines) to separate sections.
       - SPACING RULE: You MUST leave a blank empty line between the Greeting, the Body, and the Closing.
       ${includeGreeting ? `- Greeting: Start with the following EXACT greeting message in a NEW paragraph:\n         "${greetingText}"\n\n` : '- Greeting: DO NOT include any greeting or introduction. Start directly with the acknowledgment.'}
       - Acknowledge & Validate: In a NEW paragraph, briefly acknowledge their specific situation and apologize if appropriate (e.g., "I am sorry to hear you are not receiving bookings.").
       - Resolve: In a NEW paragraph, clearly deliver the solution using the "Required Resolution/Action Points". Explain the "why" if provided. Use bullet points if there are multiple steps.
       ${includeEnding ? `\n\n       - Close: End with the following EXACT closing message in a NEW paragraph:\n         "${closingText}"` : '- Close: DO NOT include any closing message, sign-off, or ending. End immediately after the resolution.'}
    3. TONE RULES:
       - Sound HUMAN, natural, and conversational. Avoid robotic phrases like "rectify this situation" or "prompt cooperation". Use simple, friendly language.
       - "Professional": Direct, clear, polite, and solution-oriented.
       - "Empathy Professional": Warm, understanding, and highly apologetic if something went wrong. Validate their feelings before giving the solution.
    4. PERSONALIZATION: Use specific details from the conversation so it doesn't sound generic. DO NOT just parrot the conversation back.
    5. DRIVER REPLIES: If writing to a driver, be extremely clear, directive, and respectful. Use bullet points if helpful. Remember, write DIRECTLY to the driver.
    6. LANGUAGE: All replies MUST be written in ${language}.
    ${replyLength !== 'Auto' ? `7. LENGTH: You MUST write EXACTLY ${replyLength} sentences for the main body (excluding the provided greeting and closing). Count your punctuation marks carefully.` : '7. LENGTH: Keep it concise but well-structured.'}
    8. DO NOT REPEAT WORDS: Do NOT repeat the exact words or phrases used by the rider or driver. Rephrase and summarize their issue professionally.
    9. NO BLAME: Do NOT blame the company (${company}) or its systems/policies for the issue under any circumstances. Take ownership politely without pointing fingers.
  `;

  let response;
  try {
    response = await executeWithFallback(async (ai) => {
      try {
        return await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sentiment: { type: Type.STRING, description: 'The sentiment of the customer message. Must be one of: Angry, Neutral, Happy, Confused, Urgent.' },
                summary: { type: Type.STRING, description: 'A short title summarizing the issue (max 6 words).' },
                responses: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Two different professional, empathetic, and clear responses to the user.' },
                driverResponses: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Two different professional, empathetic, and clear responses to the driver.' },
              },
              required: ['sentiment', 'summary', 'responses', 'driverResponses'],
            },
          },
        });
      } catch (err: any) {
        if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
          console.warn("gemini-3-flash-preview failed with permission issues, falling back to gemini-2.5-flash");
          return await ai.models.generateContent({
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
    });
  } catch (err: any) {
    console.error("All fallbacks exhausted for generateDraft:", err);
    throw err;
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
    await executeWithFallback(async (ai) => {
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
      } catch (err: any) {
         if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
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
        } else {
          throw err;
        }
      }
    });
    return fullText;
  }

  let response;
  try {
    response = await executeWithFallback(async (ai) => {
      try {
        return await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: contents,
        });
      } catch (err: any) {
        if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
          return await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
          });
        } else {
           throw err;
        }
      }
    });
  } catch (err: any) {
    console.error("All API Keys exhausted for translateText.", err);
    throw err;
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
    response = await executeWithFallback(async (ai) => {
      try {
        return await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
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
      } catch(err: any) {
        if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
          console.warn("gemini-3-flash-preview failed, falling back to gemini-2.5-flash");
          return await ai.models.generateContent({
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
    });
  } catch (err: any) {
     console.error("All API fallbacks exhausted for generateCaptainRequest:", err);
     throw err;
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

export async function generateTollEstimate(pickup: string, dropoff: string, time: string, tollRate: string, onChunk?: (text: string) => void): Promise<string> {
  const ai = getAI();
  const prompt = `
    You are an expert on UAE toll gates (Salik in Dubai and Darb in Abu Dhabi).
    A user wants to travel from "${pickup}" to "${dropoff}" at "${time}".
    
    Based on typical routes between these locations, estimate:
    1. The typical route or track taken between these two locations.
    2. Which specific toll gates (Salik and/or Darb) they are likely to cross along this track.
    3. The estimated total cost in AED.
    
    Keep in mind:
    - The user has specified that the toll rate to calculate with is ${tollRate} AED per gate. Use this rate for your calculations.
    - Salik (Dubai) has 10 gates: Al Barsha, Al Garhoud, Al Maktoum, Al Safa, Airport Tunnel, Al Mamzar South, Al Mamzar North, Jebel Ali, Business Bay Crossing, and Al Safa South.
    - Salik is a flat ${tollRate} AED per gate at all times (NO peak time pricing).
    - Al Maktoum Bridge is free from 10 PM to 6 AM (Mon-Sat) and all day Sunday.
    - Al Mamzar North & South are charged once if crossed in the same direction within 1 hour.
    - Al Safa & Al Safa South are charged once if crossed in the same direction within 1 hour.
    - Darb (Abu Dhabi) is ${tollRate} AED per gate ONLY during peak hours (Mon-Sat 7-9 AM, 5-7 PM). It is free outside these hours and on Sundays/Public Holidays.
    
    Provide a clear, concise, and professional summary of the expected toll gates and the total cost. Format it nicely using Markdown.
  `;

  if (onChunk) {
    let fullText = '';
    await executeWithFallback(async (ai) => {
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
      } catch(err: any) {
        if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
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
        } else {
          throw err;
        }
      }
    });
    return fullText;
  }

  let response;
  try {
     response = await executeWithFallback(async (ai) => {
       try {
         return await ai.models.generateContent({
           model: 'gemini-3-flash-preview',
           contents: prompt,
         });
       } catch(err: any) {
          if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
            return await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
          } else {
            throw err;
          }
       }
     });
  } catch (err: any) {
      console.error("All API Fallbacks exhausted for TollEstimate:", err);
      throw err;
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
    response = await executeWithFallback(async (ai) => {
      try {
        return await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts: [audioPart, textPart] },
        });
      } catch(err: any) {
        if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
          return await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, textPart] },
          });
        } else {
          throw err;
        }
      }
    });
  } catch (err: any) {
     console.error("All API fallbacks exhausted for transcribeAudio:", err);
     throw err;
  }

  return response.text || 'Could not transcribe audio.';
}

export async function rephraseText(text: string, tone: string, onChunk?: (text: string) => void): Promise<string> {
  const ai = getAI();
  const prompt = `
    You are an expert copywriter and editor.
    Please rephrase the following text to have a "${tone}" tone.
    
    Original Text:
    "${text}"
    
    Provide ONLY the rephrased text. Do not include any introductory or concluding remarks.
  `;
  
  const contents: any = {
    parts: [
      { text: prompt }
    ]
  };

  if (onChunk) {
    let fullText = '';
    await executeWithFallback(async (ai) => {
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
      } catch(err: any) {
        if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
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
        } else {
          throw err;
        }
      }
    });
    return fullText;
  }

  let response;
  try {
    response = await executeWithFallback(async (ai) => {
      try {
        return await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: contents,
        });
      } catch(err: any) {
         if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
          return await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
          });
        } else {
          throw err;
        }
      }
    });
  } catch (err: any) {
     console.error("All API fallbacks exhausted for rephraseText:", err);
     throw err;
  }

  return response.text || '';
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
    response = await executeWithFallback(async (ai) => {
      try {
        return await ai.models.generateContent({
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
         throw err;
      }
    });
  } catch (err: any) {
     console.error("All API keys and fallbacks exhausted for checkGrammar:", err);
     throw err;
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
