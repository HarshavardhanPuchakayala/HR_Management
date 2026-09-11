import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-3.7-flash";

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing");
}

const ai = new GoogleGenAI({ apiKey });

const response = await ai.models.generateContent({
  model,
  contents: [
    {
      role: "user",
      parts: [{ text: "Say hi" }],
    },
  ],
});

console.log("MODEL:", model);
console.log("TEXT:");
console.log(response.text);

console.log("\nCANDIDATES:");
console.log(
  JSON.stringify(response.candidates, null, 2)
);