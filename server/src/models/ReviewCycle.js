import mongoose from "mongoose";

const reviewCycleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "active", "completed"],
      default: "draft",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewCycleSchema.pre("validate", function () {
  if (!this.startDate || !this.endDate) return;

  if (this.startDate > this.endDate) {
    throw new Error("End date cannot be before start date");
  }
});

reviewCycleSchema.index({
  status: 1,
  startDate: -1,
});

export default mongoose.model(
  "ReviewCycle",
  reviewCycleSchema
);