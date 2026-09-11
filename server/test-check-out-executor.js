import "dotenv/config";

import connectDB from "./src/config/db.js";
import executeCheckOut from "./src/ai/toolHandlers/checkOut.js";

await connectDB();

const employeeId = process.env.TEST_EMPLOYEE_ID;

if (!employeeId) {
  throw new Error(
    "TEST_EMPLOYEE_ID is required to run this test"
  );
}

const result = await executeCheckOut({
  user: {
    employeeId,
  },
});

console.log(JSON.stringify(result, null, 2));