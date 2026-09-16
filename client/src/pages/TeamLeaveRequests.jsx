import { useEffect, useRef, useState } from "react";
import { LuCheck, LuX, LuUsers } from "react-icons/lu";
import {
  getTeamLeaveRequests,
  approveOrRejectLeaveRequest,
} from "../api/leaveRequests.js";
import {
  PageHeader,
  Alert,
  StatusPill,
  EmptyState,
} from "../components/Ui.jsx";
import { pageEnter } from "../lib/Motion.js";

const TeamLeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const headerRef = useRef(null);
  const listRef = useRef(null);

  const fetchTeamRequests = async () => {
    try {
      setError("");

      const data = await getTeamLeaveRequests();

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("You are not authorized to view team leave requests.");
      } else {
        setError(
          err.response?.data?.message ||
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

  useEffect(() => {
    if (loading) return;

    pageEnter({
      header: headerRef.current,
      stagger: listRef.current?.querySelectorAll(".request-card"),
    });
  }, [loading]);

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

      setMessage(`Leave request ${status}.`);
    } catch (err) {
      const statusCode = err.response?.status;

      if (statusCode === 403) {
        setError("You are not authorized to make this leave decision.");
      } else if (statusCode === 400) {
        setError(
          "This request was already resolved elsewhere. Showing the latest status."
        );

        // Refresh because another tab/user may have resolved it.
        await fetchTeamRequests();
      } else {
        setError(
          err.response?.data?.message || "Failed to update leave request."
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate">
        Loading team leave requests...
      </div>
    );
  }

  const pendingCount = requests.filter(
    (request) => request.status === "pending"
  ).length;

  return (
    <div>
      <div ref={headerRef}>
        <PageHeader
          title="Team Leave"
          subtitle={
            pendingCount > 0
              ? `${pendingCount} request${
                  pendingCount === 1 ? "" : "s"
                } waiting on your decision.`
              : "Nothing is waiting on you right now."
          }
        />
      </div>

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{message}</Alert>

      <div ref={listRef}>
        {requests.length === 0 ? (
          <EmptyState
            icon={LuUsers}
            title="No requests from your team"
            hint="When someone reporting to you requests leave, it lands here."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const employee = request.employeeId;
              const isPending = request.status === "pending";
              const isProcessing = processingId === request._id;

              return (
                <article key={request._id} className="request-card card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas font-display font-semibold text-ink">
                        {(employee?.name || "?").slice(0, 1).toUpperCase()}
                      </div>

                      <div>
                        <p className="font-display font-semibold">
                          {employee?.name || "Unknown employee"}
                        </p>
                        <p className="text-sm text-slate">
                          {employee?.department || "No department"}
                        </p>

                        <p className="mt-2.5 text-sm">
                          {formatDate(request.startDate)} —{" "}
                          {formatDate(request.endDate)}
                          <span className="ml-2 capitalize text-slate">
                            {request.leaveType}
                          </span>
                        </p>

                        {request.reason && (
                          <p className="mt-2 text-sm text-slate">
                            {request.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <StatusPill status={request.status} />

                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              handleDecision(request._id, "approved")
                            }
                            className="inline-flex items-center gap-1.5 rounded-full bg-mint px-4 py-2 text-sm font-semibold text-ink
                              transition-colors hover:bg-mintDark hover:text-white disabled:opacity-50"
                          >
                            <LuCheck size={15} />
                            {isProcessing ? "Working..." : "Approve"}
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              handleDecision(request._id, "rejected")
                            }
                            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink
                              transition-colors hover:border-coral hover:text-coral disabled:opacity-50"
                          >
                            <LuX size={15} />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamLeaveRequests;