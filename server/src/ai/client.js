import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is required to start the server"
  );
}

const model = process.env.GEMINI_MODEL || "gemini-3.7-flash";

const ai = new GoogleGenAI({
  apiKey,
});

const serializeMessages = (messages) => {
  return messages.map((message) => {
    switch (message.role) {
      case "user":
        return {
          role: "user",
          parts: [
            {
              text: message.text,
            },
          ],
        };

      case "model":
        return {
          role: "model",
          parts: message.text
            ? [{ text: message.text }]
            : [],
        };

      case "functionCall": {
        const parts = [];

        if (message.text) {
          parts.push({
            text: message.text,
          });
        }

        for (const toolCall of message.toolCalls || []) {
          parts.push({
            functionCall: {
              id: toolCall.id,
              name: toolCall.name,
              args: toolCall.args,
            },
          });
        }

        return {
          role: "model",
          parts,
        };
      }

      case "functionResponse":
        return {
          role: "user",
          parts: (message.toolResults || []).map(
            (toolResult) => ({
              functionResponse: {
                id: toolResult.id,
                name: toolResult.name,
                response: toolResult.success
                  ? { result: toolResult.result }
                  : { error: toolResult.error },
              },
            })
          ),
        };

      default:
        throw new Error(
          `Unsupported assistant message role: ${message.role}`
        );
    }
  });
};

export const generate = async ({
  messages,
  tools = [],
}) => {
  const contents = serializeMessages(messages);

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      tools,
    },
  });

  const parts =
    response.candidates?.[0]?.content?.parts || [];

  const text = parts
    .filter((part) => typeof part.text === "string")
    .map((part) => part.text)
    .join("");

  const toolCalls = parts
    .filter((part) => part.functionCall)
    .map((part) => ({
      id: part.functionCall.id,
      name: part.functionCall.name,
      args: part.functionCall.args || {},
    }));

  return {
    text,
    toolCalls,
  };
};