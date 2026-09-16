import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";


export const protect = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;


    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }


    const token =
      authHeader.slice(7).trim();


    if (
      !token ||
      token.length > 4096
    ) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }


    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message:
          "Server authentication configuration error",
      });
    }


    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );


    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.userId ||
      !mongoose.Types.ObjectId.isValid(
        decoded.userId
      )
    ) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }


    const user =
      await User.findById(
        decoded.userId
      )
        .select(
          "_id employeeId email role"
        )
        .lean();


    if (!user) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }


    req.user = user;


    return next();
  } catch {
    return res.status(401).json({
      message:
        "Authentication required",
    });
  }
};


export const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }


    if (
      !Array.isArray(allowedRoles) ||
      allowedRoles.length === 0 ||
      !allowedRoles.includes(req.user.role)
    ) {
      return res.status(403).json({
        message:
          "Insufficient permissions",
      });
    }


    return next();
  };
