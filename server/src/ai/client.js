import OpenAI from "openai";

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL;

if (!apiKey) {
  throw new Error(
    "OPENROUTER_API_KEY is required to start the server"
  );
}

if (!model) {
  throw new Error(
    "OPENROUTER_MODEL is required to start the server"
  );
}

const ai = new OpenAI({
  apiKey,
  baseURL: "https://openrouter.ai/api/v1",
});

const serializeMessages = (messages) => {
  return messages
    .map((message) => {
      switch (message.role) {
        case "user":
          return {
            role: "user",
            content: message.text || "",
          };

        case "model":
          return {
            role: "assistant",
            content: message.text || "",
          };

        case "functionCall":
          return {
            role: "assistant",
            content: message.text || null,
            tool_calls: (message.toolCalls || []).map(
              (toolCall) => ({
                id: toolCall.id,
                type: "function",
                function: {
                  name: toolCall.name,
                  arguments: JSON.stringify(
                    toolCall.args || {}
                  ),
                },
              })
            ),
          };

        case "functionResponse":
          return (message.toolResults || []).map(
            (toolResult) => ({
              role: "tool",
              tool_call_id: toolResult.id,
              content: JSON.stringify(
                toolResult.success
                  ? { result: toolResult.result }
                  : { error: toolResult.error }
              ),
            })
          );

        default:
          throw new Error(
            `Unsupported assistant message role: ${message.role}`
          );
      }
    })
    .flat();
};

const serializeTools = (tools) => {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
};

export const generate = async ({
  messages,
  tools = [],
  today,
}) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error(
      "At least one assistant message is required"
    );
  }

  const serializedMessages = serializeMessages(messages);
  const serializedTools = serializeTools(tools);

  const finalMessages = today
    ? [
        {
          role: "system",
          content: `Today's date is ${today}. Use this as the authoritative current date when interpreting relative dates such as "today", "tomorrow", "next Friday", or a month/day mentioned without a year.`,
        },
        ...serializedMessages,
      ]
    : serializedMessages;

  const request = {
    model,
    messages: finalMessages,
  };

  if (serializedTools.length > 0) {
    request.tools = serializedTools;
  }

  const response = await ai.chat.completions.create(request);

  const message = response.choices?.[0]?.message;

  if (!message) {
    throw new Error(
      "OpenRouter returned no assistant message"
    );
  }

  const toolCalls = (message.tool_calls || [])
    .filter(
      (toolCall) =>
        toolCall.type === "function" &&
        toolCall.function
    )
    .map((toolCall) => {
      let args = {};

      try {
        args = JSON.parse(
          toolCall.function.arguments || "{}"
        );
      } catch {
        throw new Error(
          `Invalid JSON arguments returned for tool ${toolCall.function.name}`
        );
      }

      return {
        id: toolCall.id,
        name: toolCall.function.name,
        args,
      };
    });

  return {
    text: message.content || "",
    toolCalls,
    model: response.model,
  };
};