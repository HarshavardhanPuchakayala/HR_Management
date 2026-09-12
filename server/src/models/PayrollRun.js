
import mongoose from "mongoose";

const payrollRunSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    payrollMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    payrollYear: {
      type: Number,
      required: true,
      min: 2020,
    },

    periodStart: {
      type: Date,
      required: true,
    },

    periodEnd: {
      type: Date,
      required: true,
    },

    workingDays: {
      type: Number,
      required: true,
      min: 0,
    },

    paidDays: {
      type: Number,
      required: true,
      min: 0,
    },

    lossOfPayDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    earnings: {
      basic: { type: Number, default: 0, min: 0 },
      hra: { type: Number, default: 0, min: 0 },
      specialAllowance: { type: Number, default: 0, min: 0 },
      conveyanceAllowance: { type: Number, default: 0, min: 0 },
      medicalAllowance: { type: Number, default: 0, min: 0 },
      otherAllowance: { type: Number, default: 0, min: 0 },
      bonus: { type: Number, default: 0, min: 0 },
      overtime: { type: Number, default: 0, min: 0 },
      arrears: { type: Number, default: 0, min: 0 },
      reimbursements: { type: Number, default: 0, min: 0 },
    },

    grossPay: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxableIncome: {
      type: Number,
      default: 0,
      min: 0,
    },

    deductions: {
      employeePf: { type: Number, default: 0, min: 0 },
      employeeEsi: { type: Number, default: 0, min: 0 },
      professionalTax: { type: Number, default: 0, min: 0 },
      tds: { type: Number, default: 0, min: 0 },
      voluntaryPf: { type: Number, default: 0, min: 0 },
      other: { type: Number, default: 0, min: 0 },
    },

    totalDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },

    netPay: {
      type: Number,
      default: 0,
      min: 0,
    },

    employerContributions: {
      employerPf: { type: Number, default: 0, min: 0 },
      employerEsi: { type: Number, default: 0, min: 0 },
    },

    employerCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    statutoryBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    statutoryRuleVersion: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["draft", "calculated", "approved", "paid", "locked"],
      default: "draft",
      index: true,
    },

    calculatedAt: {
      type: Date,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

payrollRunSchema.index(
  {
    employeeId: 1,
    payrollYear: 1,
    payrollMonth: 1,
  },
  { unique: true }
);

export default mongoose.model("PayrollRun", payrollRunSchema);