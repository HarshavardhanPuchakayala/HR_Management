import { GoogleGenAI } from "@google/genai";

try {
  const ai = new GoogleGenAI({ apiKey: undefined });
  console.log(
    "Constructor did NOT throw. Client created:",
    !!ai
  );
} catch (err) {
  console.log("Constructor THREW:", err.message);
}