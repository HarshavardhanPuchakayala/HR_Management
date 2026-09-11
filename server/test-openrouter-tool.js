import "dotenv/config";

import { generate } from "./src/ai/client.js";
import createLeaveRequestTool from "./src/ai/tools/createLeaveRequest.js";

const main = async () => {
  console.log("Testing OpenRouter tool calling...");
  console.log(
    "Configured model:",
    process.env.OPENROUTER_MODEL
  );

  const result = await generate({
    messages: [
      {
        role: "user",
        text:
          "I need sick leave from 2026-09-18 to 2026-09-18 because I have a doctor's appointment.",
      },
    ],

    tools: [createLeaveRequestTool],
  });

  console.log("\nServed by:", result.model);

  console.log("\nRESULT:");
  console.log(JSON.stringify(result, null, 2));

  console.log("\nTOOL CALLS:");
  console.log(JSON.stringify(result.toolCalls, null, 2));
};

main().catch((error) => {
  console.error("\nTEST FAILED:");
  console.error(error);
  process.exit(1);
});