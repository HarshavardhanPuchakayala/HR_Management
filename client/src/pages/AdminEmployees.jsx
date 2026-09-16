
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuEye,
  LuEyeOff,
  LuPencil,
  LuUserX,
  LuUsers,
} from "react-icons/lu";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
} from "../api/employees.js";

import {
  PageHeader,
  Alert,
  Card,
  Table,
  Td,
  Field,
  StatusPill,
  EmptyState,
} from "../components/Ui.jsx";

import { pageEnter } from "../lib/Motion.js";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  jobTitle: "",
  department: "",
  managerId: "",
  password: "",
};

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");

  const headerRef = useRef(null);
  const bodyRef = useRef(null);

  const fetchEmployees = async () => {
    try {
      setError("");

      const data = await getEmployees();

      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load employees."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (loading) return;

    pageEnter({
      header: headerRef.current,
      stagger:
        bodyRef.current?.querySelectorAll(
          ".enter-item"
        ),
    });
  }, [loading]);

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
    setShowPassword(false);
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

    /*
     * Password is required only when creating
     * a new employee.
     *
     * We do not send the password during normal
     * employee profile editing.
     */
    if (!editingEmployee) {
      payload.password = form.password;
    }

    try {
      if (editingEmployee) {
        /*
         * EDIT EXISTING EMPLOYEE
         */
        const data = await updateEmployee(
          editingEmployee._id,
          payload
        );

        const updatedEmployee =
          data.employee || data;

        setEmployees((previous) =>
          previous.map((employee) =>
            employee._id === editingEmployee._id
              ? updatedEmployee
              : employee
          )
        );

        setMessage("Employee updated.");

        resetForm();
      } else {
        /*
         * CREATE NEW EMPLOYEE
         */
        const data = await createEmployee(payload);

        const createdEmployee =
          data.employee || data;

        setEmployees((previous) => [
          createdEmployee,
          ...previous,
        ]);

        setMessage(
          "Employee created successfully. They can now log in using their email and password."
        );

        resetForm();
      }
    } catch (err) {
      const statusCode = err.response?.status;
      const backendMessage =
        err.response?.data?.message || "";

      if (
        statusCode === 400 &&
        backendMessage
          .toLowerCase()
          .includes("cycle")
      ) {
        setFieldErrors({
          managerId:
            backendMessage ||
            "This manager assignment would create a reporting cycle.",
        });

        return;
      }

      if (
        statusCode === 400 &&
        backendMessage
          .toLowerCase()
          .includes("password")
      ) {
        setFieldErrors({
          password:
            backendMessage ||
            "Password must be at least 8 characters long.",
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

      if (statusCode === 429) {
        setError(
          backendMessage ||
            "Too many employee creation attempts. Please try again later."
        );

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
      managerId:
        employee.managerId?._id ||
        employee.managerId ||
        "",
      password: "",
    });

    setShowPassword(false);
    setFieldErrors({});
    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeactivate = async (employee) => {
    const confirmed = window.confirm(
      `Deactivate ${employee.name}? They will lose access to PeopleFlow.`
    );

    if (!confirmed) return;

    try {
      setDeactivatingId(employee._id);
      setError("");
      setMessage("");

      const data = await deactivateEmployee(
        employee._id
      );

      const updatedEmployee =
        data.employee || data;

      setEmployees((previous) =>
        previous.map((item) =>
          item._id === employee._id
            ? updatedEmployee
            : item
        )
      );

      if (
        editingEmployee?._id ===
        employee._id
      ) {
        resetForm();
      }

      setMessage(
        `${employee.name} has been deactivated.`
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to deactivate employee."
      );
    } finally {
      setDeactivatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate">
        Loading employees...
      </div>
    );
  }

  return (
    <div>
      <div ref={headerRef}>
        <PageHeader
          title="Employees"
          subtitle="Add people, keep their details current, and manage access."
        />
      </div>

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{message}</Alert>

      <div
        ref={bodyRef}
        className="space-y-6"
      >
        <Card
          title={
            editingEmployee
              ? "Edit employee"
              : "Add employee"
          }
          description={
            editingEmployee
              ? `Updating ${editingEmployee.name}.`
              : "Create the employee account and set their login password."
          }
          className="enter-item"
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Name"
                htmlFor="name"
              >
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="field-input"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </Field>

              <Field
                label="Email"
                htmlFor="email"
                error={fieldErrors.email}
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="field-input"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </Field>

              <Field
                label="Phone"
                htmlFor="phone"
              >
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="field-input"
                  value={form.phone}
                  onChange={handleChange}
                />
              </Field>

              <Field
                label="Job title"
                htmlFor="jobTitle"
              >
                <input
                  id="jobTitle"
                  name="jobTitle"
                  type="text"
                  className="field-input"
                  value={form.jobTitle}
                  onChange={handleChange}
                  required
                />
              </Field>

              <Field
                label="Department"
                htmlFor="department"
              >
                <input
                  id="department"
                  name="department"
                  type="text"
                  className="field-input"
                  value={form.department}
                  onChange={handleChange}
                  required
                />
              </Field>

              <Field
                label="Manager"
                htmlFor="managerId"
                error={fieldErrors.managerId}
              >
                <select
                  id="managerId"
                  name="managerId"
                  className="field-input"
                  value={form.managerId}
                  onChange={handleChange}
                >
                  <option value="">
                    No manager
                  </option>

                  {managerOptions.map(
                    (employee) => (
                      <option
                        key={employee._id}
                        value={employee._id}
                      >
                        {employee.name}
                      </option>
                    )
                  )}
                </select>
              </Field>

              {!editingEmployee && (
                <Field
                  label="Password"
                  htmlFor="password"
                  error={fieldErrors.password}
                >
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      className="field-input pr-11"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter login password"
                      minLength={8}
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate hover:bg-canvas hover:text-ink"
                    >
                      {showPassword ? (
                        <LuEyeOff size={17} />
                      ) : (
                        <LuEye size={17} />
                      )}
                    </button>
                  </div>
                </Field>
              )}
            </div>

            {!editingEmployee && (
              <div className="mt-4 rounded-lg border border-line bg-canvas px-4 py-3 text-sm text-slate">
                <strong className="text-ink">
                  Login password:
                </strong>{" "}
                This password will be used by the employee
                to sign in. It must be at least 8 characters.
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving
                  ? "Saving..."
                  : editingEmployee
                  ? "Save changes"
                  : "Create employee"}
              </button>

              {editingEmployee && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>

        <div className="enter-item">
          <h2 className="mb-4 text-lg font-semibold">
            All employees{" "}
            <span className="ml-1 text-sm font-normal text-slate">
              {employees.length}
            </span>
          </h2>

          {employees.length === 0 ? (
            <EmptyState
              icon={LuUsers}
              title="No employees yet"
              hint="Add your first employee with the form above."
            />
          ) : (
            <Table
              head={[
                "Name",
                "Email",
                "Job title",
                "Department",
                "Manager",
                "Status",
                "",
              ]}
            >
              {employees.map((employee) => (
                <tr
                  key={employee._id}
                  className="bg-surface"
                >
                  <Td className="font-medium">
                    {employee.name}
                  </Td>

                  <Td className="text-slate">
                    {employee.email}
                  </Td>

                  <Td>
                    {employee.jobTitle}
                  </Td>

                  <Td>
                    {employee.department}
                  </Td>

                  <Td className="text-slate">
                    {employee.managerId?.name ||
                      "No manager"}
                  </Td>

                  <Td>
                    <StatusPill
                      status={employee.status}
                    />
                  </Td>

                  <Td>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        aria-label={`Edit ${employee.name}`}
                        onClick={() =>
                          handleEdit(employee)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate transition-colors hover:border-ink hover:text-ink"
                      >
                        <LuPencil size={14} />
                      </button>

                      {employee.status ===
                        "active" && (
                        <button
                          type="button"
                          aria-label={`Deactivate ${employee.name}`}
                          disabled={
                            deactivatingId ===
                            employee._id
                          }
                          onClick={() =>
                            handleDeactivate(
                              employee
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate transition-colors hover:border-coral hover:text-coral disabled:opacity-50"
                        >
                          <LuUserX size={14} />
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEmployees;