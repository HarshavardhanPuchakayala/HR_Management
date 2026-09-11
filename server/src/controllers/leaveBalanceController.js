import mongoose from "mongoose";

import LeaveBalance from "../models/LeaveBalance.js";
import Employee from "../models/Employee.js";

const LEAVE_TYPES = [
  "sick",
  "casual",
  "vacation",
  "other",
];

const getCurrentYear = () => new Date().getUTCFullYear();

const parseYear = (value) => {
  if (value === undefined || value === null || value === "") {
    return getCurrentYear();
  }

  const year = Number(value);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return null;
  }

  return year;
};

const parseNonNegativeNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return number;
};

export const getMyLeaveBalances = async (req, res) => {
  try {
    const cycleYear = parseYear(req.query.year);

    if (cycleYear === null) {
      return res.status(400).json({
        message: "Invalid cycle year",
      });
    }

    const balances = await LeaveBalance.find({
      employeeId: req.user.employeeId,
      cycleYear,
    })
      .populate("employeeId", "name email")
      .sort({ leaveType: 1 });

    return res.json(balances);
  } catch (error) {
    console.error("Get my leave balances error:", error);

    return res.status(500).json({
      message: "Failed to fetch leave balances",
    });
  }
};

export const getEmployeeLeaveBalances = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (req.user.role === "manager") {
      const managerEmployee = await Employee.findById(
        req.user.employeeId
      );

      if (
        !managerEmployee ||
        managerEmployee.status !== "active"
      ) {
        return res.status(403).json({
          message: "Manager employee record not found or inactive",
        });
      }

      if (
        !employee.managerId ||
        employee.managerId.toString() !==
          managerEmployee._id.toString()
      ) {
        return res.status(403).json({
          message:
            "You can only view balances for your direct reports",
        });
      }
    }

    const cycleYear = parseYear(req.query.year);

    if (cycleYear === null) {
      return res.status(400).json({
        message: "Invalid cycle year",
      });
    }

    const balances = await LeaveBalance.find({
      employeeId,
      cycleYear,
    }).sort({ leaveType: 1 });

    return res.json(balances);
  } catch (error) {
    console.error(
      "Get employee leave balances error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch employee leave balances",
    });
  }
};

export const initializeLeaveBalances = async (req, res) => {
  try {
    const {
      employeeId,
      cycleYear,
      balances,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (!Array.isArray(balances) || balances.length === 0) {
      return res.status(400).json({
        message: "Balances are required",
      });
    }

    const year = parseYear(cycleYear);

    if (year === null) {
      return res.status(400).json({
        message: "Invalid cycle year",
      });
    }

    /*
     * Prevent duplicate leave types in the same request.
     *
     * Without this, two operations for "vacation", for example,
     * could be sent to bulkWrite and produce ambiguous results.
     */
    const seenLeaveTypes = new Set();

    const operations = [];

    for (const balance of balances) {
      if (!balance || !LEAVE_TYPES.includes(balance.leaveType)) {
        return res.status(400).json({
          message: `Invalid leave type: ${
            balance?.leaveType ?? "undefined"
          }`,
        });
      }

      if (seenLeaveTypes.has(balance.leaveType)) {
        return res.status(400).json({
          message: `Duplicate leave type: ${balance.leaveType}`,
        });
      }

      seenLeaveTypes.add(balance.leaveType);

      const totalAllotted = parseNonNegativeNumber(
        balance.totalAllotted
      );

      if (totalAllotted === null) {
        return res.status(400).json({
          message:
            "totalAllotted must be a non-negative number",
        });
      }

      const carriedOver =
        balance.carriedOver === undefined
          ? 0
          : parseNonNegativeNumber(balance.carriedOver);

      if (carriedOver === null) {
        return res.status(400).json({
          message:
            "carriedOver must be a non-negative number",
        });
      }

      operations.push({
        updateOne: {
          filter: {
            employeeId,
            leaveType: balance.leaveType,
            cycleYear: year,
          },

          /*
           * Initialization must NEVER reset `used`.
           *
           * If an employee already has approved leave,
           * re-running initialization must not erase it.
           */
          update: {
            $setOnInsert: {
              employeeId,
              leaveType: balance.leaveType,
              cycleYear: year,
              used: 0,
            },

            $set: {
              totalAllotted,
              carriedOver,
            },
          },

          upsert: true,
        },
      });
    }

    await LeaveBalance.bulkWrite(operations);

    const initializedBalances = await LeaveBalance.find({
      employeeId,
      cycleYear: year,
    }).sort({ leaveType: 1 });

    return res.status(200).json(initializedBalances);
  } catch (error) {
    console.error(
      "Initialize leave balances error:",
      error
    );

    return res.status(500).json({
      message: "Failed to initialize leave balances",
    });
  }
};

export const adjustLeaveBalance = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid leave balance ID",
      });
    }

    /*
     * `used` is intentionally not accepted here.
     *
     * Approved leave increments `used`.
     * Cancellation of approved leave decrements `used`.
     *
     * Allowing admins to arbitrarily modify `used` would
     * disconnect LeaveBalance from LeaveRequest history.
     */
    if (Object.prototype.hasOwnProperty.call(req.body, "used")) {
      return res.status(400).json({
        message:
          "The used balance cannot be manually adjusted. It is managed by leave approval and cancellation.",
      });
    }

    const balance = await LeaveBalance.findById(id);

    if (!balance) {
      return res.status(404).json({
        message: "Leave balance not found",
      });
    }

    const {
      totalAllotted,
      carriedOver,
    } = req.body;

    if (
      totalAllotted === undefined &&
      carriedOver === undefined
    ) {
      return res.status(400).json({
        message:
          "At least one of totalAllotted or carriedOver is required",
      });
    }

    const nextTotalAllotted =
      totalAllotted === undefined
        ? balance.totalAllotted
        : parseNonNegativeNumber(totalAllotted);

    if (nextTotalAllotted === null) {
      return res.status(400).json({
        message:
          "totalAllotted must be a non-negative number",
      });
    }

    const nextCarriedOver =
      carriedOver === undefined
        ? balance.carriedOver
        : parseNonNegativeNumber(carriedOver);

    if (nextCarriedOver === null) {
      return res.status(400).json({
        message:
          "carriedOver must be a non-negative number",
      });
    }

    /*
     * Existing approved leave cannot become greater than
     * the newly configured entitlement.
     */
    const maximumUsed =
      nextTotalAllotted + nextCarriedOver;

    if (balance.used > maximumUsed) {
      return res.status(400).json({
        message:
          "The new entitlement cannot be lower than leave already used",
        used: balance.used,
        maximumAllowedUsed: maximumUsed,
      });
    }

    balance.totalAllotted = nextTotalAllotted;
    balance.carriedOver = nextCarriedOver;

    await balance.save();

    return res.json({
      message: "Leave balance updated successfully",
      balance,
    });
  } catch (error) {
    console.error(
      "Adjust leave balance error:",
      error
    );

    return res.status(500).json({
      message: "Failed to update leave balance",
    });
  }
};