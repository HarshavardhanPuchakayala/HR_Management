import mongoose from "mongoose";

import LeaveRequest from "../models/LeaveRequest.js";
import LeaveBalance from "../models/LeaveBalance.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { createAuditLog } from "../utils/auditLog.js";

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

const VALID_LEAVE_TYPES = [
  "sick",
  "casual",
  "vacation",
  "other",
];

const validId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const calculateLeaveDays = (
  startDate,
  endDate
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error("Invalid leave dates");
  }

  const startUtc = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );

  const endUtc = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  );

  const days =
    Math.floor(
      (endUtc - startUtc) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  if (days <= 0) {
    throw new Error(
      "End date cannot be before start date"
    );
  }

  return days;
};

// Creates a leave-related notification for a User.
// Never throws: a failed notification should never break
// the underlying leave-request flow.
const notifyUser = async ({
  recipientUserId,
  title,
  message,
  link = "",
  session,
}) => {
  if (!recipientUserId) return;

  try {
    await Notification.create(
      [
        {
          recipientId: recipientUserId,
          title,
          message,
          type: "leave",
          link,
        },
      ],
      session ? { session } : undefined
    );
  } catch (error) {
    console.error(
      "Failed to create notification:",
      error
    );
  }
};

const assertManagerCanActOnEmployee =
  async (
    req,
    employeeId,
    session
  ) => {
    if (req.user.role === "admin") {
      return;
    }

    if (req.user.role !== "manager") {
      throw new Error(
        "Only managers and administrators can make leave decisions"
      );
    }

    const reviewer =
      await Employee.findById(
        req.user.employeeId
      ).session(session);

    if (
      !reviewer ||
      reviewer.status !== "active"
    ) {
      throw new Error(
        "Manager account is inactive or invalid"
      );
    }

    const requester =
      await Employee.findById(
        employeeId
      ).session(session);

    if (!requester) {
      throw new Error(
        "Requesting employee not found"
      );
    }

    if (
      !requester.managerId ||
      !requester.managerId.equals(
        reviewer._id
      )
    ) {
      throw new Error(
        "You can only manage leave requests from your direct reports"
      );
    }
  };

export const createLeaveRequest =
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        leaveType,
        reason = "",
      } = req.body;

      if (
        !startDate ||
        !endDate ||
        !leaveType
      ) {
        return res.status(400).json({
          message:
            "startDate, endDate and leaveType are required",
        });
      }

      if (
        !VALID_LEAVE_TYPES.includes(
          leaveType
        )
      ) {
        return res.status(400).json({
          message: "Invalid leave type",
        });
      }

      if (
        typeof reason !== "string" ||
        reason.length > 2000
      ) {
        return res.status(400).json({
          message: "Invalid leave reason",
        });
      }

      const start = new Date(
        startDate
      );
      const end = new Date(endDate);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        return res.status(400).json({
          message:
            "Invalid startDate or endDate",
        });
      }

      if (start > end) {
        return res.status(400).json({
          message:
            "startDate cannot be after endDate",
        });
      }

      calculateLeaveDays(start, end);

      if (
        start.getUTCFullYear() !==
        end.getUTCFullYear()
      ) {
        return res.status(400).json({
          message:
            "Leave requests cannot span multiple calendar years",
        });
      }

      const employee =
        await Employee.findById(
          req.user.employeeId
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

      const leaveRequest =
        await LeaveRequest.create({
          employeeId: employee._id,
          startDate: start,
          endDate: end,
          leaveType,
          reason: reason.trim(),
          status: "pending",
        });

      // Notify the employee's manager that a new leave request is awaiting review.
      if (employee.managerId) {
        const managerUser =
          await User.findOne({
            employeeId:
              employee.managerId,
          });

        await notifyUser({
          recipientUserId:
            managerUser?._id,
          title: "New leave request",
          message: `${employee.name} requested ${leaveType} leave from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}.`,
          link: "/manager/team-leave",
        });
      }

      await createAuditLog({
        req,
        action: "LEAVE_REQUEST_CREATED",
        entityType: "LeaveRequest",
        entityId: leaveRequest._id,
      });

      return res.status(201).json(
        leaveRequest
      );
    } catch (error) {
      console.error(
        "Create leave request error:",
        error
      );

      if (
        error.name === "ValidationError"
      ) {
        return res.status(400).json({
          message:
            "Invalid leave request data",
        });
      }

      return res.status(500).json({
        message:
          "Failed to create leave request",
      });
    }
  };

export const getMyLeaveRequests =
  async (req, res) => {
    try {
      const { status } = req.query;

      const filter = {
        employeeId:
          req.user.employeeId,
      };

      if (status !== undefined) {
        if (
          !VALID_STATUSES.includes(
            status
          )
        ) {
          return res.status(400).json({
            message: `Invalid status. Allowed values: ${VALID_STATUSES.join(
              ", "
            )}`,
          });
        }

        filter.status = status;
      }

      const leaveRequests =
        await LeaveRequest.find(filter)
          .populate(
            "approvedBy",
            "email role"
          )
          .sort({ createdAt: -1 });

      return res.json(
        leaveRequests
      );
    } catch (error) {
      console.error(
        "Get my leave requests error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch leave requests",
      });
    }
  };

