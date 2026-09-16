import { useEffect, useRef, useState } from "react";
import { LuCalendarOff, LuSend } from "react-icons/lu";
import {
  createLeaveRequest,
  getMyLeaveRequests,
} from "../api/leaveRequests.js";
import {
  PageHeader,
  Alert,
  Card,
  StatusPill,
  EmptyState,
  Field,
} from "../components/Ui.jsx";
import { pageEnter } from "../lib/Motion.js";

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

  const headerRef = useRef(null);
  const listRef = useRef(null);

  const fetchRequests = async () => {
    try {
      setError("");

      const data = await getMyLeaveRequests();

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
    fetchRequests();
  }, []);

  useEffect(() => {
    if (loading) return;

    pageEnter({
      header: headerRef.current,
      stagger: listRef.current?.querySelectorAll(".leave-row"),
    });
  }, [loading]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
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

      setRequests((previous) => [newRequest, ...previous]);

      setForm({
        startDate: "",
        endDate: "",
        leaveType: "casual",
        reason: "",
      });

      setMessage("Leave request submitted.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit leave request."
      );
    } finally {
      setSubmitting(false);
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
          title="Leave Requests"
          subtitle="Request time off and follow where each request stands."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card
          title="Request leave"
          className="lg:col-span-2 h-fit"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Start date" htmlFor="startDate">
              <input
                id="startDate"
                name="startDate"
                type="date"
                className="field-input"
                value={form.startDate}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="End date" htmlFor="endDate">
              <input
                id="endDate"
                name="endDate"
                type="date"
                className="field-input"
                value={form.endDate}
                onChange={handleChange}
                min={form.startDate || undefined}
                required
              />
            </Field>

            <Field label="Leave type" htmlFor="leaveType">
              <select
                id="leaveType"
                name="leaveType"
                className="field-input"
                value={form.leaveType}
                onChange={handleChange}
                required
              >
                <option value="sick">Sick</option>
                <option value="casual">Casual</option>
                <option value="vacation">Vacation</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="Reason (optional)" htmlFor="reason">
              <textarea
                id="reason"
                name="reason"
                rows="4"
                className="field-input resize-none"
                value={form.reason}
                onChange={handleChange}
              />
            </Field>

            <Alert tone="error">{error}</Alert>
            <Alert tone="success">{message}</Alert>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? "Submitting..." : "Submit request"}
              {!submitting && <LuSend size={15} />}
            </button>
          </form>
        </Card>

        <div ref={listRef} className="lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">My requests</h2>

          {requests.length === 0 ? (
            <EmptyState
              icon={LuCalendarOff}
              title="No leave requests yet"
              hint="Submit your first request using the form on the left."
            />
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <article
                  key={request._id}
                  className="leave-row card p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold">
                        {formatDate(request.startDate)} —{" "}
                        {formatDate(request.endDate)}
                      </p>
                      <p className="mt-1 text-sm capitalize text-slate">
                        {request.leaveType} leave
                      </p>
                    </div>
                    <StatusPill status={request.status} />
                  </div>

                  {request.reason && (
                    <p className="mt-3 border-t border-line pt-3 text-sm text-slate">
                      {request.reason}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveRequests;