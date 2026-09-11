import { GoogleGenAI } from "@google/genai";

console.log("Before constructor");

try {
  const ai = new GoogleGenAI({
    apiKey: undefined,
  });

  console.log("Constructor succeeded");
  console.log(ai ? "SDK object created" : "No SDK object");
} catch (error) {
  console.log("Constructor threw:");
  console.log(error);
}

console.log("After constructor");