import { useEffect, useState } from "react";
import {
  getOnboardingTemplates,
  createOnboardingTemplate,
  assignOnboarding,
  getEmployeeOnboarding,
  updateOnboardingTask,
} from "../api/onboarding.js";
import api from "../api/axios.js";

export default function Onboarding() {
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [template, setTemplate] = useState({
    name: "",
    description: "",
    tasks: [{ title: "", description: "", dueDays: 7 }],
  });

  const load = async () => {
    const [employeeResponse, templateResponse] = await Promise.all([
      api.get("/employees"),
      getOnboardingTemplates(),
    ]);

    setEmployees(employeeResponse.data);
    setTemplates(templateResponse);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const loadTasks = async (id) => {
    if (!id) {
      setTasks([]);
      return;
    }

    const data = await getEmployeeOnboarding(id);
    setTasks(data);
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();

    await createOnboardingTemplate(template);

    setTemplate({
      name: "",
      description: "",
      tasks: [{ title: "", description: "", dueDays: 7 }],
    });

    await load();
  };

  const handleAssign = async () => {
    if (!employeeId || !templateId) return;

    setLoading(true);

    try {
      const result = await assignOnboarding({
        employeeId,
        templateId,
      });

      setTasks(result.tasks);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id, status) => {
    const updated = await updateOnboardingTask(id, { status });

    setTasks((current) =>
      current.map((task) =>
        task._id === updated._id ? updated : task
      )
    );
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

  return (
    <div>
      <h1>Onboarding</h1>

      <section>
        <h2>Create Template</h2>

        <form onSubmit={handleCreateTemplate}>
          <input
            placeholder="Template name"
            value={template.name}
            onChange={(e) =>
              setTemplate({ ...template, name: e.target.value })
            }
            required
          />

          <textarea
            placeholder="Description"
            value={template.description}
            onChange={(e) =>
              setTemplate({
                ...template,
                description: e.target.value,
              })
            }
          />

          {template.tasks.map((task, index) => (
            <div key={index}>
              <input
                placeholder="Task title"
                value={task.title}
                required
                onChange={(e) => {
                  const tasks = [...template.tasks];
                  tasks[index].title = e.target.value;
                  setTemplate({ ...template, tasks });
                }}
              />

              <input
                type="number"
                min="0"
                value={task.dueDays}
                onChange={(e) => {
                  const tasks = [...template.tasks];
                  tasks[index].dueDays = Number(e.target.value);
                  setTemplate({ ...template, tasks });
                }}
              />
            </div>
          ))}

          <button type="button" onClick={addTemplateTask}>
            Add Task
          </button>

          <button type="submit">Create Template</button>
        </form>
      </section>

      <section>
        <h2>Assign Onboarding</h2>

        <select
          value={employeeId}
          onChange={(e) => {
            setEmployeeId(e.target.value);
            loadTasks(e.target.value).catch(console.error);
          }}
        >
          <option value="">Select employee</option>
          {employees.map((employee) => (
            <option key={employee._id} value={employee._id}>
              {employee.name}
            </option>
          ))}
        </select>

        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          <option value="">Select template</option>
          {templates.map((template) => (
            <option key={template._id} value={template._id}>
              {template.name}
            </option>
          ))}
        </select>

        <button onClick={handleAssign} disabled={loading}>
          {loading ? "Assigning..." : "Assign Onboarding"}
        </button>
      </section>

      <section>
        <h2>Tasks</h2>

        {tasks.length === 0 && <p>No onboarding tasks.</p>}

        {tasks.map((task) => (
          <div key={task._id}>
            <strong>{task.title}</strong>
            <p>{task.description}</p>
            <p>Status: {task.status}</p>
            <p>
              Due:{" "}
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "—"}
            </p>

            {task.status !== "completed" && (
              <>
                <button
                  onClick={() =>
                    updateTask(task._id, "in_progress")
                  }
                >
                  In Progress
                </button>

                <button
                  onClick={() =>
                    updateTask(task._id, "completed")
                  }
                >
                  Complete
                </button>
              </>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}