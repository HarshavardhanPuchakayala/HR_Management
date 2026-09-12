
import mongoose from "mongoose";

const payrollProfileSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
      index: true,
    },

    state: {
      type: String,
      required: true,
      default: "TS",
      uppercase: true,
      trim: true,
    },

    taxRegime: {
      type: String,
      enum: ["new", "old"],
      default: "new",
      required: true,
    },

    pfApplicable: {
      type: Boolean,
      default: true,
    },

    esiApplicable: {
      type: Boolean,
      default: false,
    },

    professionalTaxApplicable: {
      type: Boolean,
      default: true,
    },

    tdsApplicable: {
      type: Boolean,
      default: true,
    },

    voluntaryPfContribution: {
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
  { timestamps: true }
);

export default mongoose.model("PayrollProfile", payrollProfileSchema);