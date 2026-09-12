import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    leaveType: {
      type: String,
      enum: ["sick", "casual", "vacation", "other"],
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Useful for employee leave history and filtering
 * by status.
 */
leaveRequestSchema.index({
  employeeId: 1,
  status: 1,
  createdAt: -1,
});

/*
 * Data-integrity validation.
 *
 * Leave requests cannot:
 * - end before they start
 * - span multiple calendar years
 */
leaveRequestSchema.pre("validate", function () {
  if (!this.startDate || !this.endDate) {
    return;
  }

  if (this.startDate > this.endDate) {
    throw new Error("End date cannot be before start date");
  }

  const startYear = this.startDate.getUTCFullYear();
  const endYear = this.endDate.getUTCFullYear();

  if (startYear !== endYear) {
    throw new Error(
      "Leave requests cannot span multiple calendar years"
    );
  }
});

const LeaveRequest = mongoose.model(
  "LeaveRequest",
  leaveRequestSchema
);

export default LeaveRequest;