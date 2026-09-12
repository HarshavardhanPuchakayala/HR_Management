import mongoose from "mongoose";

import Employee from "../models/Employee.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import {
  getCachedDirectory,
  setCachedDirectory,
  invalidateDirectoryCache,
} from "../utils/employeeCache.js";
import { createAuditLog } from "../utils/auditLog.js";

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const wouldCreateCycle = async (employeeId, managerId) => {
  if (employeeId.toString() === managerId.toString()) return true;

  const visited = new Set();
  let currentId = managerId;

  while (currentId) {
    const currentIdString = currentId.toString();

    if (visited.has(currentIdString)) return true;

    visited.add(currentIdString);

    if (currentIdString === employeeId.toString()) return true;

    const manager = await Employee.findById(currentId)
      .select("managerId");

    if (!manager) return false;

    currentId = manager.managerId;
  }

  return false;
};

const createEmployeeLimiter = createRateLimiter({
  keyPrefix: "create-employee",
  maxAttempts: 30,
  windowSeconds: 3600,
});

export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      jobTitle,
      department,
      managerId,
    } = req.body;

    if (!name || !email || !jobTitle || !department) {
      return res.status(400).json({
        message:
          "name, email, jobTitle and department are required",
      });
    }

    if (
      managerId !== undefined &&
      managerId !== null &&
      !isValidObjectId(managerId)
    ) {
      return res.status(400).json({
        message: "Invalid manager ID",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    if (!normalizedEmail || normalizedEmail.length > 254) {
      return res.status(400).json({
        message: "Invalid email",
      });
    }

    const adminId = req.user._id.toString();
    const allowed = await createEmployeeLimiter.check(adminId);

    if (!allowed) {
      return res.status(429).json({
        message:
          "Too many employee creation attempts. Please try again later.",
      });
    }

    if (managerId) {
      const manager = await Employee.findById(managerId);

      if (!manager || manager.status !== "active") {
        return res.status(400).json({
          message: "Invalid manager",
        });
      }
    }

    const existingEmployee = await Employee.findOne({
      email: normalizedEmail,
    });

    if (existingEmployee) {
      return res.status(409).json({
        message: "Employee with this email already exists",
      });
    }

    const employee = await Employee.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone,
      jobTitle: String(jobTitle).trim(),
      department: String(department).trim(),
      managerId: managerId || null,
      status: "active",
    });

    await createEmployeeLimiter.record(adminId);
    await invalidateDirectoryCache();

    await createAuditLog({
      req,
      action: "CREATE",
      entityType: "Employee",
      entityId: employee._id,
    });

    return res.status(201).json(employee);
  } catch (error) {
    console.error("Create employee error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid employee data",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Employee with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to create employee",
    });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!isValidObjectId(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const { managerId } = req.body;

    if (
      managerId !== undefined &&
      managerId !== null &&
      !isValidObjectId(managerId)
    ) {
      return res.status(400).json({
        message: "Invalid manager ID",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (managerId !== undefined && managerId !== null) {
      const manager = await Employee.findById(managerId);

      if (!manager || manager.status !== "active") {
        return res.status(400).json({
          message: "Invalid manager",
        });
      }

      if (await wouldCreateCycle(employeeId, managerId)) {
        return res.status(400).json({
          message:
            "Invalid manager assignment: would create a reporting cycle",
        });
      }
    }

    if (req.body.email !== undefined) {
      const normalizedEmail = String(req.body.email)
        .trim()
        .toLowerCase();

      if (!normalizedEmail || normalizedEmail.length > 254) {
        return res.status(400).json({
          message: "Invalid email",
        });
      }

      const existingEmployee = await Employee.findOne({
        email: normalizedEmail,
        _id: { $ne: employeeId },
      });

      if (existingEmployee) {
        return res.status(409).json({
          message: "Employee with this email already exists",
        });
      }

      req.body.email = normalizedEmail;
    }

    const allowedFields = [
      "name",
      "email",
      "phone",
      "jobTitle",
      "department",
      "managerId",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        employee[field] =
          field === "email"
            ? req.body[field].toLowerCase()
            : req.body[field];
      }
    }

    await employee.save();
    await invalidateDirectoryCache();

    await createAuditLog({
      req,
      action: "UPDATE",
      entityType: "Employee",
      entityId: employee._id,
    });

    return res.json(employee);
  } catch (error) {
    console.error("Update employee error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid employee data",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Employee with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to update employee",
    });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!isValidObjectId(employeeId)) {
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

    employee.status = "inactive";

    await employee.save();
    await invalidateDirectoryCache();

    await createAuditLog({
      req,
      action: "DEACTIVATE",
      entityType: "Employee",
      entityId: employee._id,
    });

    return res.json({
      message: "Employee deactivated successfully",
      employee,
    });
  } catch (error) {
    console.error("Deactivate employee error:", error);

    return res.status(500).json({
      message: "Failed to deactivate employee",
    });
  }
};

export const getEmployees = async (req, res) => {
  try {
    let employees = await getCachedDirectory();

    if (employees) {
      console.log("Employee directory: CACHE HIT");
    } else {
      console.log("Employee directory: CACHE MISS");

      employees = await Employee.find({})
        .populate("managerId", "name email jobTitle")
        .sort({ name: 1 });

      await setCachedDirectory(employees);
    }

    const filtered = req.query.department
      ? employees.filter(
          (employee) =>
            employee.department === req.query.department
        )
      : employees;

    return res.json(filtered);
  } catch (error) {
    console.error("Get employees error:", error);

    return res.status(500).json({
      message: "Failed to fetch employees",
    });
  }
};

export const getEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!isValidObjectId(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(employeeId)
      .populate(
        "managerId",
        "name email jobTitle department"
      );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    return res.json(employee);
  } catch (error) {
    console.error("Get employee error:", error);

    return res.status(500).json({
      message: "Failed to fetch employee",
    });
  }
};

export const getDirectReports = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!isValidObjectId(employeeId)) {
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

    const reports = await Employee.find({
      managerId: employeeId,
    }).sort({ name: 1 });

    return res.json(reports);
  } catch (error) {
    console.error("Get direct reports error:", error);

    return res.status(500).json({
      message: "Failed to fetch direct reports",
    });
  }
};