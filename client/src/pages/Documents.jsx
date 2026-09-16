import { useEffect, useState } from "react";
import {
  LuFolderOpen,
  LuTrash2,
  LuExternalLink,
  LuPlus,
} from "react-icons/lu";
import api from "../api/axios.js";
import {
  uploadDocument,
  getEmployeeDocuments,
  getMyDocuments,
  deleteDocument,
} from "../api/documents.js";
/*
 * BUG FIX: this page previously took `user` as a prop, but App.jsx renders
 * it as <Documents /> with no prop — so `user` was always undefined and the
 * admin upload form rendered for EVERY role. Reading from useAuth here is
 * what the route comment already assumed.
 */
import { useAuth } from "../context/AuthContext.jsx";
import {
  PageHeader,
  Alert,
  Card,
  Field,
  EmptyState,
} from "../components/Ui.jsx";

const DOCUMENT_TYPES = [
  { value: "offer_letter", label: "Offer letter" },
  { value: "contract", label: "Contract" },
  { value: "policy", label: "Policy" },
  { value: "certificate", label: "Certificate" },
  { value: "identity", label: "Identity" },
  { value: "other", label: "Other" },
];

const emptyForm = {
  title: "",
  documentType: "other",
  fileName: "",
  fileUrl: "",
  expiryDate: "",
};

export default function Documents() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isEmployee = user?.role === "employee";
  const isAdmin = user?.role === "admin";

  const loadEmployees = async () => {
    const response = await api.get("/employees");

    // Tolerate either response shape so this doesn't break if the
    // endpoint is changed to wrap the array.
    setEmployees(
      Array.isArray(response.data)
        ? response.data
        : response.data?.employees || []
    );
  };

  const loadDocuments = async (id = employeeId) => {
    const data = isEmployee
      ? await getMyDocuments()
      : id
      ? await getEmployeeDocuments(id)
      : [];

    setDocuments(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (!user?.role) return;

    const run = async () => {
      try {
        setError("");

        if (!isEmployee) {
          await loadEmployees();
        }

        await loadDocuments();
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load documents."
        );
      }
    };

    run();
  }, [user?.role]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!employeeId) {
      setError("Select an employee before adding a document.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await uploadDocument({ employeeId, ...form });

      setForm(emptyForm);
      setMessage("Document added.");

      await loadDocuments();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to add document."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Delete this document? This can't be undone."
    );

    if (!confirmed) return;

    try {
      setError("");

      await deleteDocument(id);

      setMessage("Document deleted.");

      await loadDocuments();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete document."
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle={
          isEmployee
            ? "Contracts, policies, and certificates on file for you."
            : "Store and manage employee documents."
        }
      />

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{message}</Alert>

      {!isEmployee && (
        <Card title="Add a document" className="mb-6">
          <Field label="Employee" htmlFor="documentEmployee">
            <select
              id="documentEmployee"
              className="field-input"
              value={employeeId}
              onChange={(event) => {
                setEmployeeId(event.target.value);
                loadDocuments(event.target.value).catch(() =>
                  setError("Failed to load this employee's documents.")
                );
              }}
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </Field>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="title">
                <input
                  id="title"
                  className="field-input"
                  placeholder="Employment contract 2026"
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Type" htmlFor="documentType">
                <select
                  id="documentType"
                  className="field-input"
                  value={form.documentType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      documentType: event.target.value,
                    })
                  }
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="File name" htmlFor="fileName">
                <input
                  id="fileName"
                  className="field-input"
                  placeholder="contract.pdf"
                  value={form.fileName}
                  onChange={(event) =>
                    setForm({ ...form, fileName: event.target.value })
                  }
                  required
                />
              </Field>

              <Field label="File URL" htmlFor="fileUrl">
                <input
                  id="fileUrl"
                  type="url"
                  className="field-input"
                  placeholder="https://..."
                  value={form.fileUrl}
                  onChange={(event) =>
                    setForm({ ...form, fileUrl: event.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Expires on (optional)" htmlFor="expiryDate">
                <input
                  id="expiryDate"
                  type="date"
                  className="field-input"
                  value={form.expiryDate}
                  onChange={(event) =>
                    setForm({ ...form, expiryDate: event.target.value })
                  }
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary mt-5"
            >
              <LuPlus size={15} />
              {saving ? "Adding..." : "Add document"}
            </button>
          </form>
        </Card>
      )}

      <h2 className="mb-4 text-lg font-semibold">Documents on file</h2>

      {documents.length === 0 ? (
        <EmptyState
          icon={LuFolderOpen}
          title="No documents here"
          hint={
            isEmployee
              ? "Documents your HR team shares with you will appear here."
              : "Select an employee above, then add their first document."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {documents.map((document) => {
            const isExpired =
              document.expiryDate &&
              new Date(document.expiryDate) < new Date();

            return (
              <article key={document._id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold">
                      {document.title}
                    </p>
                    <p className="mt-0.5 text-sm capitalize text-slate">
                      {String(document.documentType).replace(/_/g, " ")}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate">
                      {document.fileName}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      aria-label={`Delete ${document.title}`}
                      onClick={() => handleDelete(document._id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-slate
                        transition-colors hover:border-coral hover:text-coral"
                    >
                      <LuTrash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-coral hover:text-coralDark"
                  >
                    Open
                    <LuExternalLink size={14} />
                  </a>

                  {document.expiryDate && (
                    <span
                      className={`pill ${
                        isExpired
                          ? "bg-coral/15 text-coralDark"
                          : "bg-canvas text-slate"
                      }`}
                    >
                      {isExpired ? "Expired" : "Expires"}{" "}
                      {new Date(
                        document.expiryDate
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}