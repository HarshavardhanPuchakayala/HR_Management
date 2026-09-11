import mongoose from "mongoose";

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    leaveType: {
      type: String,
      enum: ["sick", "casual", "vacation", "other"],
      required: true,
    },

    totalAllotted: {
      type: Number,
      required: true,
      min: 0,
    },

    used: {
      type: Number,
      default: 0,
      min: 0,
    },

    carriedOver: {
      type: Number,
      default: 0,
      min: 0,
    },

    cycleYear: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

leaveBalanceSchema.index(
  {
    employeeId: 1,
    leaveType: 1,
    cycleYear: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "LeaveBalance",
  leaveBalanceSchema
);