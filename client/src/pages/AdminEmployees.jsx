import { useEffect, useMemo, useState } from "react";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
} from "../api/employees.js";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  jobTitle: "",
  department: "",
  managerId: "",
};

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");

  const fetchEmployees = async () => {
    try {
      setError("");

      const data = await getEmployees();

      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load employees."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const managerOptions = useMemo(() => {
    return employees.filter((employee) => {
      if (!editingEmployee) {
        return employee.status === "active";
      }

      return (
        employee._id !== editingEmployee._id &&
        employee.status === "active"
      );
    });
  }, [employees, editingEmployee]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }

    if (error) {
      setError("");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingEmployee(null);
    setFieldErrors({});
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setFieldErrors({});
    setMessage("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      jobTitle: form.jobTitle.trim(),
      department: form.department.trim(),
      managerId: form.managerId || null,
    };

    try {
      if (editingEmployee) {
        const data = await updateEmployee(
          editingEmployee._id,
          payload
        );

        const updatedEmployee = data.employee || data;

        setEmployees((previous) =>
          previous.map((employee) =>
            employee._id === editingEmployee._id
              ? updatedEmployee
              : employee
          )
        );

        setMessage("Employee updated successfully.");
      } else {
        const data = await createEmployee(payload);

        const createdEmployee = data.employee || data;

        setEmployees((previous) => [
          createdEmployee,
          ...previous,
        ]);

        setMessage("Employee created successfully.");
      }

      resetForm();
    } catch (error) {
      const statusCode = error.response?.status;
      const backendMessage = error.response?.data?.message || "";

      /*
       * Cycle rejection is a validation problem specifically
       * with manager assignment, so keep it attached to that field.
       */
      if (
        statusCode === 400 &&
        backendMessage.toLowerCase().includes("cycle")
      ) {
        setFieldErrors({
          managerId:
            backendMessage ||
            "This manager assignment would create a reporting cycle.",
        });

        return;
      }

      if (statusCode === 400) {
        setError(
          backendMessage ||
            "Please check the employee information and try again."
        );

        return;
      }

      if (statusCode === 409) {
        setFieldErrors({
          email:
            backendMessage ||
            "An employee with this email already exists.",
        });

        return;
      }

      setError(
        backendMessage ||
          "Failed to save employee. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);

    setForm({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      jobTitle: employee.jobTitle || "",
      department: employee.department || "",
      managerId: employee.managerId?._id || employee.managerId || "",
    });

    setFieldErrors({});
    setError("");
    setMessage("");
  };

  const handleDeactivate = async (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${employee.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeactivatingId(employee._id);
      setError("");
      setMessage("");

      const data = await deactivateEmployee(employee._id);
      const updatedEmployee = data.employee || data;

      setEmployees((previous) =>
        previous.map((item) =>
          item._id === employee._id
            ? updatedEmployee
            : item
        )
      );

      if (editingEmployee?._id === employee._id) {
        resetForm();
      }

      setMessage(`${employee.name} has been deactivated.`);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to deactivate employee."
      );
    } finally {
      setDeactivatingId(null);
    }
  };

  if (loading) {
    return <div>Loading employees...</div>;
  }

  return (
    <div>
      <header>
        <h1>Employee Management</h1>
        <p>
          Create, update, and deactivate PeopleFlow employees.
        </p>
      </header>

      {error && <p>{error}</p>}
      {message && <p>{message}</p>}

      <section>
        <h2>
          {editingEmployee
            ? "Edit Employee"
            : "Add Employee"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            {fieldErrors.email && (
              <p>{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="jobTitle">Job Title</label>
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              value={form.jobTitle}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="department">Department</label>
            <input
              id="department"
              name="department"
              type="text"
              value={form.department}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="managerId">
              Manager
            </label>

            <select
              id="managerId"
              name="managerId"
              value={form.managerId}
              onChange={handleChange}
            >
              <option value="">No manager</option>

              {managerOptions.map((employee) => (
                <option
                  key={employee._id}
                  value={employee._id}
                >
                  {employee.name}
                </option>
              ))}
            </select>

            {fieldErrors.managerId && (
              <p>{fieldErrors.managerId}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingEmployee
                ? "Update Employee"
                : "Create Employee"}
            </button>

            {editingEmployee && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2>Employees</h2>

        {employees.length === 0 ? (
          <p>No employees found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Job Title</th>
                <th>Department</th>
                <th>Manager</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id}>
                  <td>{employee.name}</td>

                  <td>{employee.email}</td>

                  <td>{employee.jobTitle}</td>

                  <td>{employee.department}</td>

                  <td>
                    {employee.managerId?.name ||
                      "No manager"}
                  </td>

                  <td>
                    {employee.status}
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(employee)
                      }
                    >
                      Edit
                    </button>

                    {employee.status === "active" && (
                      <button
                        type="button"
                        disabled={
                          deactivatingId === employee._id
                        }
                        onClick={() =>
                          handleDeactivate(employee)
                        }
                      >
                        {deactivatingId === employee._id
                          ? "Deactivating..."
                          : "Deactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default AdminEmployees;