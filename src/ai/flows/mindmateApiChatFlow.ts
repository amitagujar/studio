
'use server';
/**
 * @fileOverview A Genkit flow for Mindmate that simulates interacting with a Python API via a tool.
 *
 * - mindmateApiChat - A function that handles the chat interaction, using a tool to simulate a Python API call.
 * - MindmateApiChatInput - The input type for the mindmateApiChat function.
 * - MindmateApiChatOutput - The return type for the mindmateApiChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define input schema
const MindmateApiChatInputSchema = z.object({
  userInput: z.string().describe('The message input by the user.'),
});
export type MindmateApiChatInput = z.infer<typeof MindmateApiChatInputSchema>;

// Define output schema
const MindmateApiChatOutputSchema = z.object({
  response: z.string().describe('The AI\'s response to the user.'),
});
export type MindmateApiChatOutput = z.infer<typeof MindmateApiChatOutputSchema>;


// Define a tool that simulates calling a Python API
const callPythonApiTool = ai.defineTool(
  {
    name: 'callPythonApiTool',
    description: 'Simulates a call to a Python API for additional processing or information. Use this to get a "Python perspective" on the user input.',
    inputSchema: z.object({
      query: z.string().describe('The query or data to send to the Python API.'),
    }),
    outputSchema: z.object({
      pythonResponse: z.string().describe('The simulated response from the Python API.'),
    }),
  },
  async (input) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    // Simulate a response from the Python API
    return { pythonResponse: `[Python API Simulated Response for: "${input.query}"] The Python service adds this insight.` };
  }
);

// Define the prompt, making the tool available
const chatPrompt = ai.definePrompt({
  name: 'mindmateApiChatPrompt',
  input: { schema: MindmateApiChatInputSchema },
  output: { schema: MindmateApiChatOutputSchema },
  tools: [callPythonApiTool],
  prompt: `You are Mindmate, a helpful and friendly chat assistant.
  The user said: {{{userInput}}}

  Before formulating your final response, consider using the 'callPythonApiTool' to get additional context or processing from our specialized Python backend.
  Integrate the information from the Python API (if you choose to call it) naturally into your answer.
  If the user's input is simple, you might not need the tool. Use your best judgment.
  Keep your response concise and helpful.`,
});


// Define the main flow
const mindmateApiChatFlow = ai.defineFlow(
  {
    name: 'mindmateApiChatFlow',
    inputSchema: MindmateApiChatInputSchema,
    outputSchema: MindmateApiChatOutputSchema,
  },
  async (input) => {
    const llmResponse = await chatPrompt(input); // No need for .generate here, prompt() is the new API
    
    // Ensure output is correctly structured
    const output = llmResponse.output;
    if (output && typeof output.response === 'string') {
      return { response: output.response };
    }
    
    // Fallback or error handling if the output is not as expected
    // This could happen if the LLM doesn't adhere to the output schema
    // or if a tool call has an issue not caught by Genkit.
    console.warn("LLM output was not in the expected format, or tool usage was unexpected. Raw output:", llmResponse);
    
    // Attempt to provide a sensible default if direct response is missing but text() is available.
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
