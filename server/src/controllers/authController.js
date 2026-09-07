
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Login rate limits
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

// Admin account-creation rate limit
const createUserLimiter = createRateLimiter({
  keyPrefix: "create-user",
  maxAttempts: 10,
  windowSeconds: 3600,
});

// Admin creates an account for an existing employee
export const createUserAccount = async (req, res) => {
  try {
    const { employeeId, email, password, role } = req.body;

    if (!employeeId || !email || !password || !role) {
      return res.status(400).json({
        message: "employeeId, email, password and role are required",
      });
    }

    // Rate limit by authenticated admin.
    const allowed = await createUserLimiter.check(
      req.user._id.toString()
    );

    if (!allowed) {
      return res.status(429).json({
        message:
          "Too many user accounts created. Please try again later.",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ employeeId }, { email: email.toLowerCase() }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User account already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      employeeId,
      email: email.toLowerCase(),
      passwordHash,
      role,
    });

    // Record only after the database write succeeds.
    await createUserLimiter.record(
      req.user._id.toString()
    );

    res.status(201).json({
      message: "User account created successfully",
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create user account",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase();
    const ip = req.ip;

    // Check both limits without incrementing either counter.
    const [ipAllowed, emailAllowed] = await Promise.all([
      loginIpLimiter.check(ip),
      loginEmailLimiter.check(normalizedEmail),
    ]);

    if (!ipAllowed || !emailAllowed) {
      return res.status(429).json({
        message:
          "Too many login attempts. Please try again later.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    const isMatch =
      user &&
      (await bcrypt.compare(password, user.passwordHash));

    if (!user || !isMatch) {
      // Record only failed login attempts.
      await Promise.all([
        loginIpLimiter.record(ip),
        loginEmailLimiter.record(normalizedEmail),
      ]);

      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Successful login does not increment either counter.
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-passwordHash")
      .populate("employeeId");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch current user",
      error: error.message,
    });
  }
};