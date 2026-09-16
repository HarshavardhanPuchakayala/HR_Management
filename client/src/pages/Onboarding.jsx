import { useEffect, useState } from "react";
import { LuPlus, LuListChecks, LuTrash2 } from "react-icons/lu";
import {
  getOnboardingTemplates,
  createOnboardingTemplate,
  assignOnboarding,
  getEmployeeOnboarding,
  updateOnboardingTask,
} from "../api/onboarding.js";
import api from "../api/axios.js";
import {
  PageHeader,
  Alert,
  Card,
  Field,
  StatusPill,
  EmptyState,
} from "../components/Ui.jsx";

const emptyTemplate = {
  name: "",
  description: "",
  tasks: [{ title: "", description: "", dueDays: 7 }],
};

export default function Onboarding() {
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [template, setTemplate] = useState(emptyTemplate);

  const load = async () => {
    try {
      setError("");

      const [employeeResponse, templateResponse] = await Promise.all([
        api.get("/employees"),
        getOnboardingTemplates(),
      ]);

      setEmployees(
        Array.isArray(employeeResponse.data)
          ? employeeResponse.data
          : employeeResponse.data?.employees || []
      );

      setTemplates(
        Array.isArray(templateResponse) ? templateResponse : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load onboarding data."
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const loadTasks = async (id) => {
    if (!id) {
      setTasks([]);
      return;
    }

    try {
      const data = await getEmployeeOnboarding(id);

      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load onboarding tasks."
      );
    }
  };

  const handleCreateTemplate = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      await createOnboardingTemplate(template);

      setTemplate(emptyTemplate);
      setMessage("Template created.");

      await load();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create template."
      );
    }
  };

  const handleAssign = async () => {
    if (!employeeId || !templateId) {
      setError("Pick both an employee and a template.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await assignOnboarding({ employeeId, templateId });

      setTasks(Array.isArray(result?.tasks) ? result.tasks : []);
      setMessage("Onboarding assigned.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to assign onboarding."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id, status) => {
    try {
      setError("");

      const updated = await updateOnboardingTask(id, { status });

      setTasks((current) =>
        current.map((task) => (task._id === updated._id ? updated : task))
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update task."
      );
    }
  };

  const addTemplateTask = () => {
    setTemplate((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        { title: "", description: "", dueDays: 7 },
      ],
    }));
  };

  const removeTemplateTask = (index) => {
    setTemplate((current) => ({
      ...current,
      tasks: current.tasks.filter((_, i) => i !== index),
    }));
  };

  const completedCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const progress =
    tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="Onboarding"
        subtitle="Build a checklist once, then run every new hire through it."
      />

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{message}</Alert>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Create a template"
          description="A reusable set of tasks with due dates relative to the start date."
        >
          <form onSubmit={handleCreateTemplate} className="space-y-4">
            <Field label="Template name" htmlFor="templateName">
              <input
                id="templateName"
                className="field-input"
                placeholder="Engineering new hire"
                value={template.name}
                onChange={(event) =>
                  setTemplate({ ...template, name: event.target.value })
                }
                required
              />
            </Field>

            <Field label="Description" htmlFor="templateDescription">
              <textarea
                id="templateDescription"
                rows="2"
                className="field-input resize-none"
                value={template.description}
                onChange={(event) =>
                  setTemplate({
                    ...template,
                    description: event.target.value,
                  })
                }
              />
            </Field>

            <div className="space-y-2.5">
              <p className="field-label">Tasks</p>

              {template.tasks.map((task, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    aria-label={`Task ${index + 1} title`}
                    placeholder="Task title"
                    className="field-input flex-1"
                    value={task.title}
                    required
                    onChange={(event) => {
                      const next = [...template.tasks];
                      next[index] = {
                        ...next[index],
                        title: event.target.value,
                      };
                      setTemplate({ ...template, tasks: next });
                    }}
                  />

                  <input
                    aria-label={`Task ${index + 1} due days`}
                    type="number"
                    min="0"
                    className="field-input w-24"
                    value={task.dueDays}
                    onChange={(event) => {
                      const next = [...template.tasks];
                      next[index] = {
                        ...next[index],
                        dueDays: Number(event.target.value),
                      };
                      setTemplate({ ...template, tasks: next });
                    }}
                  />

                  {template.tasks.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove task ${index + 1}`}
                      onClick={() => removeTemplateTask(index)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-slate
                        transition-colors hover:border-coral hover:text-coral"
                    >
                      <LuTrash2 size={15} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addTemplateTask}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-coral hover:text-coralDark"
              >
                <LuPlus size={14} />
                Add another task
              </button>
            </div>

            <button type="submit" className="btn-primary">
              Create template
            </button>
          </form>
        </Card>

        <Card
          title="Assign onboarding"
          description="Pick a new hire and the checklist they should follow."
        >
          <div className="space-y-4">
            <Field label="Employee" htmlFor="onboardEmployee">
              <select
                id="onboardEmployee"
                className="field-input"
                value={employeeId}
                onChange={(event) => {
                  setEmployeeId(event.target.value);
                  loadTasks(event.target.value);
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

            <Field label="Template" htmlFor="onboardTemplate">
              <select
                id="onboardTemplate"
                className="field-input"
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
              >
                <option value="">Select template</option>
                {templates.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>

            <button
              type="button"
              onClick={handleAssign}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Assigning..." : "Assign onboarding"}
            </button>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Tasks</h2>

          {tasks.length > 0 && (
            <p className="text-sm text-slate">
              {completedCount} of {tasks.length} done
            </p>
          )}
        </div>

        {tasks.length > 0 && (
          <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-mint transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {tasks.length === 0 ? (
          <EmptyState
            icon={LuListChecks}
            title="No onboarding tasks"
            hint="Select an employee to see their checklist, or assign a template."
          />
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <article key={task._id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 text-sm text-slate">
                        {task.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate">
                      Due{" "}
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusPill status={task.status} />

                    {task.status !== "completed" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            updateTask(task._id, "in_progress")
                          }
                          className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-slate
                            transition-colors hover:border-ink hover:text-ink"
                        >
                          Start
                        </button>

                        <button
                          type="button"
                          onClick={() => updateTask(task._id, "completed")}
                          className="rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-ink
                            transition-colors hover:bg-mintDark hover:text-white"
                        >
                          Complete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}