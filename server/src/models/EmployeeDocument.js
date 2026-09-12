import mongoose from "mongoose";

const employeeDocumentSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    documentType: {
      type: String,
      enum: [
        "offer_letter",
        "contract",
        "policy",
        "certificate",
        "identity",
        "other",
      ],
      default: "other",
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

employeeDocumentSchema.index({ employeeId: 1, createdAt: -1 });

export default mongoose.model("EmployeeDocument", employeeDocumentSchema);