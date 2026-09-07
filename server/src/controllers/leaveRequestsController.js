import LeaveRequest from "../models/LeaveRequest.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const leaveDecisionLimiter = createRateLimiter({
  keyPrefix: "leave-decision",
  maxAttempts: 60,
  windowSeconds: 900,
});

const VALID_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
];

export const createLeaveRequest = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      leaveType,
      reason,
    } = req.body;

    if (!startDate || !endDate || !leaveType) {
      return res.status(400).json({
        message: "startDate, endDate and leaveType are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid startDate or endDate",
      });
    }

    if (start > end) {
      return res.status(400).json({
        message: "startDate cannot be after endDate",
      });
    }

    const employee = await Employee.findById(req.user.employeeId);

    if (!employee || employee.status !== "active") {
      return res.status(400).json({
        message: "Active employee record not found",
      });
    }

    const leaveRequest = await LeaveRequest.create({
      employeeId: employee._id,
      startDate: start,
      endDate: end,
      leaveType,
      reason,
      status: "pending",
    });

    res.status(201).json(leaveRequest);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create leave request",
      error: error.message,
    });
  }
};

export const getMyLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({
      employeeId: req.user.employeeId,
    })
      .populate("approvedBy", "email role")
      .sort({ createdAt: -1 });

    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch leave requests",
      error: error.message,
    });
  }
};

export const approveOrRejectLeaveRequest = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const reviewerId = req.user._id.toString();

    const allowed = await leaveDecisionLimiter.check(reviewerId);

    if (!allowed) {
      return res.status(429).json({
        message: "Too many leave decision attempts. Please try again later.",
      });
    }

    const leaveRequest = await LeaveRequest.findById(leaveRequestId);

    if (!leaveRequest) {
      return res.status(404).json({
        message: "Leave request not found",
      });
    }

    if (leaveRequest.status !== "pending") {
      return res.status(400).json({
        message: "Leave request has already been resolved",
      });
    }

    const requester = await Employee.findById(leaveRequest.employeeId);

    if (!requester) {
      return res.status(404).json({
        message: "Requesting employee not found",
      });
    }

    if (req.user.role === "manager") {
      const reviewer = await Employee.findById(req.user.employeeId);

      if (!reviewer || reviewer.status !== "active") {
        return res.status(403).json({
          message: "Manager account is inactive or invalid",
        });
      }

      if (
        !requester.managerId ||
        requester.managerId.toString() !== reviewer._id.toString()
      ) {
        return res.status(403).json({
          message: "You can only manage leave requests from your direct reports",
        });
      }
    }

    leaveRequest.status = status;
    leaveRequest.approvedBy = req.user._id;
    leaveRequest.approvedAt = new Date();

    await leaveRequest.save();

    await leaveDecisionLimiter.record(reviewerId);

    res.json({
      message: `Leave request ${status} successfully`,
      leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update leave request",
      error: error.message,
    });
  }
};

export const getAllLeaveRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed values: ${VALID_STATUSES.join(", ")}`,
        });
      }

      filter.status = status;
    }

    const leaveRequests = await LeaveRequest.find(filter)
      .populate("employeeId", "name email jobTitle department managerId")
      .populate("approvedBy", "email role")
      .sort({ createdAt: -1 });

    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch leave requests",
      error: error.message,
    });
  }
};

export const getTeamLeaveRequests = async (req, res) => {
  try {
    const approver = await User.findById(req.user._id)
      .select("employeeId role");

    if (!approver) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    if (approver.role !== "manager") {
      return res.status(403).json({
        message: "Only managers can view team leave requests",
      });
    }

    const approverEmployee = await Employee.findById(approver.employeeId)
      .select("_id status");

    if (!approverEmployee) {
      return res.status(404).json({
        message: "Manager employee record not found",
      });
    }

    if (approverEmployee.status !== "active") {
      return res.status(403).json({
        message: "Manager employee is inactive",
      });
    }

    // Relationship is derived from Employee.managerId.
    const teamEmployees = await Employee.find({
      managerId: approverEmployee._id,
    }).select("_id");

    const teamEmployeeIds = teamEmployees.map(
      (employee) => employee._id
    );

    const leaveRequests = await LeaveRequest.find({
      employeeId: { $in: teamEmployeeIds },
    })
      .populate("employeeId", "name email jobTitle department")
      .populate("approvedBy", "email role")
      .sort({ createdAt: -1 });

    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch team leave requests",
      error: error.message,
    });
  }
};