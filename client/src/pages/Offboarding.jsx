import { useEffect, useState } from "react";
import { LuUserMinus } from "react-icons/lu";
import api from "../api/axios.js";
import {
  createOffboarding,
  getOffboardingRecords,
  updateOffboarding,
} from "../api/onboarding.js";
import {
  PageHeader,
  Alert,
  Card,
  Field,
  StatusPill,
  EmptyState,
} from "../components/Ui.jsx";

const emptyForm = {
  employeeId: "",
  exitDate: "",
  reason: "",
  notes: "",
};

export default function Offboarding() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      setError("");

      const [employeeResponse, offboardingResponse] = await Promise.all([
        api.get("/employees"),
        getOffboardingRecords(),
      ]);

      setEmployees(
        Array.isArray(employeeResponse.data)
          ? employeeResponse.data
          : employeeResponse.data?.employees || []
      );

      setRecords(
        Array.isArray(offboardingResponse) ? offboardingResponse : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load offboarding data."
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await createOffboarding(form);

      setForm(emptyForm);
      setMessage("Offboarding started.");

      await load();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to start offboarding."
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      setError("");

      await updateOffboarding(id, { status });

      await load();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update offboarding."
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Offboarding"
        subtitle="Track exits from notice through final day."
      />

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{message}</Alert>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card title="Start offboarding" className="lg:col-span-2 h-fit">
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Employee" htmlFor="exitEmployee">
              <select
                id="exitEmployee"
                className="field-input"
                value={form.employeeId}
                onChange={(event) =>
                  setForm({ ...form, employeeId: event.target.value })
                }
                required
              >
                <option value="">Select employee</option>
                {employees
                  .filter((employee) => employee.status === "active")
                  .map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label="Exit date" htmlFor="exitDate">
              <input
                id="exitDate"
                type="date"
                className="field-input"
                value={form.exitDate}
                onChange={(event) =>
                  setForm({ ...form, exitDate: event.target.value })
                }
                required
              />
            </Field>

            <Field label="Reason" htmlFor="exitReason">
              <input
                id="exitReason"
                className="field-input"
                placeholder="Resignation, end of contract..."
                value={form.reason}
                onChange={(event) =>
                  setForm({ ...form, reason: event.target.value })
                }
              />
            </Field>

            <Field label="Notes" htmlFor="exitNotes">
              <textarea
                id="exitNotes"
                rows="3"
                className="field-input resize-none"
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
              />
            </Field>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? "Starting..." : "Start offboarding"}
            </button>
          </form>
        </Card>

        <div className="lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">
            Offboarding in progress
          </h2>

          {records.length === 0 ? (
            <EmptyState
              icon={LuUserMinus}
              title="No offboarding records"
              hint="When someone gives notice, start their offboarding here."
            />
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <article key={record._id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold">
                        {record.employeeId?.name || "Unknown employee"}
                      </p>
                      <p className="mt-0.5 text-sm text-slate">
                        Last day{" "}
                        {new Date(record.exitDate).toLocaleDateString()}
                      </p>
                      {record.reason && (
                        <p className="mt-2 text-sm">{record.reason}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <StatusPill status={record.status} />

                      {record.status === "initiated" && (
                        <button
                          type="button"
                          onClick={() =>
                            changeStatus(record._id, "in_progress")
                          }
                          className="rounded-full border border-line px-4 py-2 text-sm font-medium
                            transition-colors hover:border-ink"
                        >
                          Mark in progress
                        </button>
                      )}

                      {record.status === "in_progress" && (
                        <button
                          type="button"
                          onClick={() =>
                            changeStatus(record._id, "completed")
                          }
                          className="rounded-full bg-mint px-4 py-2 text-sm font-semibold text-ink
                            transition-colors hover:bg-mintDark hover:text-white"
                        >
                          Complete offboarding
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}