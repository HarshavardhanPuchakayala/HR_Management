import mongoose from "mongoose";

const payrollYtdSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    taxYear: {
      type: String,
      required: true,
      trim: true,
    },

    taxRegime: {
      type: String,
      enum: ["new", "old"],
      required: true,
      default: "new",
    },

    grossIncomeYtd: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxableIncomeYtd: {
      type: Number,
      default: 0,
      min: 0,
    },

    deductionsYtd: {
      type: Number,
      default: 0,
      min: 0,
    },

    exemptionsYtd: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentEmployerIncomeYtd: {
      type: Number,
      default: 0,
      min: 0,
    },

    previousEmployerIncome: {
      type: Number,
      default: 0,
      min: 0,
    },

    previousEmployerTds: {
      type: Number,
      default: 0,
      min: 0,
    },

    tdsDeductedYtd: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastProcessedMonth: {
      type: Number,
      default: 0,
      min: 0,
      max: 12,
    },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

payrollYtdSchema.index(
  {
    employeeId: 1,
    taxYear: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "PayrollYtd",
  payrollYtdSchema
);