export const approveOrRejectLeaveRequest =
  async (req, res) => {
    let session;

    try {
      const { leaveRequestId } =
        req.params;
      const { status } = req.body;

      if (!validId(leaveRequestId)) {
        return res.status(400).json({
          message:
            "Invalid leave request ID",
        });
      }

      if (
        !["approved", "rejected"].includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Status must be approved or rejected",
        });
      }

      if (
        !["admin", "manager"].includes(
          req.user.role
        )
      ) {
        return res.status(403).json({
          message:
            "Only managers and administrators can make leave decisions",
        });
      }

      const reviewerId =
        req.user._id.toString();

      const allowed =
        await leaveDecisionLimiter.check(
          reviewerId
        );

      if (!allowed) {
        return res.status(429).json({
          message:
            "Too many leave decision attempts. Please try again later.",
        });
      }

      session =
        await mongoose.startSession();

      let updatedLeaveRequest;

      await session.withTransaction(
        async () => {
          const leaveRequest =
            await LeaveRequest.findOne({
              _id: leaveRequestId,
              status: "pending",
            }).session(session);

          if (!leaveRequest) {
            throw new Error(
              "Leave request not found or has already been resolved"
            );
          }

          const requester =
            await Employee.findById(
              leaveRequest.employeeId
            ).session(session);

          if (!requester) {
            throw new Error(
              "Requesting employee not found"
            );
          }

          await assertManagerCanActOnEmployee(
            req,
            requester._id,
            session
          );

          if (status === "approved") {
            const leaveDays =
              calculateLeaveDays(
                leaveRequest.startDate,
                leaveRequest.endDate
              );

            const cycleYear =
              leaveRequest.startDate.getUTCFullYear();

            const balance =
              await LeaveBalance.findOne({
                employeeId:
                  leaveRequest.employeeId,
                leaveType:
                  leaveRequest.leaveType,
                cycleYear,
              }).session(session);

            if (!balance) {
              throw new Error(
                "Leave balance has not been initialized for this employee and leave type"
              );
            }

            const available =
              balance.totalAllotted +
              balance.carriedOver -
              balance.used;

            if (available < leaveDays) {
              throw new Error(
                `Insufficient leave balance. Available: ${available}, requested: ${leaveDays}`
              );
            }

            balance.used += leaveDays;

            await balance.save({
              session,
            });
          }

          leaveRequest.status =
            status;
          leaveRequest.approvedBy =
            req.user._id;
          leaveRequest.approvedAt =
            new Date();

          await leaveRequest.save({
            session,
          });

          // Notify the employee who made the request of the decision.
          const requesterUser =
            await User.findOne({
              employeeId: requester._id,
            }).session(session);

          await notifyUser({
            recipientUserId:
              requesterUser?._id,
            title: `Leave request ${status}`,
            message: `Your ${leaveRequest.leaveType} leave from ${leaveRequest.startDate.toLocaleDateString()} to ${leaveRequest.endDate.toLocaleDateString()} was ${status}.`,
            link: "/leave/my",
            session,
          });

          updatedLeaveRequest =
            leaveRequest.toObject();
        }
      );

      await leaveDecisionLimiter.record(
        reviewerId
      );

      await createAuditLog({
        req,
        action:
          status === "approved"
            ? "LEAVE_REQUEST_APPROVED"
            : "LEAVE_REQUEST_REJECTED",
        entityType: "LeaveRequest",
        entityId:
          updatedLeaveRequest._id,
      });

      return res.json({
        message: `Leave request ${status} successfully`,
        leaveRequest:
          updatedLeaveRequest,
      });
    } catch (error) {
      console.error(
        "Approve/reject leave request error:",
        error
      );

      if (
        error.message ===
        "Leave request not found or has already been resolved"
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "Requesting employee not found"
      ) {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message ===
          "Manager account is inactive or invalid" ||
        error.message ===
          "You can only manage leave requests from your direct reports" ||
        error.message ===
          "Only managers and administrators can make leave decisions"
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      if (
        error.message.startsWith(
          "Leave balance has not been initialized"
        ) ||
        error.message.startsWith(
          "Insufficient leave balance"
        )
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message:
          "Failed to update leave request",
      });
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  };

