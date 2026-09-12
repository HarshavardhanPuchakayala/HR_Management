import Employee from "../models/Employee.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Attendance from "../models/Attendance.js";
import PayrollRun from "../models/PayrollRun.js";
import PerformanceReview from "../models/PerformanceReview.js";

const getToday = () =>
  new Date().toISOString().slice(0, 10);

export const getDashboard = async (
  req,
  res
) => {
  try {
    const today = getToday();

    const [
      totalEmployees,
      activeEmployees,
      pendingLeaves,
      todayAttendance,
      payrollRuns,
      pendingReviews,
    ] = await Promise.all([
      Employee.countDocuments(),

      Employee.countDocuments({
        status: "active",
      }),

      LeaveRequest.countDocuments({
        status: "pending",
      }),

      Attendance.countDocuments({
        date: today,
      }),

      PayrollRun.countDocuments(),

      PerformanceReview.countDocuments({
        status: "submitted",
      }),
    ]);

    return res.status(200).json({
      totalEmployees,
      activeEmployees,
      pendingLeaves,
      todayAttendance,
      payrollRuns,
      pendingReviews,
    });
  } catch (error) {
    console.error(
      "Get dashboard error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch dashboard",
    });
  }
};