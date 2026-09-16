import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";


import connectDB from "./config/db.js";


import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employees.js";
import attendanceRoutes from "./routes/attendance.js";
import leaveRoutes from "./routes/leaveRequests.js";
import leaveBalanceRoutes from "./routes/leaveBalances.js";
import performanceReviewRoutes from "./routes/performanceReviewRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import onboardingRoutes from "./routes/onboardingRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";
dotenv.config();


const app = express();


app.disable("x-powered-by");


app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);


const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);


app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }


      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }


      return callback(
        new Error("CORS origin not allowed")
      );
    },
    credentials: true,
  })
);


app.use(
  express.json({
    limit: "1mb",
  })
);


app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);


app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});


app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/leave-balances", leaveBalanceRoutes);
app.use(
  "/api/performance-reviews",
  performanceReviewRoutes
);
app.use("/api/payroll", payrollRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/assistant", assistantRoutes);
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});


app.use((error, req, res, next) => {
  console.error("Unhandled error:", error.message);


  if (error.message === "CORS origin not allowed") {
    return res.status(403).json({
      message: "Origin not allowed",
    });
  }


  if (error.type === "entity.too.large") {
    return res.status(413).json({
      message: "Request body too large",
    });
  }


  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    error.type === "entity.parse.failed"
  ) {
    return res.status(400).json({
      message: "Invalid JSON payload",
    });
  }


  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
    });
  }


  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid request value",
    });
  }


  if (error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate record",
    });
  }


  return res.status(500).json({
    message: "Internal server error",
  });
});


const startServer = async () => {
  try {
    await connectDB();


    const PORT = Number(process.env.PORT) || 5000;


    app.listen(PORT, () => {
      console.log(
        `PeopleFlow backend running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );


    process.exit(1);
  }
};


startServer();
