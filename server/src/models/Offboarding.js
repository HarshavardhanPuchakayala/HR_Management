import mongoose from "mongoose";

const offboardingSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
      index: true,
    },
    exitDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
    status: {
      type: String,
      enum: ["initiated", "in_progress", "completed"],
      default: "initiated",
      index: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Offboarding", offboardingSchema);