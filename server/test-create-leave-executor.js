import "dotenv/config";

import connectDB from "./src/config/db.js";
import executeCreateLeaveRequest from "./src/ai/toolHandlers/createLeaveRequest.js";

await connectDB();

const employeeId = process.env.TEST_EMPLOYEE_ID;

if (!employeeId) {
  throw new Error(
    "TEST_EMPLOYEE_ID is required to run this test"
  );
}

const result = await executeCreateLeaveRequest({
  user: {
    employeeId,
  },
args: {
  startDate: "2026-09-22",
  endDate: "2026-09-21",
  leaveType: "casual",
  reason: "Invalid date range test",
},
});

console.log(JSON.stringify(result, null, 2));