import mongoose from "mongoose";

const toolCallSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    args: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const toolResultSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    success: {
      type: Boolean,
      required: true,
    },

    error: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: [
        "user",
        "model",
        "functionCall",
        "functionResponse",
      ],
      required: true,
    },

    text: {
      type: String,
      default: "",
      trim: true,
    },

    toolCalls: {
      type: [toolCallSchema],
      default: undefined,
    },

    toolResults: {
      type: [toolResultSchema],
      default: undefined,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

messageSchema.pre("validate", function (next) {
  const hasToolCalls =
    Array.isArray(this.toolCalls) &&
    this.toolCalls.length > 0;

  const hasToolResults =
    Array.isArray(this.toolResults) &&
    this.toolResults.length > 0;

  if (this.role === "user" || this.role === "model") {
    if (hasToolCalls || hasToolResults) {
      return next(
        new Error(
          `${this.role} messages cannot contain toolCalls or toolResults`
        )
      );
    }
  }

  if (this.role === "functionCall") {
    if (!hasToolCalls) {
      return next(
        new Error(
          "functionCall messages must contain at least one toolCall"
        )
      );
    }

    if (hasToolResults) {
      return next(
        new Error(
          "functionCall messages cannot contain toolResults"
        )
      );
    }
  }

  if (this.role === "functionResponse") {
    if (!hasToolResults) {
      return next(
        new Error(
          "functionResponse messages must contain at least one toolResult"
        )
      );
    }

    if (hasToolCalls) {
      return next(
        new Error(
          "functionResponse messages cannot contain toolCalls"
        )
      );
    }
  }

  next();
});

const assistantConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "New conversation",
    },

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },

    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

assistantConversationSchema.index({
  userId: 1,
  status: 1,
  updatedAt: -1,
});

export default mongoose.model(
  "AssistantConversation",
  assistantConversationSchema
);