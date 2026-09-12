import toolRegistry from "./toolRegistry.js";

const dispatchToolCall = async ({
  toolCall,
  user,
}) => {
  if (
    !toolCall ||
    typeof toolCall !== "object"
  ) {
    return {
      success: false,
      error: "Invalid tool call",
    };
  }

  if (
    typeof toolCall.name !== "string" ||
    toolCall.name.trim() === ""
  ) {
    return {
      success: false,
      error: "Tool call name is required",
    };
  }

  if (
    !toolCall.args ||
    typeof toolCall.args !== "object" ||
    Array.isArray(toolCall.args)
  ) {
    return {
      success: false,
      error: "Invalid tool arguments",
    };
  }

  const toolName =
    toolCall.name.trim();

  const executor =
    toolRegistry[toolName];

  if (!executor) {
    return {
      success: false,
      error: "Unknown tool",
    };
  }

  try {
    const result = await executor({
      user,
      args: toolCall.args,
    });

    if (
      !result ||
      typeof result !== "object"
    ) {
      return {
        success: true,
        result: result ?? null,
      };
    }

    return result;
  } catch (error) {
    console.error(
      `Tool execution error (${toolName}):`,
      error.message
    );

    return {
      success: false,
      error: "Tool execution failed",
    };
  }
};

export default dispatchToolCall;