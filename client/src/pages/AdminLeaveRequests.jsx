import { useEffect, useRef, useState } from "react";
import { LuCheck, LuX, LuCalendarSearch } from "react-icons/lu";
import {
  getAllLeaveRequests,
  approveOrRejectLeaveRequest,
} from "../api/leaveRequests.js";
import {
  PageHeader,
  Alert,
  StatusPill,
  EmptyState,
} from "../components/Ui.jsx";
import { pageEnter } from "../lib/Motion.js";

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const AdminLeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const headerRef = useRef(null);
  const listRef = useRef(null);

  const fetchRequests = async (status = statusFilter) => {
    try {
      setError("");

      const data = await getAllLeaveRequests(status || undefined);

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load leave requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    if (loading) return;

    pageEnter({
      header: headerRef.current,
      stagger: listRef.current?.querySelectorAll(".request-card"),
    });
  }, [loading, requests]);

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
        setError("This request was already resolved. Reloading the list...");

        await fetchRequests(statusFilter);
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
        Loading leave requests...
      </div>
    );
  }

  return (
    <div>
      <div ref={headerRef}>
        <PageHeader
          title="All Leave Requests"
          subtitle="Company-wide leave, across every department."
        />
      </div>

      {/* Filter tabs read faster than a select for five fixed options */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = statusFilter === filter.value;

          return (
            <button
              key={filter.value || "all"}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-ink text-white"
                  : "border border-line bg-surface text-slate hover:text-ink"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{message}</Alert>

      <div ref={listRef}>
        {requests.length === 0 ? (
          <EmptyState
            icon={LuCalendarSearch}
            title="No requests match this filter"
            hint="Try a different status, or check back once employees submit leave."
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
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas font-display font-semibold">
                        {(employee?.name || "?").slice(0, 1).toUpperCase()}
                      </div>

                      <div>
                        <p className="font-display font-semibold">
                          {employee?.name || "Unknown employee"}
                        </p>
                        <p className="text-sm text-slate">
                          {employee?.jobTitle || "No job title"} ·{" "}
                          {employee?.department || "No department"}
                        </p>
                        <p className="text-sm text-slate">
                          {employee?.email || "No email on file"}
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
                            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold
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

export default AdminLeaveRequests;