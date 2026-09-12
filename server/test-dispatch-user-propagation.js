import "dotenv/config";

import mongoose from "mongoose";

import connectDB from "./src/config/db.js";
import dispatchToolCall from "./src/ai/dispatchToolCall.js";
import LeaveRequest from "./src/models/LeaveRequest.js";

await connectDB();

const employeeId = process.env.TEST_SECOND_EMPLOYEE_ID;

if (!employeeId) {
  throw new Error(
    "TEST_SECOND_EMPLOYEE_ID is required to run this test"
  );
}

const bogusEmployeeId =
  process.env.TEST_EMPLOYEE_ID || "000000000000000000000000";

if (
  !mongoose.Types.ObjectId.isValid(employeeId)
) {
  throw new Error(
    "TEST_SECOND_EMPLOYEE_ID must be a valid MongoDB ObjectId"
  );
}

const result = await dispatchToolCall({
  toolCall: {
    id: "test-user-propagation",
    name: "createLeaveRequest",
    args: {
      employeeId: bogusEmployeeId,
      startDate: "2026-10-05",
      endDate: "2026-10-06",
      leaveType: "casual",
      reason: "Dispatcher identity propagation test",
    },
  },

  user: {
    employeeId,
  },
});

console.log(
  "DISPATCH RESULT:"
);

console.log(
  JSON.stringify(result, null, 2)
);

if (!result.success || !result.result?._id) {
  throw new Error(
    "Leave request was not created successfully"
  );
}

const createdRequest =
  await LeaveRequest.findById(
    result.result._id
  ).lean();

console.log(
  "CREATED LEAVE REQUEST:"
);

console.log(
  JSON.stringify(createdRequest, null, 2)
);

console.log(
  "IDENTITY CHECK:",
  createdRequest.employeeId.toString() ===
    employeeId
);