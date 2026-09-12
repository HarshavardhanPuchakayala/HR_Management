import dispatchToolCall from "./src/ai/dispatchToolCall.js";

const result = await dispatchToolCall({
  toolCall: {
    id: "test-unknown-tool",
    name: "deleteAllEmployees",
    args: {},
  },
  user: {
    employeeId: "does-not-matter",
  },
});

console.log(JSON.stringify(result, null, 2));