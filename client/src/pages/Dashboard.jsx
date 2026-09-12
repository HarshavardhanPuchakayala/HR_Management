import { useEffect, useState } from "react";
import { getDashboard } from "../api/dashboard.js";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h1>HR Dashboard</h1>

      <div>
        <h3>Total Employees</h3>
        <p>{data.totalEmployees}</p>
      </div>

      <div>
        <h3>Active Employees</h3>
        <p>{data.activeEmployees}</p>
      </div>

      <div>
        <h3>Pending Leave Requests</h3>
        <p>{data.pendingLeaves}</p>
      </div>

      <div>
        <h3>Today's Attendance</h3>
        <p>{data.todayAttendance}</p>
      </div>

      <div>
        <h3>Payroll Runs</h3>
        <p>{data.payrollRuns}</p>
      </div>

      <div>
        <h3>Reviews Awaiting Acknowledgement</h3>
        <p>{data.pendingReviews}</p>
      </div>
    </div>
  );
}