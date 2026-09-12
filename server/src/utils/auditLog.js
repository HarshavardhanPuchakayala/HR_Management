import AuditLog from "../models/AuditLog.js";

const MAX_DETAILS_KEYS = 30;

export const createAuditLog = async ({
  req,
  action,
  entityType,
  entityId = null,
  details = {},
}) => {
  try {
    if (!req?.user?._id) {
      return;
    }

    if (
      typeof action !== "string" ||
      !action.trim() ||
      action.length > 100
    ) {
      return;
    }

    if (
      typeof entityType !== "string" ||
      !entityType.trim() ||
      entityType.length > 100
    ) {
      return;
    }

    if (
      entityId !== null &&
      entityId !== undefined &&
      !/^[a-f\d]{24}$/i.test(
        String(entityId)
      )
    ) {
      return;
    }

    const safeDetails =
      details &&
      typeof details === "object" &&
      !Array.isArray(details)
        ? Object.fromEntries(
            Object.entries(details).slice(
              0,
              MAX_DETAILS_KEYS
            )
          )
        : {};

    await AuditLog.create({
      actorId: req.user._id,
      action: action.trim(),
      entityType: entityType.trim(),
      entityId: entityId || null,
      details: safeDetails,
      ipAddress: req.ip || "",
    });
  } catch (error) {
    console.error(
      "Audit log error:",
      error.message
    );
  }
};