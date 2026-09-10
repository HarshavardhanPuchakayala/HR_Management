import { useEffect, useState } from "react";
import {
  getAllLeaveRequests,
  approveOrRejectLeaveRequest,
} from "../api/leaveRequests.js";

const AdminLeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchRequests = async (status = statusFilter) => {
    try {
      setError("");

      const data = await getAllLeaveRequests(status || undefined);

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
    fetchRequests(statusFilter);
  }, [statusFilter]);

  const handleDecision = async (id, status) => {
    try {
      setProcessingId(id);
      setError("");
      setMessage("");

      const data = await approveOrRejectLeaveRequest(
        id,
        status
      );

      setRequests((previous) =>
        previous.map((request) =>
          request._id === id
            ? {
                ...request,
                status: data.leaveRequest?.status || status,
                approvedBy:
                  data.leaveRequest?.approvedBy,
                approvedAt:
                  data.leaveRequest?.approvedAt,
              }
            : request
        )
      );

      setMessage(
        `Leave request ${status} successfully.`
      );
    } catch (error) {
      const statusCode = error.response?.status;

      if (statusCode === 403) {
        setError(
          "You are not authorized to make this leave decision."
        );
      } else if (statusCode === 400) {
        setError(
          "This leave request has already been resolved. Refreshing the list..."
        );

        await fetchRequests(statusFilter);
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to update leave request."
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading all leave requests...</div>;
  }

  return (
    <div>
      <header>
        <h1>All Leave Requests</h1>
        <p>Company-wide leave request management.</p>
      </header>

      <section>
        <label htmlFor="status-filter">
          Filter by status
        </label>

        <select
          id="status-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </section>

      {error && <p>{error}</p>}
      {message && <p>{message}</p>}

      <section>
        {requests.length === 0 ? (
          <p>No leave requests found.</p>
        ) : (
          <div>
            {requests.map((request) => {
              const employee = request.employeeId;
              const isPending =
                request.status === "pending";
              const isProcessing =
                processingId === request._id;

              return (
                <article key={request._id}>
                  <h2>
                    {employee?.name ||
                      "Unknown employee"}
                  </h2>

                  <p>
                    Email:{" "}
                    {employee?.email ||
                      "Not available"}
                  </p>

                  <p>
                    Job title:{" "}
                    {employee?.jobTitle ||
                      "Not available"}
                  </p>

                  <p>
                    Department:{" "}
                    {employee?.department ||
                      "Not available"}
                  </p>

                  <p>
                    Dates:{" "}
                    {formatDate(request.startDate)} -{" "}
                    {formatDate(request.endDate)}
                  </p>

                  <p>
                    Leave type: {request.leaveType}
                  </p>

                  {request.reason && (
                    <p>Reason: {request.reason}</p>
                  )}

                  <p>
                    Status:{" "}
                    <strong>{request.status}</strong>
                  </p>

                  {isPending && (
                    <div>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() =>
                          handleDecision(
                            request._id,
                            "approved"
                          )
                        }
                      >
                        {isProcessing
                          ? "Processing..."
                          : "Approve"}
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() =>
                          handleDecision(
                            request._id,
                            "rejected"
                          )
                        }
                      >
                        {isProcessing
                          ? "Processing..."
                          : "Reject"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminLeaveRequests;