import { useEffect, useState } from "react";
import {
  getTeamLeaveRequests,
  approveOrRejectLeaveRequest,
} from "../api/leaveRequests.js";

const TeamLeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchTeamRequests = async () => {
    try {
      setError("");

      const data = await getTeamLeaveRequests();

      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error.response?.status === 403) {
        setError("You are not authorized to view team leave requests.");
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to load team leave requests."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamRequests();
  }, []);

  const handleDecision = async (id, status) => {
    try {
      setProcessingId(id);
      setError("");
      setMessage("");

      const data = await approveOrRejectLeaveRequest(id, status);

      setRequests((previous) =>
        previous.map((request) =>
          request._id === id
            ? {
                ...request,
                status: data.leaveRequest?.status || status,
                approvedBy: data.leaveRequest?.approvedBy,
                approvedAt: data.leaveRequest?.approvedAt,
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
          "This leave request has already been resolved. Refresh the page to see the latest status."
        );

        // Refresh because another tab/user may have resolved it.
        await fetchTeamRequests();
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
    return <div>Loading team leave requests...</div>;
  }

  return (
    <div>
      <h1>Team Leave Requests</h1>

      {error && <p>{error}</p>}
      {message && <p>{message}</p>}

      {requests.length === 0 ? (
        <p>No leave requests from your team.</p>
      ) : (
        <div>
          {requests.map((request) => {
            const employee = request.employeeId;
            const isPending = request.status === "pending";
            const isProcessing = processingId === request._id;

            return (
              <article key={request._id}>
                <h2>
                  {employee?.name || "Unknown employee"}
                </h2>

                <p>
                  Department:{" "}
                  {employee?.department || "Not available"}
                </p>

                <p>
                  Dates: {formatDate(request.startDate)} -{" "}
                  {formatDate(request.endDate)}
                </p>

                <p>
                  Leave type: {request.leaveType}
                </p>

                {request.reason && (
                  <p>Reason: {request.reason}</p>
                )}

                <p>
                  Status: <strong>{request.status}</strong>
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
    </div>
  );
};

export default TeamLeaveRequests;