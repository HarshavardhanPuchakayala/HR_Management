import mongoose from "mongoose";

import AssistantConversation from "../models/AssistantConversation.js";
import { generate } from "../ai/client.js";
import dispatchToolCall from "../ai/dispatchToolCall.js";
import {
  toolDeclarations,
  toolActionMap,
} from "../ai/toolRegistry.js";

const MAX_TOOL_ROUNDS = 1;

const createConversation = async (userId) => {
  return AssistantConversation.create({
    userId,
    title: "New conversation",
    status: "active",
    messages: [],
  });
};

const appendMessage = (conversation, message) => {
  conversation.messages.push(message);
};

const getTodayIsoDate = () => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
    .toISOString()
    .slice(0, 10);
};

const buildFallbackConfirmation = (toolResults) => {
  const summaries = toolResults.map((toolResult) => {
    if (toolResult.success) {
      return `${toolResult.name} completed successfully.`;
    }
    return `${toolResult.name} failed: ${toolResult.error}`;
  });

  return summaries.join(" ");
};

export const chat = async (req, res) => {
  try {
    const user = req.user;
    const userId = user._id;

    const { message, conversationId } = req.body;

    if (typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    if (conversationId !== undefined) {
      if (
        typeof conversationId !== "string" ||
        !mongoose.Types.ObjectId.isValid(conversationId)
      ) {
        return res.status(400).json({
          message: "Invalid conversationId",
        });
      }
    }

    let conversation;

    if (conversationId) {
      conversation = await AssistantConversation.findOne({
        _id: conversationId,
        userId,
        status: "active",
      });

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found",
        });
      }
    } else {
      conversation = await createConversation(userId);
    }

    appendMessage(conversation, {
      role: "user",
      text: message.trim(),
    });

    const today = getTodayIsoDate();

    const firstGeneration = await generate({
      messages: conversation.messages,
      tools: toolDeclarations,
      today,
    });

    if (firstGeneration.toolCalls.length === 0) {
      appendMessage(conversation, {
        role: "model",
        text: firstGeneration.text,
      });

      await conversation.save();

      return res.json({
        conversationId: conversation._id,
        message: firstGeneration.text,
        toolCalls: [],
      });
    }

    if (MAX_TOOL_ROUNDS !== 1) {
      throw new Error("Invalid assistant tool round configuration");
    }

    appendMessage(conversation, {
      role: "functionCall",
      text: firstGeneration.text,
      toolCalls: firstGeneration.toolCalls,
    });

    const toolResults = [];
    let actionSucceeded = false;

    for (const toolCall of firstGeneration.toolCalls) {
      const result = await dispatchToolCall({
        toolCall,
        user,
      });

      toolResults.push({
        id: toolCall.id,
        name: toolCall.name,
        result: result.result ?? null,
        success: result.success,
        error: result.success
          ? null
          : result.error || "Tool execution failed",
      });

      if (toolActionMap[toolCall.name] === true && result.success) {
        actionSucceeded = true;
      }
    }

    appendMessage(conversation, {
      role: "functionResponse",
      toolResults,
    });

    if (actionSucceeded) {
      await conversation.save();
    }

    const secondGeneration = await generate({
      messages: conversation.messages,
      tools: toolDeclarations,
      today,
    });

    if (secondGeneration.toolCalls.length > 0) {
      const safeFinalMessage =
        "I completed the requested action, but I couldn't complete the remaining assistant step.";

      appendMessage(conversation, {
        role: "model",
        text: safeFinalMessage,
      });

      await conversation.save();

      return res.json({
        conversationId: conversation._id,
        message: safeFinalMessage,
        toolCalls: [],
      });
    }

    const finalText =
      secondGeneration.text.trim() !== ""
        ? secondGeneration.text
        : buildFallbackConfirmation(toolResults);

    appendMessage(conversation, {
      role: "model",
      text: finalText,
    });

    await conversation.save();

    return res.json({
      conversationId: conversation._id,
      message: finalText,
      toolCalls: firstGeneration.toolCalls.map((toolCall) => ({
        id: toolCall.id,
        name: toolCall.name,
      })),
    });
  } catch (error) {
    console.error("Assistant chat error:", error);

    return res.status(500).json({
      message: "Assistant is temporarily unavailable",
    });
  }
};