import mongoose from "mongoose";

const compensationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    effectiveFrom: {
      type: Date,
      required: true,
    },

    effectiveTo: {
      type: Date,
      default: null,
    },

    salaryType: {
      type: String,
      enum: ["monthly", "annual"],
      default: "annual",
      required: true,
    },

    basic: {
      type: Number,
      required: true,
      min: 0,
    },

    hra: {
      type: Number,
      default: 0,
      min: 0,
    },

    specialAllowance: {
      type: Number,
      default: 0,
      min: 0,
    },

    conveyanceAllowance: {
      type: Number,
      default: 0,
      min: 0,
    },

    medicalAllowance: {
      type: Number,
      default: 0,
      min: 0,
    },

    otherAllowance: {
      type: Number,
      default: 0,
      min: 0,
    },

    employerPfContribution: {
      type: Number,
      default: 0,
      min: 0,
    },

    employerEsiContribution: {
      type: Number,
      default: 0,
      min: 0,
    },

    bonus: {
      type: Number,
      default: 0,
      min: 0,
    },

    overtimeRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

compensationSchema.index({
  employeeId: 1,
  effectiveFrom: -1,
});

export default mongoose.model(
  "Compensation",
  compensationSchema
);