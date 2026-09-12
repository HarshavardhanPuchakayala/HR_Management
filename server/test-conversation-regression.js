import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./src/config/db.js";
import AssistantConversation from "./src/models/AssistantConversation.js";

await connectDB();

const someValidUserId = new mongoose.Types.ObjectId();

console.log("=== TEST 1: VALID DOCUMENT ===");

const doc = new AssistantConversation({
  userId: someValidUserId,
  messages: [
    { role: "user", text: "I need Friday off." },
    { role: "model", text: "Sure, I can help." },
    {
      role: "functionCall",
      toolCalls: [
        { id: "call-001", name: "createLeaveRequest", args: {} },
      ],
    },
    {
      role: "functionResponse",
      toolResults: [
        {
          id: "call-001",
          name: "createLeaveRequest",
          result: {},
          success: true,
          error: null,
        },
      ],
    },
  ],
});

await doc.save();

const saved = await AssistantConversation.findById(doc._id);

console.log(JSON.stringify(saved, null, 2));

console.log("=== TEST 2: INVALID DOCUMENT ===");

const bad = new AssistantConversation({
  userId: someValidUserId,
  messages: [
    {
      role: "user",
      text: "this should not have tool calls",
      toolCalls: [{ id: "x", name: "createLeaveRequest", args: {} }],
    },
  ],
});

try {
  await bad.validate();
  console.log("ERROR: validation should have thrown but did not");
} catch (err) {
  console.log("Correctly threw:", err.message);
}

process.exit(0);