import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const parsePositiveInteger = (
  value,
  fallback,
  max
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number < 1
  ) {
    return null;
  }

  return Math.min(number, max);
};

export const getAuditLogs = async (
  req,
  res
) => {
  try {
    const {
      action,
      entityType,
      actorId,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (action !== undefined) {
      if (
        typeof action !== "string" ||
        action.trim().length > 100
      ) {
        return res.status(400).json({
          message: "Invalid action",
        });
      }

      filter.action = action.trim();
    }

    if (entityType !== undefined) {
      if (
        typeof entityType !== "string" ||
        entityType.trim().length > 100
      ) {
        return res.status(400).json({
          message: "Invalid entity type",
        });
      }

      filter.entityType =
        entityType.trim();
    }

    if (actorId !== undefined) {
      if (!isValidObjectId(actorId)) {
        return res.status(400).json({
          message: "Invalid actor ID",
        });
      }

      filter.actorId = actorId;
    }

    const pageNumber =
      parsePositiveInteger(
        page,
        1,
        1000000
      );

    const limitNumber =
      parsePositiveInteger(
        limit,
        50,
        100
      );

    if (
      pageNumber === null ||
      limitNumber === null
    ) {
      return res.status(400).json({
        message:
          "Page and limit must be positive integers",
      });
    }

    const [logs, total] =
      await Promise.all([
        AuditLog.find(filter)
          .populate(
            "actorId",
            "email role"
          )
          .sort({ createdAt: -1 })
          .skip(
            (pageNumber - 1) *
              limitNumber
          )
          .limit(limitNumber)
          .lean(),

        AuditLog.countDocuments(filter),
      ]);

    return res.status(200).json({
      logs,
      total,
      page: pageNumber,
      limit: limitNumber,
      pages: Math.ceil(
        total / limitNumber
      ),
    });
  } catch (error) {
    console.error(
      "Get audit logs error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch audit logs",
    });
  }
};