import mongoose from "mongoose";
import PerformanceReview from "../models/PerformanceReview.js";
import ReviewCycle from "../models/ReviewCycle.js";
import Employee from "../models/Employee.js";

const validateObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const assertManagerCanReview = async (
  managerEmployeeId,
  employeeId
) => {
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new Error("Employee not found");
  }

  if (
    !employee.managerId ||
    employee.managerId.toString() !==
      managerEmployeeId.toString()
  ) {
    throw new Error(
      "You can only review your direct reports"
    );
  }

  return employee;
};

const validateText = (
  value,
  field,
  maxLength
) => {
  if (typeof value !== "string") {
    return `${field} must be a string`;
  }

  if (value.length > maxLength) {
    return `${field} is too long`;
  }

  return null;
};

export const createReviewCycle = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only administrators can create review cycles",
      });
    }

    const {
      name,
      startDate,
      endDate,
    } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        message:
          "name, startDate, and endDate are required",
      });
    }

    if (typeof name !== "string") {
      return res.status(400).json({
        message: "name must be a string",
      });
    }

    const trimmedName = name.trim();

    if (
      !trimmedName ||
      trimmedName.length > 150
    ) {
      return res.status(400).json({
        message:
          "name must be between 1 and 150 characters",
      });
    }

    const start = new Date(startDate);
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
          "End date cannot be before start date",
      });
    }

    const cycle = await ReviewCycle.create({
      name: trimmedName,
      startDate: start,
      endDate: end,
      createdBy: req.user._id,
    });

    return res.status(201).json(cycle);
  } catch (error) {
    console.error(
      "Create review cycle error:",
      error
    );

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid review cycle data",
      });
    }

    return res.status(500).json({
      message: "Failed to create review cycle",
    });
  }
};

export const getReviewCycles = async (
  req,
  res
) => {
  try {
    const cycles = await ReviewCycle.find()
      .populate("createdBy", "email role")
      .sort({ startDate: -1 });

    return res.json(cycles);
  } catch (error) {
    console.error(
      "Get review cycles error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch review cycles",
    });
  }
};

export const createPerformanceReview = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        message:
          "Only managers can create performance reviews",
      });
    }

    const {
      cycleId,
      employeeId,
    } = req.body;

    if (
      !validateObjectId(cycleId) ||
      !validateObjectId(employeeId)
    ) {
      return res.status(400).json({
        message:
          "Invalid cycle ID or employee ID",
      });
    }

    const cycle =
      await ReviewCycle.findById(cycleId);

    if (!cycle) {
      return res.status(404).json({
        message: "Review cycle not found",
      });
    }

    if (cycle.status !== "active") {
      return res.status(400).json({
        message:
          "Reviews can only be created for active cycles",
      });
    }

    const managerEmployee =
      await Employee.findById(
        req.user.employeeId
      );

    if (
      !managerEmployee ||
      managerEmployee.status !== "active"
    ) {
      return res.status(403).json({
        message:
          "Manager employee record not found or inactive",
      });
    }

    let employee;

    try {
      employee =
        await assertManagerCanReview(
          managerEmployee._id,
          employeeId
        );
    } catch (error) {
      if (
        error.message ===
        "Employee not found"
      ) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      if (
        error.message ===
        "You can only review your direct reports"
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      throw error;
    }

    if (employee.status !== "active") {
      return res.status(400).json({
        message:
          "Only active employees can be reviewed",
      });
    }

    const existingReview =
      await PerformanceReview.findOne({
        cycleId,
        employeeId,
      });

    if (existingReview) {
      return res.status(409).json({
        message:
          "A performance review already exists for this employee in this cycle",
      });
    }

    const review =
      await PerformanceReview.create({
        cycleId,
        employeeId,
        reviewerId: req.user._id,
      });

    return res.status(201).json(review);
  } catch (error) {
    console.error(
      "Create performance review error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "A performance review already exists for this employee in this cycle",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid performance review data",
      });
    }

    return res.status(500).json({
      message:
        "Failed to create performance review",
    });
  }
};

export const getMyPerformanceReviews = async (
  req,
  res
) => {
  try {
    const reviews =
      await PerformanceReview.find({
        employeeId: req.user.employeeId,
      })
        .populate(
          "cycleId",
          "name startDate endDate status"
        )
        .populate(
          "reviewerId",
          "email role"
        )
        .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (error) {
    console.error(
      "Get my performance reviews error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch your performance reviews",
    });
  }
};

export const getTeamPerformanceReviews = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        message:
          "Only managers can view team performance reviews",
      });
    }

    const managerEmployeeId =
      req.user.employeeId;

    const managerEmployee =
      await Employee.findById(
        managerEmployeeId
      );

    if (
      !managerEmployee ||
      managerEmployee.status !== "active"
    ) {
      return res.status(403).json({
        message:
          "Manager employee record not found or inactive",
      });
    }

    const team = await Employee.find({
      managerId: managerEmployeeId,
    }).select("_id");

    const employeeIds = team.map(
      (employee) => employee._id
    );

    const reviews =
      await PerformanceReview.find({
        employeeId: {
          $in: employeeIds,
        },
      })
        .populate(
          "employeeId",
          "name email jobTitle department"
        )
        .populate(
          "cycleId",
          "name startDate endDate status"
        )
        .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (error) {
    console.error(
      "Get team performance reviews error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch team performance reviews",
    });
  }
};

