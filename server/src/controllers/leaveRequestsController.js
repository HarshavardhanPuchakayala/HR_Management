import LeaveRequest from "../models/LeaveRequest.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";

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
        message: "status must be either approved or rejected",
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
        message: "Only pending leave requests can be approved or rejected",
      });
    }

    // The requester is an Employee.
    const requester = await Employee.findById(leaveRequest.employeeId)
      .select("name email managerId status");

    if (!requester) {
      return res.status(404).json({
        message: "Requester employee not found",
      });
    }

    // The approver is a User, so resolve their linked Employee separately.
    const approver = await User.findById(req.user._id)
      .select("employeeId role");

    if (!approver) {
      return res.status(401).json({
        message: "Approver account not found",
      });
    }

    // Admins can override the normal manager relationship.
    if (approver.role !== "admin") {
      if (approver.role !== "manager") {
        return res.status(403).json({
          message: "Only managers or admins can approve leave requests",
        });
      }

      const approverEmployee = await Employee.findById(approver.employeeId)
        .select("_id status");

      if (!approverEmployee) {
        return res.status(404).json({
          message: "Approver employee record not found",
        });
      }

      if (approverEmployee.status !== "active") {
        return res.status(403).json({
          message: "Approver employee is inactive",
        });
      }

      if (!requester.managerId) {
        return res.status(403).json({
          message: "This employee does not have a manager assigned",
        });
      }

      // IMPORTANT:
      // requester.managerId is an Employee._id
      // approverEmployee._id is an Employee._id
      //
      // Compare their values, not the Mongoose ObjectId references.
      if (
        requester.managerId.toString() !==
        approverEmployee._id.toString()
      ) {
        return res.status(403).json({
          message: "You can only approve leave for your direct reports",
        });
      }
    }

    leaveRequest.status = status;

   leaveRequest.approvedBy = approver._id;
leaveRequest.approvedAt = new Date();

await leaveRequest.save();

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