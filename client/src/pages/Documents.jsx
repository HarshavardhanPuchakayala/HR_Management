import { useEffect, useState } from "react";
import api from "../api/axios.js";
import {
  uploadDocument,
  getEmployeeDocuments,
  getMyDocuments,
  deleteDocument,
} from "../api/documents.js";

export default function Documents({ user }) {
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [employeeId, setEmployeeId] = useState("");

  const [form, setForm] = useState({
    title: "",
    documentType: "other",
    fileName: "",
    fileUrl: "",
    expiryDate: "",
  });

  const loadEmployees = async () => {
    const response = await api.get("/employees");
    setEmployees(response.data);
  };

  const loadDocuments = async (id = employeeId) => {
    const data =
      user?.role === "employee"
        ? await getMyDocuments()
        : id
          ? await getEmployeeDocuments(id)
          : [];

    setDocuments(data);
  };

  useEffect(() => {
    if (user?.role !== "employee") {
      loadEmployees().catch(console.error);
    }

    loadDocuments().catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await uploadDocument({
      employeeId,
      ...form,
    });

    setForm({
      title: "",
      documentType: "other",
      fileName: "",
      fileUrl: "",
      expiryDate: "",
    });

    await loadDocuments();
  };

  const handleDelete = async (id) => {
    await deleteDocument(id);
    await loadDocuments();
  };

  return (
    <div>
      <h1>Documents</h1>

      {user?.role !== "employee" && (
        <>
          <select
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              loadDocuments(e.target.value).catch(console.error);
            }}
          >
            <option value="">Select employee</option>

            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </select>

          <form onSubmit={handleSubmit}>
            <input
              placeholder="Document title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              required
            />

            <select
              value={form.documentType}
              onChange={(e) =>
                setForm({
                  ...form,
                  documentType: e.target.value,
                })
              }
            >
              <option value="offer_letter">Offer Letter</option>
              <option value="contract">Contract</option>
              <option value="policy">Policy</option>
              <option value="certificate">Certificate</option>
              <option value="identity">Identity</option>
              <option value="other">Other</option>
            </select>

            <input
              placeholder="File name"
              value={form.fileName}
              onChange={(e) =>
                setForm({
                  ...form,
                  fileName: e.target.value,
                })
              }
              required
            />

            <input
              placeholder="File URL"
              value={form.fileUrl}
              onChange={(e) =>
                setForm({
                  ...form,
                  fileUrl: e.target.value,
                })
              }
              required
            />

            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  expiryDate: e.target.value,
                })
              }
            />

            <button type="submit">Add Document</button>
          </form>
        </>
      )}

      <h2>Document List</h2>

      {documents.map((document) => (
        <div key={document._id}>
          <strong>{document.title}</strong>

          <p>{document.documentType}</p>
          <p>{document.fileName}</p>

          <a
            href={document.fileUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open Document
          </a>

          {document.expiryDate && (
            <p>
              Expires:{" "}
              {new Date(document.expiryDate).toLocaleDateString()}
            </p>
          )}

          {user?.role === "admin" && (
            <button onClick={() => handleDelete(document._id)}>
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}