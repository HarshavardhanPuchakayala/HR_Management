import mongoose from "mongoose";

const payrollRuleSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: true,
      default: "IN",
      uppercase: true,
    },

    state: {
      type: String,
      required: true,
      default: "TS",
      uppercase: true,
    },

    effectiveFrom: {
      type: Date,
      required: true,
    },

    effectiveTo: {
      type: Date,
      default: null,
    },

    epf: {
      employeeRate: {
        type: Number,
        default: 0.12,
        min: 0,
        max: 1,
      },

      employerRate: {
        type: Number,
        default: 0.12,
        min: 0,
        max: 1,
      },

      wageCeiling: {
        type: Number,
        default: 15000,
        min: 0,
      },

      pensionRate: {
        type: Number,
        default: 0.0833,
        min: 0,
        max: 1,
      },
    },

    esi: {
      employeeRate: {
        type: Number,
        default: 0.0075,
        min: 0,
        max: 1,
      },

      employerRate: {
        type: Number,
        default: 0.0325,
        min: 0,
        max: 1,
      },

      wageCeiling: {
        type: Number,
        default: 21000,
        min: 0,
      },
    },

    professionalTax: {
      enabled: {
        type: Boolean,
        default: true,
      },

      slabs: [
        {
          minMonthlySalary: {
            type: Number,
            required: true,
            min: 0,
          },

          maxMonthlySalary: {
            type: Number,
            default: null,
          },

          monthlyTax: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
    },

    incomeTax: {
      enabled: {
        type: Boolean,
        default: true,
      },

      cessRate: {
        type: Number,
        default: 0.04,
        min: 0,
        max: 1,
      },
    },

    version: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

payrollRuleSchema.index({
  country: 1,
  state: 1,
  effectiveFrom: -1,
});

export default mongoose.model(
  "PayrollRule",
  payrollRuleSchema
);