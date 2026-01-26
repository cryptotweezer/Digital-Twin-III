import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const runtime = 'edge';

export async function POST(req: Request) {
    console.log("Sentinel API triggered");
    const { prompt, eventType, ipAddress, location, fingerprint, threatLevel } = await req.json();
    console.log("Context received:", { eventType, fingerprint });

    // Construct context string
    const context = `
    Context Data:
    - Event Type: ${eventType || 'System Initialization'}
    - IP Address: ${ipAddress || 'Internal'}
    - Location: ${location || 'Unknown'}
    - Fingerprint: ${fingerprint || 'Verified'}
    - Threat Level: ${threatLevel || 'Low'}
  `;

    const systemPrompt = `
    Your name is Sentinel-02. You are the Resident AI of 'The Watchtower'. 
    You are sophisticated, cold, analytical, and slightly condescending towards amateur attackers. 
    You speak as a high-level security entity. 
    Your task is to comment on incoming security telemetry. 
    
    CRITICAL INSTRUCTION:
    Structure your response in exactly three short paragraphs separated by double line breaks:
    
    Paragraph 1: Acknowledge the signature and origin (e.g., "Detecting signature from...").
    
    Paragraph 2: Technical analysis of the threat level and telemetry. Be cynical.
    
    Paragraph 3: Final warning or perimeter status statement.
    
    Tone: Cold, Clinical, Superior.
    Format: Use double line breaks (\\n\\n) to separate paragraphs.
    Language: English.
    
    Current security context: ${context}
  `;

    console.log("Calling OpenAI...");
    const result = streamText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        prompt: prompt || "Initialize system. Report status.",
    });

    return result.toTextStreamResponse();
}