export const updatePerformanceReview = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        message: "Invalid review ID",
      });
    }

    const review =
      await PerformanceReview.findById(id);

    if (!review) {
      return res.status(404).json({
        message: "Performance review not found",
      });
    }

    if (req.user.role === "manager") {
      if (
        review.reviewerId.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          message:
            "You can only update reviews assigned to you",
        });
      }

      if (review.status !== "draft") {
        return res.status(400).json({
          message:
            "Only draft reviews can be updated by the manager",
        });
      }

      const cycle =
        await ReviewCycle.findById(
          review.cycleId
        );

      if (!cycle) {
        return res.status(404).json({
          message: "Review cycle not found",
        });
      }

      if (cycle.status !== "active") {
        return res.status(400).json({
          message:
            "Reviews can only be edited while the cycle is active",
        });
      }

      const {
        rating,
        strengths,
        areasForImprovement,
        goals,
      } = req.body;

      if (rating !== undefined) {
        const numericRating = Number(rating);

        if (
          !Number.isFinite(numericRating) ||
          numericRating < 1 ||
          numericRating > 5
        ) {
          return res.status(400).json({
            message:
              "Rating must be between 1 and 5",
          });
        }

        review.rating = numericRating;
      }

      const textFields = [
        ["strengths", strengths, 3000],
        [
          "areasForImprovement",
          areasForImprovement,
          3000,
        ],
        ["goals", goals, 3000],
      ];

      for (const [
        field,
        value,
        maxLength,
      ] of textFields) {
        if (value !== undefined) {
          const validationError =
            validateText(
              value,
              field,
              maxLength
            );

          if (validationError) {
            return res.status(400).json({
              message: validationError,
            });
          }

          review[field] = value.trim();
        }
      }
    } else if (req.user.role === "employee") {
      if (
        review.employeeId.toString() !==
        req.user.employeeId.toString()
      ) {
        return res.status(403).json({
          message:
            "You can only update your own reviews",
        });
      }

      if (review.status !== "submitted") {
        return res.status(400).json({
          message:
            "Only submitted reviews can be acknowledged",
        });
      }

      if (
        req.body.employeeComments !==
        undefined
      ) {
        const validationError =
          validateText(
            req.body.employeeComments,
            "employeeComments",
            3000
          );

        if (validationError) {
          return res.status(400).json({
            message: validationError,
          });
        }

        review.employeeComments =
          req.body.employeeComments.trim();
      }

      review.status = "acknowledged";
      review.acknowledgedAt = new Date();
    } else {
      return res.status(403).json({
        message: "Insufficient permissions",
      });
    }

    await review.save();

    return res.json(review);
  } catch (error) {
    console.error(
      "Update performance review error:",
      error
    );

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message:
          "Invalid performance review data",
      });
    }

    return res.status(500).json({
      message:
        "Failed to update performance review",
    });
  }
};

export const submitPerformanceReview = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        message:
          "Only managers can submit performance reviews",
      });
    }

    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        message: "Invalid review ID",
      });
    }

    const review =
      await PerformanceReview.findById(id);

    if (!review) {
      return res.status(404).json({
        message: "Performance review not found",
      });
    }

    if (
      review.reviewerId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "You can only submit reviews assigned to you",
      });
    }

    if (review.status !== "draft") {
      return res.status(400).json({
        message:
          "Only draft reviews can be submitted",
      });
    }

    const cycle =
      await ReviewCycle.findById(
        review.cycleId
      );

    if (!cycle) {
      return res.status(404).json({
        message: "Review cycle not found",
      });
    }

    if (cycle.status !== "active") {
      return res.status(400).json({
        message:
          "Reviews can only be submitted while the cycle is active",
      });
    }

    if (
      review.rating === null ||
      review.rating === undefined
    ) {
      return res.status(400).json({
        message:
          "Rating is required before submission",
      });
    }

    review.status = "submitted";
    review.submittedAt = new Date();

    await review.save();

    return res.json(review);
  } catch (error) {
    console.error(
      "Submit performance review error:",
      error
    );

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message:
          "Invalid performance review data",
      });
    }

    return res.status(500).json({
      message:
        "Failed to submit performance review",
    });
  }
};

export const getAllPerformanceReviews = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only administrators can view all performance reviews",
      });
    }

    const reviews =
      await PerformanceReview.find()
        .populate(
          "employeeId",
          "name email jobTitle department"
        )
        .populate(
          "reviewerId",
          "email role"
        )
        .populate(
          "cycleId",
          "name startDate endDate status"
        )
        .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (error) {
    console.error(
      "Get all performance reviews error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch performance reviews",
    });
  }
};

export const activateReviewCycle = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only administrators can activate review cycles",
      });
    }

    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        message: "Invalid review cycle ID",
      });
    }

    const cycle =
      await ReviewCycle.findById(id);

    if (!cycle) {
      return res.status(404).json({
        message: "Review cycle not found",
      });
    }

    if (cycle.status !== "draft") {
      return res.status(400).json({
        message:
          "Only draft review cycles can be activated",
      });
    }

    cycle.status = "active";

    await cycle.save();

    return res.json(cycle);
  } catch (error) {
    console.error(
      "Activate review cycle error:",
      error
    );

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid review cycle data",
      });
    }

    return res.status(500).json({
      message: "Failed to activate review cycle",
    });
  }
};

export const completeReviewCycle = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only administrators can complete review cycles",
      });
    }

    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        message: "Invalid review cycle ID",
      });
    }

    const cycle =
      await ReviewCycle.findById(id);

    if (!cycle) {
      return res.status(404).json({
        message: "Review cycle not found",
      });
    }

    if (cycle.status !== "active") {
      return res.status(400).json({
        message:
          "Only active review cycles can be completed",
      });
    }

    cycle.status = "completed";

    await cycle.save();

    return res.json(cycle);
  } catch (error) {
    console.error(
      "Complete review cycle error:",
      error
    );

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid review cycle data",
      });
    }

    return res.status(500).json({
      message: "Failed to complete review cycle",
    });
  }
};