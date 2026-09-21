import { useEffect, useRef, useState } from "react";
import "./App.css";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";

type Assignment = {
  id: number;
  name: string;
  date: string;
  dueDate: string;
  className: string;
  priority: Priority;
  completed: boolean;
  completedAt?: number;
};

type Settings = {
  darkMode: boolean;
  dateFormat: DateFormat;
};

const priorityOrder: Record<Priority, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function App() {
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem("homeworkAssignments");

    if (!saved) {
      return [];
    }

    try {
      const parsed = JSON.parse(saved);

      return parsed.map((assignment: Assignment) => ({
        ...assignment,
        completed: assignment.completed ?? false,
      }));
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("homeworkTrackerSettings");

    if (!saved) {
      return {
        darkMode: false,
        dateFormat: "MM/DD/YYYY",
      };
    }

    try {
      return JSON.parse(saved);
    } catch {
      return {
        darkMode: false,
        dateFormat: "MM/DD/YYYY",
      };
    }
  });

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [className, setClassName] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");

  const [showSettings, setShowSettings] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(
      "homeworkAssignments",
      JSON.stringify(assignments)
    );
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem(
      "homeworkTrackerSettings",
      JSON.stringify(settings)
    );
  }, [settings]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function addAssignment() {
    if (!name.trim()) {
      return;
    }

    const newAssignment: Assignment = {
      id: Date.now(),
      name: name.trim(),
      date,
      dueDate,
      className: className.trim(),
      priority,
      completed: false,
    };

    setAssignments((current) => [...current, newAssignment]);

    setName("");
    setDate("");
    setDueDate("");
    setClassName("");
    setPriority("Medium");
  }

  function deleteAssignment(id: number) {
    setAssignments((current) =>
      current.filter((assignment) => assignment.id !== id)
    );
  }

  function toggleCompleted(id: number) {
    setAssignments((current) =>
      current.map((assignment) => {
        if (assignment.id !== id) {
          return assignment;
        }

        if (assignment.completed) {
          return {
            ...assignment,
            completed: false,
            completedAt: undefined,
          };
        }

        return {
          ...assignment,
          completed: true,
          completedAt: Date.now(),
        };
      })
    );
  }

  function formatDate(value: string) {
    if (!value) {
      return "";
    }

    const [year, month, day] = value.split("-");

    if (settings.dateFormat === "DD/MM/YYYY") {
      return `${day}/${month}/${year}`;
    }

    if (settings.dateFormat === "YYYY-MM-DD") {
      return `${year}-${month}-${day}`;
    }

    return `${month}/${day}/${year}`;
  }

  function formatCompletedDate(timestamp?: number) {
    if (!timestamp) {
      return "";
    }

    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    if (settings.dateFormat === "DD/MM/YYYY") {
      return `${day}/${month}/${year}`;
    }

    if (settings.dateFormat === "YYYY-MM-DD") {
      return `${year}-${month}-${day}`;
    }

    return `${month}/${day}/${year}`;
  }

  const activeAssignments = assignments
    .filter((assignment) => !assignment.completed)
    .sort(
      (a, b) =>
        priorityOrder[b.priority] - priorityOrder[a.priority]
    );

  const completedAssignments = assignments
    .filter((assignment) => assignment.completed)
    .sort((a, b) => {
      const aCompleted = a.completedAt ?? 0;
      const bCompleted = b.completedAt ?? 0;

      return bCompleted - aCompleted;
    });

  return (
    <div className={settings.darkMode ? "app dark" : "app"}>
      <header className="header">
        <div>
          <h1>Homework Tracker</h1>
          <p>Keep track of your assignments</p>
        </div>

        <div className="settings-wrapper" ref={settingsRef}>
          <button
            className="settings-button"
            onClick={() => setShowSettings((current) => !current)}
          >
            ⚙ Settings
          </button>

          {showSettings && (
            <div className="settings-panel">
              <h2>Settings</h2>

              <div className="setting-row">
                <div>
                  <strong>Dark Mode</strong>
                  <p>Change the appearance of the app</p>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        darkMode: event.target.checked,
                      }))
                    }
                  />

                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Date Format</strong>
                  <p>Choose how dates are displayed</p>
                </div>

                <select
                  value={settings.dateFormat}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      dateFormat: event.target.value as DateFormat,
                    }))
                  }
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="form-card">
          <h2>Add Assignment</h2>

          <div className="form-grid">
            <div className="form-group assignment-name">
              <label>Assignment Name *</label>

              <input
                type="text"
                placeholder="e.g. Math Homework"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Class</label>

              <input
                type="text"
                placeholder="e.g. Math"
                value={className}
                onChange={(event) => setClassName(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Date Assigned</label>

              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Due Date</label>

              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Priority</label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as Priority)
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <button className="add-button" onClick={addAssignment}>
            + Add Assignment
          </button>
        </section>

        <section className="assignments-section">
          <div className="section-heading">
            <h2>Assignments</h2>
            <span>{activeAssignments.length}</span>
          </div>

          {activeAssignments.length === 0 ? (
            <div className="empty-state">
              <p>No active assignments.</p>
            </div>
          ) : (
            <div className="assignment-list">
              {activeAssignments.map((assignment) => (
                <div className="assignment-card" key={assignment.id}>
                  <label className="assignment-checkbox">
                    <input
                      type="checkbox"
                      checked={assignment.completed}
                      onChange={() => toggleCompleted(assignment.id)}
                    />

                    <span className="custom-checkbox"></span>
                  </label>

                  <div className="assignment-content">
                    <div className="assignment-top">
                      <h3>{assignment.name}</h3>

                      <span
                        className={`priority-badge ${assignment.priority.toLowerCase()}`}
                      >
                        {assignment.priority}
                      </span>
                    </div>

                    <div className="assignment-details">
                      {assignment.className && (
                        <span>📚 {assignment.className}</span>
                      )}

                      {assignment.date && (
                        <span>
                          Assigned: {formatDate(assignment.date)}
                        </span>
                      )}

                      {assignment.dueDate && (
                        <span>
                          Due: {formatDate(assignment.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className="delete-button"
                    onClick={() => deleteAssignment(assignment.id)}
                    title="Delete assignment"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {completedAssignments.length > 0 && (
          <section className="assignments-section completed-section">
            <button
              className="completed-dropdown-button"
              onClick={() =>
                setShowCompleted((current) => !current)
              }
            >
              <div className="section-heading">
                <h2>Completed Assignments</h2>
                <span>{completedAssignments.length}</span>
              </div>

              <span
                className={`dropdown-arrow ${
                  showCompleted ? "open" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {showCompleted && (
              <div className="assignment-list">
                {completedAssignments.map((assignment) => (
                  <div
                    className="assignment-card completed-card"
                    key={assignment.id}
                  >
                    <label className="assignment-checkbox">
                      <input
                        type="checkbox"
                        checked={assignment.completed}
                        onChange={() =>
                          toggleCompleted(assignment.id)
                        }
                      />

                      <span className="custom-checkbox"></span>
                    </label>

                    <div className="assignment-content">
                      <div className="assignment-top">
                        <h3>{assignment.name}</h3>

                        <span
                          className={`priority-badge ${assignment.priority.toLowerCase()}`}
                        >
                          {assignment.priority}
                        </span>
                      </div>

                      <div className="assignment-details">
                        {assignment.className && (
                          <span>📚 {assignment.className}</span>
                        )}

                        {assignment.dueDate && (
                          <span>
                            Due: {formatDate(assignment.dueDate)}
                          </span>
                        )}

                        {assignment.completedAt && (
                          <span>
                            Completed:{" "}
                            {formatCompletedDate(
                              assignment.completedAt
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deleteAssignment(assignment.id)
                      }
                      title="Delete assignment"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;