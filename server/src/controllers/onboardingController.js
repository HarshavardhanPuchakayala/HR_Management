import mongoose from "mongoose";

import OnboardingTemplate from "../models/OnboardingTemplate.js";
import OnboardingTask from "../models/OnboardingTask.js";
import Offboarding from "../models/Offboarding.js";
import Employee from "../models/Employee.js";

const validId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const TASK_STATUSES = [
  "pending",
  "in_progress",
  "completed",
];

const OFFBOARDING_STATUSES = [
  "initiated",
  "in_progress",
  "completed",
];

const validateDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date;
};

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

export const createTemplate = async (
  req,
  res
) => {
  try {
    const {
      name,
      description = "",
      tasks = [],
    } = req.body;

    const nameError = validateText(
      name,
      "name",
      150,
      true
    );

    if (nameError) {
      return res.status(400).json({
        message: nameError,
      });
    }

    const descriptionError = validateText(
      description,
      "description",
      1000
    );

    if (descriptionError) {
      return res.status(400).json({
        message: descriptionError,
      });
    }

    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        message: "tasks must be an array",
      });
    }

    if (tasks.length > 100) {
      return res.status(400).json({
        message: "Too many onboarding tasks",
      });
    }

    const normalizedTasks = [];

    for (const task of tasks) {
      if (!task || typeof task !== "object") {
        return res.status(400).json({
          message: "Invalid onboarding task",
        });
      }

      const titleError = validateText(
        task.title,
        "task title",
        200,
        true
      );

      if (titleError) {
        return res.status(400).json({
          message: titleError,
        });
      }

      const taskDescription =
        task.description ?? "";

      const descriptionError =
        validateText(
          taskDescription,
          "task description",
          1000
        );

      if (descriptionError) {
        return res.status(400).json({
          message: descriptionError,
        });
      }

      const dueDays =
        task.dueDays === undefined
          ? 7
          : Number(task.dueDays);

      if (
        !Number.isInteger(dueDays) ||
        dueDays < 0 ||
        dueDays > 3650
      ) {
        return res.status(400).json({
          message:
            "dueDays must be a whole number between 0 and 3650",
        });
      }

      normalizedTasks.push({
        title: task.title.trim(),
        description: taskDescription.trim(),
        dueDays,
      });
    }

    const template =
      await OnboardingTemplate.create({
        name: name.trim(),
        description: description.trim(),
        tasks: normalizedTasks,
        createdBy: req.user._id,
      });

    return res.status(201).json(template);
  } catch (error) {
    console.error(
      "Create onboarding template error:",
      error
    );

    if (
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        message: "Invalid onboarding template data",
      });
    }

    return res.status(500).json({
      message:
        "Failed to create onboarding template",
    });
  }
};

export const getTemplates = async (
  req,
  res
) => {
  try {
    const templates =
      await OnboardingTemplate.find()
        .populate(
          "createdBy",
          "email role"
        )
        .sort({ createdAt: -1 });

    return res.json(templates);
  } catch (error) {
    console.error(
      "Get onboarding templates error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch onboarding templates",
    });
  }
};

export const createOnboarding = async (
  req,
  res
) => {
  try {
    const {
      employeeId,
      templateId,
    } = req.body;

    if (!validId(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    if (!validId(templateId)) {
      return res.status(400).json({
        message: "Invalid template ID",
      });
    }

    const employee =
      await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (employee.status !== "active") {
      return res.status(400).json({
        message:
          "Onboarding can only be created for active employees",
      });
    }

    const template =
      await OnboardingTemplate.findById(
        templateId
      );

    if (
      !template ||
      template.status !== "active"
    ) {
      return res.status(404).json({
        message: "Active template not found",
      });
    }

    await OnboardingTask.deleteMany({
      employeeId,
      status: "pending",
    });

    const now = new Date();

    const tasks = template.tasks.map(
      (task) => {
        const dueDate = new Date(now);

        dueDate.setDate(
          dueDate.getDate() +
            Number(task.dueDays || 0)
        );

        return {
          employeeId,
          title: task.title,
          description: task.description,
          dueDate,
        };
      }
    );

    const created =
      tasks.length > 0
        ? await OnboardingTask.insertMany(
            tasks
          )
        : [];

    return res.status(201).json({
      employee,
      tasks: created,
    });
  } catch (error) {
    console.error(
      "Create onboarding error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create onboarding",
    });
  }
};

export const getEmployeeOnboarding =
  async (req, res) => {
    try {
      const { employeeId } =
        req.params;

      if (!validId(employeeId)) {
        return res.status(400).json({
          message: "Invalid employee ID",
        });
      }

      const employee =
        await Employee.findById(
          employeeId
        );

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      const tasks =
        await OnboardingTask.find({
          employeeId,
        })
          .populate(
            "employeeId",
            "name email department jobTitle"
          )
          .populate(
            "assignedTo",
            "email role"
          )
          .sort({
            dueDate: 1,
            createdAt: 1,
          });

      return res.json(tasks);
    } catch (error) {
      console.error(
        "Get employee onboarding error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch employee onboarding",
      });
    }
  };

