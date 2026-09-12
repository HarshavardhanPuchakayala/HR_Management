import { useEffect, useState } from "react";
import api from "../api/axios.js";
import {
  createOffboarding,
  getOffboardingRecords,
  updateOffboarding,
} from "../api/onboarding.js";

export default function Offboarding() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);

  const [form, setForm] = useState({
    employeeId: "",
    exitDate: "",
    reason: "",
    notes: "",
  });

  const load = async () => {
    const [employeeResponse, offboardingResponse] =
      await Promise.all([
        api.get("/employees"),
        getOffboardingRecords(),
      ]);

    setEmployees(employeeResponse.data);
    setRecords(offboardingResponse);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    await createOffboarding(form);

    setForm({
      employeeId: "",
      exitDate: "",
      reason: "",
      notes: "",
    });

    await load();
  };

  const changeStatus = async (id, status) => {
    await updateOffboarding(id, { status });
    await load();
  };

  return (
    <div>
      <h1>Offboarding</h1>

      <form onSubmit={handleCreate}>
        <select
          value={form.employeeId}
          onChange={(e) =>
            setForm({
              ...form,
              employeeId: e.target.value,
            })
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

        <input
          type="date"
          value={form.exitDate}
          onChange={(e) =>
            setForm({
              ...form,
              exitDate: e.target.value,
            })
          }
          required
        />

        <input
          placeholder="Reason"
          value={form.reason}
          onChange={(e) =>
            setForm({
              ...form,
              reason: e.target.value,
            })
          }
        />

        <textarea
          placeholder="Notes"
          value={form.notes}
          onChange={(e) =>
            setForm({
              ...form,
              notes: e.target.value,
            })
          }
        />

        <button type="submit">Start Offboarding</button>
      </form>

      <section>
        <h2>Offboarding Records</h2>

        {records.map((record) => (
          <div key={record._id}>
            <h3>{record.employeeId?.name}</h3>

            <p>
              Exit date:{" "}
              {new Date(record.exitDate).toLocaleDateString()}
            </p>

            <p>Status: {record.status}</p>

            <p>{record.reason}</p>

            {record.status === "initiated" && (
              <button
                onClick={() =>
                  changeStatus(record._id, "in_progress")
                }
              >
                Mark In Progress
              </button>
            )}

            {record.status === "in_progress" && (
              <button
                onClick={() =>
                  changeStatus(record._id, "completed")
                }
              >
                Complete Offboarding
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}