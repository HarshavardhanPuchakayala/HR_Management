import "dotenv/config";

import connectDB from "./src/config/db.js";
import dispatchToolCall from "./src/ai/dispatchToolCall.js";

await connectDB();

const employeeId = process.env.TEST_EMPLOYEE_ID;

if (!employeeId) {
  throw new Error(
    "TEST_EMPLOYEE_ID is required to run this test"
  );
}

const result = await dispatchToolCall({
  toolCall: {
    id: "test-known-tool",
    name: "getMyLeaveRequests",
    args: {},
  },
  user: {
    employeeId,
  },
});

console.log(JSON.stringify(result, null, 2));