import mongoose from "mongoose";

import EmployeeDocument from "../models/EmployeeDocument.js";
import Employee from "../models/Employee.js";
import { createAuditLog } from "../utils/auditLog.js";

const validId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const DOCUMENT_TYPES = [
  "offer_letter",
  "contract",
  "policy",
  "certificate",
  "identity",
  "other",
];

const validateText = (
  value,
  field,
  maxLength,
  required = false
) => {
  if (value === undefined || value === null) {
    return required
      ? `${field} is required`
      : null;
  }

  if (typeof value !== "string") {
    return `${field} must be a string`;
  }

  if (required && !value.trim()) {
    return `${field} is required`;
  }

  if (value.length > maxLength) {
    return `${field} is too long`;
  }

  return null;
};

const validateDate = (value) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const isSafeFileUrl = (value) => {
  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(
      url.protocol
    );
  } catch {
    return false;
  }
};

export const uploadDocument = async (
  req,
  res
) => {
  try {
    const {
      employeeId,
      title,
      documentType = "other",
      fileName,
      fileUrl,
      expiryDate,
    } = req.body;

    if (!validId(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const titleError = validateText(
      title,
      "title",
      200,
      true
    );

    if (titleError) {
      return res.status(400).json({
        message: titleError,
      });
    }

    const fileNameError = validateText(
      fileName,
      "fileName",
      255,
      true
    );

    if (fileNameError) {
      return res.status(400).json({
        message: fileNameError,
      });
    }

    const fileUrlError = validateText(
      fileUrl,
      "fileUrl",
      2048,
      true
    );

    if (fileUrlError) {
      return res.status(400).json({
        message: fileUrlError,
      });
    }

    if (!isSafeFileUrl(fileUrl.trim())) {
      return res.status(400).json({
        message: "Invalid file URL",
      });
    }

    if (!DOCUMENT_TYPES.includes(documentType)) {
      return res.status(400).json({
        message: "Invalid document type",
      });
    }

    let normalizedExpiryDate = null;

    if (
      expiryDate !== undefined &&
      expiryDate !== null &&
      expiryDate !== ""
    ) {
      normalizedExpiryDate =
        validateDate(expiryDate);

      if (!normalizedExpiryDate) {
        return res.status(400).json({
          message: "Invalid expiry date",
        });
      }
    }

    const employee =
      await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const document =
      await EmployeeDocument.create({
        employeeId,
        title: title.trim(),
        documentType,
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
        expiryDate: normalizedExpiryDate,
        uploadedBy: req.user._id,
      });

    await createAuditLog({
      req,
      action: "DOCUMENT_UPLOADED",
      entityType: "EmployeeDocument",
      entityId: document._id,
    });

    return res.status(201).json(document);
  } catch (error) {
    console.error(
      "Upload document error:",
      error
    );

    if (
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        message: "Invalid document data",
      });
    }

    return res.status(500).json({
      message: "Failed to upload document",
    });
  }
};

export const getEmployeeDocuments = async (
  req,
  res
) => {
  try {
    const { employeeId } = req.params;

    if (!validId(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const employee =
      await Employee.findById(employeeId)
        .select("_id");

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const documents =
      await EmployeeDocument.find({
        employeeId,
      })
        .populate(
          "employeeId",
          "name email department"
        )
        .populate(
          "uploadedBy",
          "email role"
        )
        .sort({ createdAt: -1 });

    return res.json(documents);
  } catch (error) {
    console.error(
      "Get employee documents error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch employee documents",
    });
  }
};

export const getMyDocuments = async (
  req,
  res
) => {
  try {
    const documents =
      await EmployeeDocument.find({
        employeeId:
          req.user.employeeId,
      }).sort({ createdAt: -1 });

    return res.json(documents);
  } catch (error) {
    console.error(
      "Get my documents error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch your documents",
    });
  }
};

export const deleteDocument = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

    const document =
      await EmployeeDocument.findById(id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    await document.deleteOne();

    await createAuditLog({
      req,
      action: "DOCUMENT_DELETED",
      entityType: "EmployeeDocument",
      entityId: document._id,
    });

    return res.json({
      message:
        "Document deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete document error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to delete document",
    });
  }
};