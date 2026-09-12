import mongoose from "mongoose";

const performanceReviewSchema = new mongoose.Schema(
  {
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReviewCycle",
      required: true,
      index: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "submitted", "acknowledged"],
      default: "draft",
      index: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    strengths: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    areasForImprovement: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    goals: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    employeeComments: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    acknowledgedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

performanceReviewSchema.index(
  {
    cycleId: 1,
    employeeId: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "PerformanceReview",
  performanceReviewSchema
);