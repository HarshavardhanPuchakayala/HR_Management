import "dotenv/config";

import connectDB from "./src/config/db.js";
import executeCheckIn from "./src/ai/toolHandlers/checkIn.js";

await connectDB();

const employeeId = process.env.TEST_EMPLOYEE_ID;

if (!employeeId) {
  throw new Error(
    "TEST_EMPLOYEE_ID is required to run this test"
  );
}

const result = await executeCheckIn({
  user: {
    employeeId,
  },
});

console.log(JSON.stringify(result, null, 2));