import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
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
  if (employeeId.toString() === managerId.toString()) {
    return true;
  }

  const visited = new Set();
  let currentId = managerId;

  while (currentId) {
    const currentIdString = currentId.toString();

    if (visited.has(currentIdString)) {
      return true;
    }

    visited.add(currentIdString);

    if (currentIdString === employeeId.toString()) {
      return true;
    }

    const manager = await Employee.findById(currentId)
      .select("managerId");

    if (!manager) {
      return false;
    }

    currentId = manager.managerId;
  }

  return false;
};

const createEmployeeLimiter = createRateLimiter({
  keyPrefix: "create-employee",
  maxAttempts: 30,
  windowSeconds: 3600,
});

/*
 * Remove sensitive fields before sending employee data
 * to the frontend.
 */
const sanitizeEmployee = (employee) => {
  const object =
    typeof employee.toObject === "function"
      ? employee.toObject()
      : employee;

  delete object.password;

  return object;
};

export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      jobTitle,
      department,
      managerId,
      password,
    } = req.body;

    /*
     * Validate required employee information.
     */
    if (
      !name ||
      !email ||
      !jobTitle ||
      !department ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Name, email, job title, department and password are required.",
      });
    }

    /*
     * Validate password.
     */
    if (typeof password !== "string") {
      return res.status(400).json({
        message: "Password must be a valid string.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long.",
      });
    }

    /*
     * Validate manager ID when supplied.
     */
    if (
      managerId &&
      !isValidObjectId(managerId)
    ) {
      return res.status(400).json({
        message: "Invalid manager.",
      });
    }

    /*
     * Normalize email.
     */
    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    /*
     * Rate limit employee creation.
     */
    const rateLimitKey =
      req.user?._id?.toString() ||
      req.ip ||
      "unknown";

    const rateLimitAllowed =
      await createEmployeeLimiter.check(
        rateLimitKey
      );

    if (!rateLimitAllowed) {
      return res.status(429).json({
        message:
          "Too many employee creation attempts. Please try again later.",
      });
    }

    /*
     * Check whether an employee already exists.
     */
    const existingEmployee =
      await Employee.findOne({
        email: normalizedEmail,
      });

    if (existingEmployee) {
      return res.status(409).json({
        message:
          "An employee with this email already exists.",
      });
    }

    /*
     * Also check User collection.
     *
     * This is important because login accounts
     * are stored separately from Employee records.
     */
    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "A login account with this email already exists.",
      });
    }

    /*
     * Validate manager.
     */
    if (managerId) {
      const manager =
        await Employee.findById(managerId);

      if (!manager) {
        return res.status(400).json({
          message: "Manager not found.",
        });
      }

      if (manager.status !== "active") {
        return res.status(400).json({
          message:
            "The selected manager is inactive.",
        });
      }
    }

    /*
     * Hash the login password.
     *
     * IMPORTANT:
     * The plain password is never stored in MongoDB.
     */
    const passwordHash =
      await bcrypt.hash(password, 12);

    /*
     * Create Employee first.
     */
    const employee =
      await Employee.create({
        name: String(name).trim(),
        email: normalizedEmail,
        phone: phone
          ? String(phone).trim()
          : "",
        jobTitle: String(jobTitle).trim(),
        department: String(department).trim(),
        managerId: managerId || null,
        status: "active",
      });

    try {
      /*
       * Create the actual login account.
       */
      await User.create({
        employeeId: employee._id,
        email: normalizedEmail,
        passwordHash,
        role: "employee",
      });
    } catch (userError) {
      /*
       * If User creation fails, remove the Employee
       * so we don't leave an employee without login.
       */
      await Employee.findByIdAndDelete(
        employee._id
      );

      throw userError;
    }

    /*
     * Record rate-limit attempt.
     */
    await createEmployeeLimiter.record(
      rateLimitKey
    );

    /*
     * Clear employee directory cache.
     */
    await invalidateDirectoryCache();

    /*
     * Audit log.
     */
    await createAuditLog({
      req,
      action: "CREATE",
      entityType: "Employee",
      entityId: employee._id,
      details: {
        name: employee.name,
        email: employee.email,
      },
    });

    return res.status(201).json({
      message:
        "Employee and login account created successfully.",
      employee,
    });
  } catch (error) {
    console.error(
      "Create employee error:",
      error
    );

    /*
     * Handle duplicate MongoDB keys.
     */
    if (error?.code === 11000) {
      return res.status(409).json({
        message:
          "An employee or login account with this email already exists.",
      });
    }

    return res.status(500).json({
      message:
        "Failed to create employee.",
    });
  }
};