export const cancelLeaveRequest =
  async (req, res) => {
    let session;

    try {
      const { leaveRequestId } =
        req.params;

      if (!validId(leaveRequestId)) {
        return res.status(400).json({
          message:
            "Invalid leave request ID",
        });
      }

      const employeeId =
        req.user.employeeId;

      const allowed =
        await leaveDecisionLimiter.check(
          req.user._id.toString()
        );

      if (!allowed) {
        return res.status(429).json({
          message:
            "Too many leave cancellation attempts. Please try again later.",
        });
      }

      session =
        await mongoose.startSession();

      let cancelledLeaveRequest;

      await session.withTransaction(
        async () => {
          const leaveRequest =
            await LeaveRequest.findOne({
              _id: leaveRequestId,
              employeeId,
              status: {
                $in: [
                  "pending",
                  "approved",
                ],
              },
            }).session(session);

          if (!leaveRequest) {
            throw new Error(
              "Leave request not found or cannot be cancelled"
            );
          }

          if (
            leaveRequest.status ===
            "approved"
          ) {
            const leaveDays =
              calculateLeaveDays(
                leaveRequest.startDate,
                leaveRequest.endDate
              );

            const cycleYear =
              leaveRequest.startDate.getUTCFullYear();

            const balance =
              await LeaveBalance.findOne({
                employeeId:
                  leaveRequest.employeeId,
                leaveType:
                  leaveRequest.leaveType,
                cycleYear,
              }).session(session);

            if (!balance) {
              throw new Error(
                "Leave balance not found for the approved leave"
              );
            }

            if (
              balance.used <
              leaveDays
            ) {
              throw new Error(
                "Leave balance is inconsistent and cannot be restored safely"
              );
            }

            balance.used -= leaveDays;

            await balance.save({
              session,
            });
          }

          leaveRequest.status =
            "cancelled";

          await leaveRequest.save({
            session,
          });

          // If it had already been approved, let the approver know it was cancelled.
          if (leaveRequest.approvedBy) {
            await notifyUser({
              recipientUserId:
                leaveRequest.approvedBy,
              title:
                "Approved leave cancelled",
              message: `An approved ${leaveRequest.leaveType} leave (${leaveRequest.startDate.toLocaleDateString()} - ${leaveRequest.endDate.toLocaleDateString()}) was cancelled by the employee.`,
              link: "/leave",
              session,
            });
          }

          cancelledLeaveRequest =
            leaveRequest.toObject();
        }
      );

      await leaveDecisionLimiter.record(
        req.user._id.toString()
      );

      await createAuditLog({
        req,
        action: "LEAVE_REQUEST_CANCELLED",
        entityType: "LeaveRequest",
        entityId:
          cancelledLeaveRequest._id,
      });

      return res.json({
        message:
          "Leave request cancelled successfully",
        leaveRequest:
          cancelledLeaveRequest,
      });
    } catch (error) {
      console.error(
        "Cancel leave request error:",
        error
      );

      if (
        error.message ===
          "Leave request not found or cannot be cancelled" ||
        error.message ===
          "Leave balance not found for the approved leave" ||
        error.message ===
          "Leave balance is inconsistent and cannot be restored safely"
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message:
          "Failed to cancel leave request",
      });
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  };

export const getAllLeaveRequests =
  async (req, res) => {
    try {
      const { status } = req.query;

      const filter = {};

      if (status !== undefined) {
        if (
          !VALID_STATUSES.includes(
            status
          )
        ) {
          return res.status(400).json({
            message: `Invalid status. Allowed values: ${VALID_STATUSES.join(
              ", "
            )}`,
          });
        }

        filter.status = status;
      }

      const leaveRequests =
        await LeaveRequest.find(filter)
          .populate(
            "employeeId",
            "name email jobTitle department managerId"
          )
          .populate(
            "approvedBy",
            "email role"
          )
          .sort({ createdAt: -1 });

      return res.json(
        leaveRequests
      );
    } catch (error) {
      console.error(
        "Get all leave requests error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch leave requests",
      });
    }
  };

export const getTeamLeaveRequests =
  async (req, res) => {
    try {
      const approver =
        await User.findById(
          req.user._id
        ).select(
          "employeeId role"
        );

      if (!approver) {
        return res.status(401).json({
          message:
            "User account not found",
        });
      }

      if (approver.role !== "manager") {
        return res.status(403).json({
          message:
            "Only managers can view team leave requests",
        });
      }

      const approverEmployee =
        await Employee.findById(
          approver.employeeId
        ).select("_id status");

      if (!approverEmployee) {
        return res.status(404).json({
          message:
            "Manager employee record not found",
        });
      }

      if (
        approverEmployee.status !==
        "active"
      ) {
        return res.status(403).json({
          message:
            "Manager employee is inactive",
        });
      }

      const teamEmployees =
        await Employee.find({
          managerId:
            approverEmployee._id,
        }).select("_id");

      const teamEmployeeIds =
        teamEmployees.map(
          (employee) =>
            employee._id
        );

      const leaveRequests =
        await LeaveRequest.find({
          employeeId: {
            $in: teamEmployeeIds,
          },
        })
          .populate(
            "employeeId",
            "name email jobTitle department"
          )
          .populate(
            "approvedBy",
            "email role"
          )
          .sort({ createdAt: -1 });

      return res.json(
        leaveRequests
      );
    } catch (error) {
      console.error(
        "Get team leave requests error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch team leave requests",
      });
    }
  };