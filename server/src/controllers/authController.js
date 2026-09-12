import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { createAuditLog } from "../utils/auditLog.js";

const ROLES = [
  "admin",
  "manager",
  "employee",
];

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured"
    );
  }

  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
      algorithm: "HS256",
    }
  );
};

const normalizeEmail = (email) =>
  String(email).trim().toLowerCase();

const isValidEmail = (email) =>
  email.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const loginIpLimiter = createRateLimiter({
  keyPrefix: "login:ip",
  maxAttempts: 20,
  windowSeconds: 900,
});

const loginEmailLimiter = createRateLimiter({
  keyPrefix: "login:email",
  maxAttempts: 5,
  windowSeconds: 900,
});

const createUserLimiter = createRateLimiter({
  keyPrefix: "create-user",
  maxAttempts: 10,
  windowSeconds: 3600,
});

export const createUserAccount = async (
  req,
  res
) => {
  try {
    const {
      employeeId,
      email,
      password,
      role,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(
        employeeId
      )
    ) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    if (
      typeof email !== "string" ||
      !isValidEmail(
        normalizeEmail(email)
      )
    ) {
      return res.status(400).json({
        message: "Invalid email",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        message:
          "Password must be between 8 and 128 characters",
      });
    }

    if (!ROLES.includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const allowed =
      await createUserLimiter.check(
        req.user._id.toString()
      );

    if (!allowed) {
      return res.status(429).json({
        message:
          "Too many user accounts created. Please try again later.",
      });
    }

    const normalizedEmail =
      normalizeEmail(email);

    const employee =
      await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const existingUser =
      await User.findOne({
        $or: [
          { employeeId },
          { email: normalizedEmail },
        ],
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "User account already exists",
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const user = await User.create({
      employeeId,
      email: normalizedEmail,
      passwordHash,
      role,
    });

    await createUserLimiter.record(
      req.user._id.toString()
    );

    await createAuditLog({
      req,
      action: "USER_ACCOUNT_CREATED",
      entityType: "User",
      entityId: user._id,
    });

    return res.status(201).json({
      message:
        "User account created successfully",
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Create user account error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "User account already exists",
      });
    }

    if (
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        message:
          "Invalid user account data",
      });
    }

    return res.status(500).json({
      message:
        "Failed to create user account",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } =
      req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      normalizeEmail(email);

    if (
      !isValidEmail(normalizedEmail) ||
      password.length > 128
    ) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const ip = req.ip || "unknown";

    const [
      ipAllowed,
      emailAllowed,
    ] = await Promise.all([
      loginIpLimiter.check(ip),
      loginEmailLimiter.check(
        normalizedEmail
      ),
    ]);

    if (!ipAllowed || !emailAllowed) {
      return res.status(429).json({
        message:
          "Too many login attempts. Please try again later.",
      });
    }

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    const isMatch =
      user &&
      (await bcrypt.compare(
        password,
        user.passwordHash
      ));

    if (!user || !isMatch) {
      await Promise.all([
        loginIpLimiter.record(ip),
        loginEmailLimiter.record(
          normalizedEmail
        ),
      ]);

      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const token = generateToken(
      user._id
    );

    await createAuditLog({
      req: {
        ...req,
        user,
      },
      action: "LOGIN",
      entityType: "User",
      entityId: user._id,
    });

    return res.json({
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message: "Login failed",
    });
  }
};

export const getMe = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(req.user._id)
        .select(
          "_id employeeId email role createdAt updatedAt"
        )
        .populate(
          "employeeId",
          "name email phone jobTitle department managerId status"
        );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json(user);
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch current user",
    });
  }
};