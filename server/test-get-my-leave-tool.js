import "dotenv/config";

import { generate } from "./src/ai/client.js";
import getMyLeaveRequestsTool from "./src/ai/tools/getMyLeaveRequests.js";

const result = await generate({
  messages: [
    {
      role: "user",
text: "Show me my leave requests",
    },
  ],
  tools: [getMyLeaveRequestsTool],
});

console.log("Served by:", result.model);
console.log(JSON.stringify(result, null, 2));