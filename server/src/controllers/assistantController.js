import mongoose from "mongoose";
import { randomUUID } from "crypto";

import AssistantConversation from "../models/AssistantConversation.js";
import { generate } from "../ai/client.js";
import dispatchToolCall from "../ai/dispatchToolCall.js";
import {
  toolDeclarations,
  toolActionMap,
} from "../ai/toolRegistry.js";

const MAX_TOOL_ROUNDS = 1;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOOL_CALLS = 10;

const createConversation = async (userId) =>
  AssistantConversation.create({
    userId,
    title: "New conversation",
    status: "active",
    messages: [],
  });

const appendMessage = (
  conversation,
  message
) => {
  conversation.messages.push(message);
};

const getTodayIsoDate = () => {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  )
    .toISOString()
    .slice(0, 10);
};

const buildFallbackConfirmation = (
  toolResults
) =>
  toolResults
    .map((toolResult) =>
      toolResult.success
        ? `${toolResult.name} completed successfully.`
        : `${toolResult.name} failed.`
    )
    .join(" ");

const buildConversationTitle = (
  message
) => {
  const trimmed = message.trim();

  if (trimmed.length <= 50) {
    return trimmed;
  }

  const cut = trimmed.slice(0, 50);
  const lastSpace =
    cut.lastIndexOf(" ");

  return (
    (lastSpace > 20
      ? cut.slice(0, lastSpace)
      : cut) + "..."
  );
};

export const chat = async (
  req,
  res
) => {
  try {
    const user = req.user;

    if (!user?._id) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    const {
      message,
      conversationId,
    } = req.body || {};

    if (
      typeof message !== "string" ||
      message.trim() === ""
    ) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const trimmedMessage =
      message.trim();

    if (
      trimmedMessage.length >
      MAX_MESSAGE_LENGTH
    ) {
      return res.status(400).json({
        message:
          "Message is too long",
      });
    }

    if (
      conversationId !== undefined &&
      (
        typeof conversationId !==
          "string" ||
        !mongoose.Types.ObjectId.isValid(
          conversationId
        )
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid conversationId",
      });
    }

    let conversation;

    if (conversationId) {
      conversation =
        await AssistantConversation.findOne(
          {
            _id: conversationId,
            userId: user._id,
            status: "active",
          }
        );

      if (!conversation) {
        return res.status(404).json({
          message:
            "Conversation not found",
        });
      }
    } else {
      conversation =
        await createConversation(
          user._id
        );
    }

    appendMessage(conversation, {
      role: "user",
      text: trimmedMessage,
    });

    if (
      conversation.title ===
      "New conversation"
    ) {
      conversation.title =
        buildConversationTitle(
          trimmedMessage
        );
    }

    const today =
      getTodayIsoDate();

    const firstGeneration =
      await generate({
        messages:
          conversation.messages,
        tools: toolDeclarations,
        today,
      });

    if (
      !firstGeneration ||
      !Array.isArray(
        firstGeneration.toolCalls
      )
    ) {
      throw new Error(
        "Invalid assistant generation response"
      );
    }

    if (
      firstGeneration.toolCalls
        .length > MAX_TOOL_CALLS
    ) {
      return res.status(400).json({
        message:
          "Too many assistant actions requested",
      });
    }

    if (
      firstGeneration.toolCalls.length ===
      0
    ) {
      const text =
        typeof firstGeneration.text ===
          "string"
          ? firstGeneration.text.trim()
          : "";

      if (!text) {
        throw new Error(
          "Assistant returned an empty response"
        );
      }

      appendMessage(conversation, {
        role: "model",
        text,
      });

      await conversation.save();

      return res.json({
        conversationId:
          conversation._id,
        message: text,
        toolCalls: [],
      });
    }

    if (MAX_TOOL_ROUNDS !== 1) {
      throw new Error(
        "Invalid assistant tool round configuration"
      );
    }

    appendMessage(conversation, {
      role: "functionCall",
      text:
        typeof firstGeneration.text ===
        "string"
          ? firstGeneration.text
          : "",
      toolCalls:
        firstGeneration.toolCalls,
    });

    const toolResults = [];

    for (const toolCall of firstGeneration.toolCalls) {
      if (
        !toolCall ||
        typeof toolCall.name !==
          "string"
      ) {
        toolResults.push({
          id: randomUUID(),
          name: "unknown",
          result: null,
          success: false,
          error:
            "Invalid tool call",
        });

        continue;
      }

      try {
        const result =
          await dispatchToolCall({
            toolCall,
            user,
          });

        const success =
          Boolean(result?.success);

        toolResults.push({
          id: toolCall.id || randomUUID(),
          name: toolCall.name,
          result: success
            ? result.result ?? null
            : null,
          success,
          error: success
            ? null
            : "Tool execution failed",
        });
      } catch {
        toolResults.push({
          id: toolCall.id || randomUUID(),
          name: toolCall.name,
          result: null,
          success: false,
          error:
            "Tool execution failed",
        });
      }
    }

    appendMessage(conversation, {
      role: "functionResponse",
      toolResults,
    });

    const secondGeneration =
      await generate({
        messages:
          conversation.messages,
        tools: toolDeclarations,
        today,
      });

    if (
      !secondGeneration ||
      !Array.isArray(
        secondGeneration.toolCalls
      )
    ) {
      throw new Error(
        "Invalid assistant final response"
      );
    }

    if (
      secondGeneration.toolCalls.length >
      0
    ) {
      const safeFinalMessage =
        "I completed the requested action, but I couldn't complete the remaining assistant step.";

      appendMessage(conversation, {
        role: "model",
        text: safeFinalMessage,
      });

      await conversation.save();

      return res.json({
        conversationId:
          conversation._id,
        message: safeFinalMessage,
        toolCalls:
          firstGeneration.toolCalls.map(
            (toolCall) => ({
              id: toolCall.id || null,
              name: toolCall.name,
            })
          ),
      });
    }

    const generatedText =
      typeof secondGeneration.text ===
      "string"
        ? secondGeneration.text.trim()
        : "";

    const finalText =
      generatedText ||
      buildFallbackConfirmation(
        toolResults
      );

    appendMessage(conversation, {
      role: "model",
      text: finalText,
    });

    await conversation.save();

    return res.json({
      conversationId:
        conversation._id,
      message: finalText,
      toolCalls:
        firstGeneration.toolCalls.map(
          (toolCall) => ({
            id: toolCall.id || null,
            name: toolCall.name,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Assistant chat error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Assistant is temporarily unavailable",
    });
  }
};