export const getMyOnboardingTasks =
  async (req, res) => {
    try {
      const tasks =
        await OnboardingTask.find({
          employeeId:
            req.user.employeeId,
        })
          .populate(
            "assignedTo",
            "email role"
          )
          .sort({ dueDate: 1 });

      return res.json(tasks);
    } catch (error) {
      console.error(
        "Get my onboarding tasks error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch your onboarding tasks",
      });
    }
  };

export const updateOnboardingTask =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!validId(id)) {
        return res.status(400).json({
          message: "Invalid task ID",
        });
      }

      const task =
        await OnboardingTask.findById(id);

      if (!task) {
        return res.status(404).json({
          message:
            "Onboarding task not found",
        });
      }

      const isAdmin =
        req.user.role === "admin";

      const isManager =
        req.user.role === "manager";

      const isOwner =
        String(task.employeeId) ===
        String(req.user.employeeId);

      if (!isAdmin && !isManager && !isOwner) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      if (isManager && !isAdmin) {
        const employee =
          await Employee.findById(
            task.employeeId
          ).select("managerId");

        if (
          !employee ||
          !employee.managerId ||
          String(employee.managerId) !==
            String(req.user.employeeId)
        ) {
          return res.status(403).json({
            message:
              "You can only manage tasks for your direct reports",
          });
        }
      }

      const {
        status,
        notes,
        assignedTo,
        dueDate,
      } = req.body;

      if (status !== undefined) {
        if (
          !TASK_STATUSES.includes(status)
        ) {
          return res.status(400).json({
            message:
              "Invalid task status",
          });
        }

        task.status = status;

        if (status === "completed") {
          task.completedAt = new Date();
        } else {
          task.completedAt = null;
        }
      }

      if (notes !== undefined) {
        const notesError = validateText(
          notes,
          "notes",
          2000
        );

        if (notesError) {
          return res.status(400).json({
            message: notesError,
          });
        }

        task.notes = notes.trim();
      }

      if (dueDate !== undefined) {
        if (dueDate === null || dueDate === "") {
          task.dueDate = null;
        } else {
          const parsedDate =
            validateDate(dueDate);

          if (!parsedDate) {
            return res.status(400).json({
              message:
                "Invalid due date",
            });
          }

          task.dueDate = parsedDate;
        }
      }

      if (
        (isAdmin || isManager) &&
        assignedTo !== undefined
      ) {
        if (
          assignedTo !== null &&
          !validId(assignedTo)
        ) {
          return res.status(400).json({
            message:
              "Invalid assignee ID",
          });
        }

        task.assignedTo = assignedTo;
      }

      await task.save();

      return res.json(task);
    } catch (error) {
      console.error(
        "Update onboarding task error:",
        error
      );

      if (
        error.name === "ValidationError"
      ) {
        return res.status(400).json({
          message:
            "Invalid onboarding task data",
        });
      }

      return res.status(500).json({
        message:
          "Failed to update onboarding task",
      });
    }
  };

