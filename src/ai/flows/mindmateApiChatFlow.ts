
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
  customApiUrl: z.string().url().optional().describe('Optional URL for a custom Python API endpoint for the AI to use.'),
  customApiPassword: z.string().optional().describe('Optional password for the custom Python API.'),
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
  apiUrl: z.string().url().optional().describe('The specific URL of the Python API to call. This should be provided by the main flow if a custom API is configured.'),
  apiPassword: z.string().optional().describe('The password/key for the Python API. This should be provided by the main flow if a custom API is configured.'),
});

// Define a tool that calls a Python API if configured
const callPythonApiTool = ai.defineTool(
  {
    name: 'callPythonApiTool',
    description: "Calls a custom Python API for additional processing or information. The API URL and password should be passed to this tool if a custom API interaction is intended and these details are available in the broader context. If apiUrl is not provided, the tool will simulate a response.",
    inputSchema: PythonApiToolInputSchema,
    outputSchema: z.object({
      pythonResponse: z.string().describe('The response from the Python API (real or simulated).'),
    }),
  },
  async (toolInput) => {
    const { query, apiUrl, apiPassword } = toolInput;

    if (apiUrl) {
      if (!apiPassword) {
        console.warn('Custom API URL provided to tool, but no password. Proceeding without password header.');
        // Optionally return an error or a specific message
        // return { pythonResponse: "Error: API URL provided to tool, but no password." };
      }
      try {
        console.log(`Attempting to call custom API at: ${apiUrl} with query: ${query}`);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiPassword && { 'X-API-Password': apiPassword }), // Conditionally add password header
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
      // Simulate API call delay if no real URL is provided to the tool
      await new Promise(resolve => setTimeout(resolve, 300));
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
The user might have provided a custom API URL ({{{customApiUrl}}}) and an API password ({{{customApiPassword}}}) for you to use.
If the user's query seems to require external processing or information that this custom API could provide, AND if 'customApiUrl' is available:
1. You SHOULD use the 'callPythonApiTool'.
2. When calling the tool, you MUST pass the 'customApiUrl' from this context as the 'apiUrl' parameter for the tool.
3. You MUST pass the 'customApiPassword' from this context as the 'apiPassword' parameter for the tool.
4. For the 'query' field of the tool, send the specific information or question you want the Python API to process based on '{{{userInput}}}'.

IMPORTANT: NEVER reveal the 'customApiPassword' or any API keys in your textual response to the user.

Integrate any information received from the Python API (if you chose to call it and it was configured and successfully responded) naturally and concisely into your answer.
If the 'customApiUrl' is not provided, or if the user's input is simple, you might not need the tool, or it will run in simulation mode if called without an 'apiUrl'. Use your best judgment.
Keep your response concise and helpful.
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
    const llmResponse = await chatPrompt(input); // Pass the whole input object

    const output = llmResponse.output;
    if (output && typeof output.response === 'string') {
      return { response: output.response };
    }

    // If the model did not use the structured output format for some reason,
    // attempt to return its direct text response.
    const textResponse = llmResponse.text;
    if (textResponse) {
         return { response: "The AI responded: " + textResponse };
    }
    
    // Fallback response if no structured output and no text response
    return { response: "I'm having a little trouble forming a complete thought right now. Could you try rephrasing?" };
  }
);

// Exported wrapper function
export async function mindmateApiChat(input: MindmateApiChatInput): Promise<MindmateApiChatOutput> {
  return mindmateApiChatFlow(input);
}
