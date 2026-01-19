import { GoogleGenerativeAI, SchemaType, Tool } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { performDeleteThread } from "../controllers/threadController.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define the shape of the arguments the AI will send us
interface DeleteThreadArgs {
    threadId?: string;
}

const threadTools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "deleteThread",
                description: "Deletes the current chat thread and all history from the database.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        threadId: {
                            type: SchemaType.STRING,
                            description: "The unique ID of the thread to delete.",
                        },
                    },
                    required: ["threadId"],
                },
            },
        ],
    },
];

export const geminiClient = {
    async chat(prompt: string, userId: string, currentThreadId: string): Promise<string> {
        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
            systemInstruction: `You are Nexus AI. Respond in plain text. 
            The current thread ID is: ${currentThreadId}.
            If asked to delete or clear this chat, you MUST call deleteThread using this ID.
            When you output code:
- Use Markdown fenced code blocks
- Use triple BACKTICKS \`\`\` (not single quotes)
- Never use ''' or """ for code
- Do not wrap code in quotes
`,
            tools: threadTools as any,
        });

        const chat = model.startChat();
        let result = await chat.sendMessage(prompt);
        let response = result.response;

        const call = response.functionCalls()?.[0];

        if (call && call.name === "deleteThread") {
            // ✅ FIX: Cast 'args' to our interface to avoid the TS error
            const args = call.args as DeleteThreadArgs;

            // Safety fallback: Use the ID we passed from the controller if the AI misses it
            const idToUse = args.threadId || currentThreadId;

            console.log(`🤖 Agent executing delete for: ${idToUse}`);
            const toolResult = await performDeleteThread(userId, idToUse);

            const finalResponse = await chat.sendMessage([
                {
                    functionResponse: {
                        name: "deleteThread",
                        response: toolResult,
                    },
                },
            ]);

            return finalResponse.response.text().trim();
        }
        console.dir(result.response, { depth: null });

        return response.text().trim().replace(/\*\*/g, "");
    },
};