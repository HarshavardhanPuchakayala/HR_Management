import mongoose from "mongoose";

import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import { createAuditLog } from "../utils/auditLog.js";

const validId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const getToday = () => {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
};

const normalizeDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
};

const getTomorrow = (date) =>
  new Date(
    date.getTime() +
      24 * 60 * 60 * 1000
  );

export const checkIn = async (
  req,
  res
) => {
  try {
    const employeeId =
      req.user.employeeId;

    const today = getToday();

    const employee =
      await Employee.findById(
        employeeId
      );

    if (
      !employee ||
      employee.status !== "active"
    ) {
      return res.status(400).json({
        message:
          "Active employee record not found",
      });
    }

    const existingAttendance =
      await Attendance.findOne({
        employeeId,
        date: today,
      });

    if (existingAttendance) {
      return res.status(409).json({
        message:
          "Already checked in for today",
        attendance:
          existingAttendance,
      });
    }

    const attendance =
      await Attendance.create({
        employeeId,
        date: today,
        checkIn: new Date(),
        checkOut: null,
        status: "present",
      });

    await createAuditLog({
      req,
      action: "ATTENDANCE_CHECK_IN",
      entityType: "Attendance",
      entityId: attendance._id,
    });

    return res.status(201).json(
      attendance
    );
  } catch (error) {
    console.error(
      "Check in error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Already checked in for today",
      });
    }

    if (
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        message:
          "Invalid attendance data",
      });
    }

    return res.status(500).json({
      message: "Failed to check in",
    });
  }
};

export const checkOut = async (
  req,
  res
) => {
  try {
    const employeeId =
      req.user.employeeId;

    const today = getToday();

    const attendance =
      await Attendance.findOne({
        employeeId,
        date: today,
      });

    if (
      !attendance ||
      !attendance.checkIn
    ) {
      return res.status(400).json({
        message:
          "Cannot check out before checking in",
      });
    }

    if (attendance.checkOut) {
      return res.status(409).json({
        message:
          "Already checked out for today",
        attendance,
      });
    }

    const checkOutTime = new Date();

    if (
      checkOutTime <=
      attendance.checkIn
    ) {
      return res.status(400).json({
        message:
          "Check-out time must be after check-in time",
      });
    }

    attendance.checkOut =
      checkOutTime;

    await attendance.save();

    await createAuditLog({
      req,
      action: "ATTENDANCE_CHECK_OUT",
      entityType: "Attendance",
      entityId: attendance._id,
    });

    return res.json(attendance);
  } catch (error) {
    console.error(
      "Check out error:",
      error
    );

    if (
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        message:
          "Invalid attendance data",
      });
    }

    return res.status(500).json({
      message: "Failed to check out",
    });
  }
};

export const getMyAttendance = async (
  req,
  res
) => {
  try {
    const attendance =
      await Attendance.find({
        employeeId:
          req.user.employeeId,
      }).sort({ date: -1 });

    return res.json(attendance);
  } catch (error) {
    console.error(
      "Get my attendance error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch attendance",
    });
  }
};

export const getEmployeeAttendance =
  async (req, res) => {
    try {
      const { employeeId } =
        req.params;

      if (!validId(employeeId)) {
        return res.status(400).json({
          message:
            "Invalid employee ID",
        });
      }

      const targetEmployee =
        await Employee.findById(
          employeeId
        ).select(
          "_id name email jobTitle department managerId status"
        );

      if (!targetEmployee) {
        return res.status(404).json({
          message:
            "Employee not found",
        });
      }

      const requestingUser =
        await User.findById(
          req.user._id
        ).select(
          "employeeId role"
        );

      if (!requestingUser) {
        return res.status(401).json({
          message:
            "User account not found",
        });
      }

      if (
        requestingUser.role ===
        "admin"
      ) {
        // Admin can view any employee.
      } else if (
        requestingUser.role ===
        "manager"
      ) {
        const managerEmployee =
          await Employee.findById(
            requestingUser.employeeId
          ).select(
            "_id status"
          );

        if (!managerEmployee) {
          return res.status(404).json({
            message:
              "Manager employee record not found",
          });
        }

        if (
          managerEmployee.status !==
          "active"
        ) {
          return res.status(403).json({
            message:
              "Manager employee is inactive",
          });
        }

        if (
          !targetEmployee.managerId ||
          targetEmployee.managerId.toString() !==
            managerEmployee._id.toString()
        ) {
          return res.status(403).json({
            message:
              "You can only view attendance for your direct reports",
          });
        }
      } else {
        return res.status(403).json({
          message:
            "Insufficient permissions",
        });
      }

      const attendance =
        await Attendance.find({
          employeeId:
            targetEmployee._id,
        }).sort({ date: -1 });

      return res.json(attendance);
    } catch (error) {
      console.error(
        "Get employee attendance error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch employee attendance",
      });
    }
  };

export const getAllAttendance = async (
  req,
  res
) => {
  try {
    const {
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    if (
      startDate !== undefined ||
      endDate !== undefined
    ) {
      filter.date = {};

      if (startDate) {
        const start =
          normalizeDate(startDate);

        if (!start) {
          return res.status(400).json({
            message:
              "Invalid startDate",
          });
        }

        filter.date.$gte = start;
      }

      if (endDate) {
        const end =
          normalizeDate(endDate);

        if (!end) {
          return res.status(400).json({
            message:
              "Invalid endDate",
          });
        }

        filter.date.$lt =
          getTomorrow(end);
      }

      if (
        filter.date.$gte &&
        filter.date.$lt &&
        filter.date.$gte >=
          filter.date.$lt
      ) {
        return res.status(400).json({
          message:
            "startDate cannot be after endDate",
        });
      }
    }

    const attendance =
      await Attendance.find(filter)
        .populate(
          "employeeId",
          "name email jobTitle department managerId"
        )
        .sort({ date: -1 });

    return res.json(attendance);
  } catch (error) {
    console.error(
      "Get all attendance error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch attendance",
    });
  }
};