/*
 * UPDATE EMPLOYEE
 */
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

    /*
     * Validate manager.
     */
    if (managerId !== undefined && managerId !== null) {
      const manager = await Employee.findById(managerId);

      if (!manager || manager.status !== "active") {
        return res.status(400).json({
          message: "Invalid manager",
        });
      }

      if (
        await wouldCreateCycle(
          employeeId,
          managerId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid manager assignment: would create a reporting cycle",
        });
      }
    }

    /*
     * Validate email.
     */
    if (req.body.email !== undefined) {
      const normalizedEmail = String(req.body.email)
        .trim()
        .toLowerCase();

      if (!normalizedEmail || normalizedEmail.length > 254) {
        return res.status(400).json({
          message: "Invalid email",
        });
      }

      const existingEmployee =
        await Employee.findOne({
          email: normalizedEmail,
          _id: { $ne: employeeId },
        });

      if (existingEmployee) {
        return res.status(409).json({
          message:
            "Employee with this email already exists",
        });
      }

      req.body.email = normalizedEmail;
    }

    /*
     * Only these fields can be changed through the
     * normal employee update endpoint.
     *
     * Password is intentionally NOT included.
     */
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

    return res.json(
      sanitizeEmployee(employee)
    );
  } catch (error) {
    console.error("Update employee error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid employee data",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Employee with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to update employee",
    });
  }
};

/*
 * DEACTIVATE EMPLOYEE
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!isValidObjectId(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(
      employeeId
    );

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
      message:
        "Employee deactivated successfully",

      employee: sanitizeEmployee(employee),
    });
  } catch (error) {
    console.error(
      "Deactivate employee error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to deactivate employee",
    });
  }
};

/*
 * GET ALL EMPLOYEES
 */
export const getEmployees = async (req, res) => {
  try {
    let employees = await getCachedDirectory();

    if (employees) {
      console.log(
        "Employee directory: CACHE HIT"
      );
    } else {
      console.log(
        "Employee directory: CACHE MISS"
      );

      employees = await Employee.find({})
        .select("-password")
        .populate(
          "managerId",
          "name email jobTitle"
        )
        .sort({ name: 1 });

      await setCachedDirectory(employees);
    }

    const filtered = req.query.department
      ? employees.filter(
          (employee) =>
            employee.department ===
            req.query.department
        )
      : employees;

    return res.json(filtered);
  } catch (error) {
    console.error(
      "Get employees error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch employees",
    });
  }
};

/*
 * GET SINGLE EMPLOYEE
 */
export const getEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!isValidObjectId(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(
      employeeId
    )
      .select("-password")
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
    console.error(
      "Get employee error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch employee",
    });
  }
};

/*
 * GET DIRECT REPORTS
 */
export const getDirectReports = async (
  req,
  res
) => {
  try {
    const { employeeId } = req.params;

    if (!isValidObjectId(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(
      employeeId
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const reports = await Employee.find({
      managerId: employeeId,
    })
      .select("-password")
      .sort({ name: 1 });

    return res.json(reports);
  } catch (error) {
    console.error(
      "Get direct reports error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch direct reports",
    });
  }
};

/*
 * EMPLOYEE VIEWS THEIR OWN PROFILE
 */
export const getMyProfile = async (
  req,
  res
) => {
  try {
    const employee = await Employee.findById(
      req.user.employeeId
    ).populate(
      "managerId",
      "name email jobTitle department"
    );

    if (!employee) {
      return res.status(404).json({
        message:
          "Employee record not found",
      });
    }

    return res.json(
      sanitizeEmployee(employee)
    );
  } catch (error) {
    console.error(
      "Get my profile error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch your profile",
    });
  }
};

/*
 * EMPLOYEE UPDATES THEIR OWN PROFILE
 *
 * Intentionally narrow: only self-editable fields
 * (currently just phone) are allowed here. Name, email,
 * jobTitle, department, and managerId stay admin-only
 * (via updateEmployee) since they're directory/org-chart
 * integrity fields, not personal details.
 */
export const updateMyProfile = async (
  req,
  res
) => {
  try {
    const employee = await Employee.findById(
      req.user.employeeId
    );

    if (!employee) {
      return res.status(404).json({
        message:
          "Employee record not found",
      });
    }

    const { phone } = req.body;

    if (phone === undefined) {
      return res.status(400).json({
        message:
          "No editable fields were provided",
      });
    }

    if (
      typeof phone !== "string" ||
      phone.length > 30
    ) {
      return res.status(400).json({
        message: "Invalid phone number",
      });
    }

    employee.phone = phone.trim();

    await employee.save();

    await invalidateDirectoryCache();

    await createAuditLog({
      req,
      action: "UPDATE_PROFILE",
      entityType: "Employee",
      entityId: employee._id,
    });

    return res.json(
      sanitizeEmployee(employee)
    );
  } catch (error) {
    console.error(
      "Update my profile error:",
      error
    );

    if (
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        message: "Invalid profile data",
      });
    }

    return res.status(500).json({
      message:
        "Failed to update your profile",
    });
  }
};