export const createOffboarding =
  async (req, res) => {
    try {
      const {
        employeeId,
        exitDate,
        reason = "",
        notes = "",
      } = req.body;

      if (!validId(employeeId)) {
        return res.status(400).json({
          message: "Invalid employee ID",
        });
      }

      if (!exitDate) {
        return res.status(400).json({
          message:
            "Exit date is required",
        });
      }

      const parsedExitDate =
        validateDate(exitDate);

      if (!parsedExitDate) {
        return res.status(400).json({
          message: "Invalid exit date",
        });
      }

      const reasonError = validateText(
        reason,
        "reason",
        1000
      );

      if (reasonError) {
        return res.status(400).json({
          message: reasonError,
        });
      }

      const notesError = validateText(
        notes,
        "notes",
        3000
      );

      if (notesError) {
        return res.status(400).json({
          message: notesError,
        });
      }

      const employee =
        await Employee.findById(
          employeeId
        );

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      const existing =
        await Offboarding.findOne({
          employeeId,
        });

      if (existing) {
        return res.status(409).json({
          message:
            "Offboarding already exists for this employee",
        });
      }

      const record =
        await Offboarding.create({
          employeeId,
          exitDate: parsedExitDate,
          reason: reason.trim(),
          notes: notes.trim(),
          initiatedBy: req.user._id,
        });

      await record.populate(
        "employeeId",
        "name email department jobTitle status"
      );

      return res.status(201).json(record);
    } catch (error) {
      console.error(
        "Create offboarding error:",
        error
      );

      if (error.code === 11000) {
        return res.status(409).json({
          message:
            "Offboarding already exists for this employee",
        });
      }

      if (
        error.name === "ValidationError"
      ) {
        return res.status(400).json({
          message:
            "Invalid offboarding data",
        });
      }

      return res.status(500).json({
        message:
          "Failed to create offboarding",
      });
    }
  };

export const getOffboardingRecords =
  async (req, res) => {
    try {
      const records =
        await Offboarding.find()
          .populate(
            "employeeId",
            "name email department jobTitle status"
          )
          .populate(
            "initiatedBy",
            "email role"
          )
          .sort({
            exitDate: 1,
            createdAt: -1,
          });

      return res.json(records);
    } catch (error) {
      console.error(
        "Get offboarding records error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch offboarding records",
      });
    }
  };

export const updateOffboarding =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!validId(id)) {
        return res.status(400).json({
          message:
            "Invalid offboarding ID",
        });
      }

      const record =
        await Offboarding.findById(id);

      if (!record) {
        return res.status(404).json({
          message:
            "Offboarding record not found",
        });
      }

      const {
        exitDate,
        reason,
        notes,
        status,
      } = req.body;

      if (exitDate !== undefined) {
        const parsedExitDate =
          validateDate(exitDate);

        if (!parsedExitDate) {
          return res.status(400).json({
            message:
              "Invalid exit date",
          });
        }

        record.exitDate =
          parsedExitDate;
      }

      if (reason !== undefined) {
        const reasonError =
          validateText(
            reason,
            "reason",
            1000
          );

        if (reasonError) {
          return res.status(400).json({
            message: reasonError,
          });
        }

        record.reason = reason.trim();
      }

      if (notes !== undefined) {
        const notesError =
          validateText(
            notes,
            "notes",
            3000
          );

        if (notesError) {
          return res.status(400).json({
            message: notesError,
          });
        }

        record.notes = notes.trim();
      }

      if (status !== undefined) {
        if (
          !OFFBOARDING_STATUSES.includes(
            status
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid offboarding status",
          });
        }

        record.status = status;

        if (status === "completed") {
          record.completedAt =
            new Date();

          await Employee.findByIdAndUpdate(
            record.employeeId,
            {
              status: "inactive",
            }
          );
        } else {
          record.completedAt = null;
        }
      }

      await record.save();

      await record.populate(
        "employeeId",
        "name email department jobTitle status"
      );

      return res.json(record);
    } catch (error) {
      console.error(
        "Update offboarding error:",
        error
      );

      if (
        error.name === "ValidationError"
      ) {
        return res.status(400).json({
          message:
            "Invalid offboarding data",
        });
      }

      return res.status(500).json({
        message:
          "Failed to update offboarding",
      });
    }
  };