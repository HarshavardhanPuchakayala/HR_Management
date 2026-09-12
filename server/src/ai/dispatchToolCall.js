import toolRegistry from "./toolRegistry.js";

const dispatchToolCall = async ({
  toolCall,
  user,
}) => {
  if (!toolCall || typeof toolCall !== "object") {
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

  const executor = toolRegistry[toolCall.name];

  if (!executor) {
    return {
      success: false,
      error: `Unknown tool: ${toolCall.name}`,
    };
  }

  try {
    return await executor({
      user,
      args: toolCall.args || {},
    });
  } catch (error) {
    return {
      success: false,
      error:
        error.message || "Tool execution failed",
    };
  }
};

export default dispatchToolCall;