import "dotenv/config";
import { generate } from "./src/ai/client.js";

const result = await generate({
  messages: [
    {
      role: "user",
      text: "Use the testTool to greet John.",
    },
  ],
  tools: [
    {
      functionDeclarations: [
        {
          name: "testTool",
          description: "Greets a person by name.",
          parameters: {
            type: "OBJECT",
            properties: {
              name: {
                type: "STRING",
                description: "The person's name.",
              },
            },
            required: ["name"],
          },
        },
      ],
    },
  ],
});

console.log("RESULT:");
console.log(JSON.stringify(result, null, 2));