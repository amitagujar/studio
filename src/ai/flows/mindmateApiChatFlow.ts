
'use server';
/**
 * @fileOverview A Genkit flow for Mindmate that allows interacting with a Python API via a tool,
 * using API details provided in the flow's input.
 *
 * - mindmateApiChat - A function that handles the chat interaction, using a tool to call a Python API.
 * - MindmateApiChatInput - The input type for the mindmateApiChat function.
 * - MindmateApiChatOutput - The return type for the mindmateApiChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define input schema for the flow
const MindmateApiChatInputSchema = z.object({
  userInput: z.string().describe('The message input by the user.'),
  customApiUrl: z.string().url().optional().describe('Optional: The URL of the custom Python API to call.'),
  customApiPassword: z.string().optional().describe('Optional: The password for the custom Python API.'),
});
export type MindmateApiChatInput = z.infer<typeof MindmateApiChatInputSchema>;

// Define output schema for the flow
const MindmateApiChatOutputSchema = z.object({
  response: z.string().describe('The AI\'s response to the user.'),
});
export type MindmateApiChatOutput = z.infer<typeof MindmateApiChatOutputSchema>;


// Define the input schema for the Python API tool
const PythonApiToolInputSchema = z.object({
  query: z.string().describe('The query or data to send to the Python API.'),
  apiUrl: z.string().url().optional().describe('The URL of the Python API. The LLM should populate this from the main flow input if available.'),
  apiPassword: z.string().optional().describe('The password for the Python API. The LLM should populate this from the main flow input if available. DO NOT LOG OR LEAK THIS.')
});

// Define a tool that calls a Python API if configured
const callPythonApiTool = ai.defineTool(
  {
    name: 'callPythonApiTool',
    description: "Calls a custom Python API for additional processing or information. To make a real call, provide `apiUrl` and `apiPassword` (obtained from the main user request context/settings) along with the `query`. If `apiUrl` is not provided, the tool simulates a response.",
    inputSchema: PythonApiToolInputSchema,
    outputSchema: z.object({
      pythonResponse: z.string().describe('The response from the Python API (real or simulated).'),
    }),
  },
  async (toolInput) => {
    const { query, apiUrl, apiPassword } = toolInput;

    if (apiUrl) {
      try {
        console.log(`Attempting to call custom API at: ${apiUrl} with query: ${query}`);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Password': apiPassword || '', // Use password if provided
          },
          body: JSON.stringify({ 
            text: query, // Sending the LLM's query as 'text'
            sender: 'ai-tool', // Identifying the sender
            timestamp: new Date().toISOString() 
          }),
        });

        const responseText = await response.text(); // Get text first for better error reporting

        if (!response.ok) {
          console.error(`Custom API Error ${response.status}: ${responseText}`);
          return { pythonResponse: `Error ${response.status} from custom API: ${responseText || response.statusText}` };
        }
        
        // Try to parse as JSON, fallback to text
        let responseData: string;
        try {
            const jsonData = JSON.parse(responseText);
            // Adapt this if your Python API returns a specific structure, e.g., jsonData.reply
            responseData = `Python API JSON response: ${JSON.stringify(jsonData)}`;
        } catch (e) {
            responseData = `Python API text response: ${responseText}`;
        }
        return { pythonResponse: responseData };

      } catch (error) {
        console.error('Failed to call custom API:', error);
        return { pythonResponse: `Failed to call custom API: ${(error as Error).message}` };
      }
    } else {
      // Fallback simulation if apiUrl is not provided by the LLM
      return { pythonResponse: `[Python API SIMULATED Response for: "${query}"] The Python service adds this insight. (Real API not called as URL was not provided to tool).` };
    }
  }
);

// Define the prompt, making the tool available
const chatPrompt = ai.definePrompt({
  name: 'mindmateApiChatPrompt',
  input: { schema: MindmateApiChatInputSchema }, // Prompt receives the full flow input
  output: { schema: MindmateApiChatOutputSchema },
  tools: [callPythonApiTool],
  prompt: `You are Mindmate, a helpful and friendly chat assistant.
The user said: {{{userInput}}}

You have access to a 'callPythonApiTool'.
The current user request context might include:
- Custom API URL: {{#if customApiUrl}}'{{{customApiUrl}}}'{{else}}Not Provided{{/if}}
- Custom API Password: {{#if customApiPassword}}A password has been provided (IMPORTANT: Do NOT ever disclose or repeat this password in your response to the user or in any logs.){{else}}Not Provided{{/if}}

If '{{{customApiUrl}}}' is provided in the context above, you SHOULD consider using the 'callPythonApiTool' to get additional context or processing from that custom Python backend.
When you decide to call 'callPythonApiTool':
1. For the 'query' field of the tool, send the specific information or question you want the Python API to process.
2. For the 'apiUrl' field of the tool, you MUST pass the exact value '{{{customApiUrl}}}' if it's available.
3. For the 'apiPassword' field of the tool, you MUST pass the exact value '{{{customApiPassword}}}' if it's available.

If '{{{customApiUrl}}}' is NOT provided, you can still use the 'callPythonApiTool' (it will run in a simulated mode), or you can choose not to use it if simulation is not helpful. Do NOT attempt to use the tool with guessed or empty URLs if a real URL is not provided in the context.

Integrate the information from the Python API (if you chose to call it and it was configured) naturally and concisely into your answer.
If the user's input is simple, or if the custom API is not configured ({{{customApiUrl}}} is 'Not Provided'), you might not need the tool or it will run in simulation. Use your best judgment.
Keep your response concise and helpful.

CRITICALLY IMPORTANT: Under NO circumstances should you ever reveal, repeat, or output the 'apiPassword' in your textual response to the user.
Focus on the user's query and the information obtained.
`,
});


// Define the main flow
const mindmateApiChatFlow = ai.defineFlow(
  {
    name: 'mindmateApiChatFlow',
    inputSchema: MindmateApiChatInputSchema,
    outputSchema: MindmateApiChatOutputSchema,
  },
  async (input) => {
    // The 'input' here includes userInput, customApiUrl, and customApiPassword
    const llmResponse = await chatPrompt(input); 
    
    const output = llmResponse.output;
    if (output && typeof output.response === 'string') {
      return { response: output.response };
    }
    
    const textResponse = llmResponse.text;
    if (textResponse) {
         return { response: "The AI responded: " + textResponse };
    }

    return { response: "I'm having a little trouble forming a complete thought right now. Could you try rephrasing?" };
  }
);

// Exported wrapper function
export async function mindmateApiChat(input: MindmateApiChatInput): Promise<MindmateApiChatOutput> {
  return mindmateApiChatFlow(input);
}
