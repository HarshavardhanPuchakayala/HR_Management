import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";

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

const getTomorrow = () => {
  const today = getToday();

  return new Date(today.getTime() + 24 * 60 * 60 * 1000);
};

export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const today = getToday();

    const employee = await Employee.findById(employeeId);

    if (!employee || employee.status !== "active") {
      return res.status(400).json({
        message: "Active employee record not found",
      });
    }

    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (existingAttendance) {
      return res.status(409).json({
        message: "Already checked in for today",
        attendance: existingAttendance,
      });
    }

    const attendance = await Attendance.create({
      employeeId,
      date: today,
      checkIn: new Date(),
      checkOut: null,
      status: "present",
    });

    res.status(201).json(attendance);
  } catch (error) {
    // Protect against a race condition where two check-in
    // requests arrive at nearly the same time.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Already checked in for today",
      });
    }

    res.status(500).json({
      message: "Failed to check in",
      error: error.message,
    });
  }
};

export const checkOut = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const today = getToday();

    const attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (!attendance) {
      return res.status(400).json({
        message: "Cannot check out before checking in",
      });
    }

    if (!attendance.checkIn) {
      return res.status(400).json({
        message: "Cannot check out before checking in",
      });
    }

    if (attendance.checkOut) {
      return res.status(409).json({
        message: "Already checked out for today",
        attendance,
      });
    }

    attendance.checkOut = new Date();

    await attendance.save();

    res.json(attendance);
  } catch (error) {
    res.status(500).json({
      message: "Failed to check out",
      error: error.message,
    });
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      employeeId: req.user.employeeId,
    }).sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};

export const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const targetEmployee = await Employee.findById(employeeId)
      .select("_id name email jobTitle department managerId status");

    if (!targetEmployee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const requestingUser = await User.findById(req.user._id)
      .select("employeeId role");

    if (!requestingUser) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    if (requestingUser.role === "admin") {
      // Admins can view any employee's attendance.
    } else if (requestingUser.role === "manager") {
      const managerEmployee = await Employee.findById(
        requestingUser.employeeId
      ).select("_id status");

      if (!managerEmployee) {
        return res.status(404).json({
          message: "Manager employee record not found",
        });
      }

      if (managerEmployee.status !== "active") {
        return res.status(403).json({
          message: "Manager employee is inactive",
        });
      }

      if (
        !targetEmployee.managerId ||
        targetEmployee.managerId.toString() !==
          managerEmployee._id.toString()
      ) {
        return res.status(403).json({
          message: "You can only view attendance for your direct reports",
        });
      }
    } else {
      return res.status(403).json({
        message: "Insufficient permissions",
      });
    }

    const attendance = await Attendance.find({
      employeeId: targetEmployee._id,
    }).sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch employee attendance",
      error: error.message,
    });
  }
};

export const getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            message: "Invalid startDate",
          });
        }

        filter.date.$gte = new Date(
          Date.UTC(
            start.getUTCFullYear(),
            start.getUTCMonth(),
            start.getUTCDate()
          )
        );
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            message: "Invalid endDate",
          });
        }

        const normalizedEnd = new Date(
          Date.UTC(
            end.getUTCFullYear(),
            end.getUTCMonth(),
            end.getUTCDate()
          )
        );

        // Exclusive upper bound so the entire end date is included.
        filter.date.$lt = new Date(
          normalizedEnd.getTime() + 24 * 60 * 60 * 1000
        );
      }

      if (
        filter.date.$gte &&
        filter.date.$lt &&
        filter.date.$gte >= filter.date.$lt
      ) {
        return res.status(400).json({
          message: "startDate cannot be after endDate",
        });
      }
    }

    const attendance = await Attendance.find(filter)
      .populate(
        "employeeId",
        "name email jobTitle department managerId"
      )
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};