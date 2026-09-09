import { useEffect, useState } from "react";
import {
  createLeaveRequest,
  getMyLeaveRequests,
} from "../api/leaveRequests.js";

const statusClasses = {
  pending: "status-pending",
  approved: "status-approved",
  rejected: "status-rejected",
  cancelled: "status-cancelled",
};

const LeaveRequests = () => {
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    leaveType: "casual",
    reason: "",
  });

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchRequests = async () => {
    try {
      setError("");

      const data = await getMyLeaveRequests();

      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load leave requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (form.endDate < form.startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    try {
      setSubmitting(true);

      const newRequest = await createLeaveRequest({
        startDate: form.startDate,
        endDate: form.endDate,
        leaveType: form.leaveType,
        reason: form.reason.trim() || undefined,
      });

      setRequests((previous) => [
        newRequest,
        ...previous,
      ]);

      setForm({
        startDate: "",
        endDate: "",
        leaveType: "casual",
        reason: "",
      });

      setMessage("Leave request submitted successfully.");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to submit leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading leave requests...</div>;
  }

  return (
    <div>
      <h1>Leave Requests</h1>

      <section>
        <h2>Request Leave</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="startDate">Start date</label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="endDate">End date</label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              min={form.startDate || undefined}
              required
            />
          </div>

          <div>
            <label htmlFor="leaveType">Leave type</label>
            <select
              id="leaveType"
              name="leaveType"
              value={form.leaveType}
              onChange={handleChange}
              required
            >
              <option value="sick">Sick</option>
              <option value="casual">Casual</option>
              <option value="vacation">Vacation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="reason">Reason (optional)</label>
            <textarea
              id="reason"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows="4"
            />
          </div>

          {error && <p>{error}</p>}
          {message && <p>{message}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Leave Request"}
          </button>
        </form>
      </section>

      <section>
        <h2>My Leave Requests</h2>

        {requests.length === 0 ? (
          <p>No leave requests yet.</p>
        ) : (
          <div>
            {requests.map((request) => (
              <article key={request._id}>
                <div>
                  <strong>
                    {formatDate(request.startDate)} -{" "}
                    {formatDate(request.endDate)}
                  </strong>

                  <span
                    className={
                      statusClasses[request.status] || ""
                    }
                  >
                    {request.status}
                  </span>
                </div>

                <p>Type: {request.leaveType}</p>

                {request.reason && (
                  <p>Reason: {request.reason}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default LeaveRequests;