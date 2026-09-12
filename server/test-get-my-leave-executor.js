import "dotenv/config";

import connectDB from "./src/config/db.js";
import executeGetMyLeaveRequests from "./src/ai/toolHandlers/getMyLeaveRequests.js";

await connectDB();

const employeeId = process.env.TEST_EMPLOYEE_ID;

if (!employeeId) {
  throw new Error(
    "TEST_EMPLOYEE_ID is required to run this test"
  );
}

const args =
  process.argv[2] === "approved"
    ? { status: "approved" }
    : {};

const result = await executeGetMyLeaveRequests({
  user: {
    employeeId,
  },
  args,
});

console.log(JSON.stringify(result, null, 2));