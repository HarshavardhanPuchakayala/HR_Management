import express from "express";
import "dotenv/config";
import cors from "cors";
import redis from "./config/redis.js";
import { connectDB } from "./config/db.js";

import auth from "./routes/auth.js";
import employees from "./routes/employees.js";
import leaveRequestRoutes from "./routes/leaveRequests.js";
import attendanceRoutes from "./routes/attendance.js";

const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", auth);
app.use("/api/employees", employees);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/attendance", attendanceRoutes);

const startServer = async () => {
  try {
    await connectDB();

    await redis.ping();
    console.log("Redis connection verified");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();