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

type AssignmentStorage = {
  version: number;
  assignments: Assignment[];
};

type SettingsStorage = {
  version: number;
  settings: Settings;
};

/*
 * Storage version
 *
 * Increase this number when we make a change to the stored
 * data structure that requires a migration.
 */
const STORAGE_VERSION = 1;

const ASSIGNMENTS_STORAGE_KEY = "homeworkAssignments";
const SETTINGS_STORAGE_KEY = "homeworkTrackerSettings";

const priorityOrder: Record<Priority, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

const defaultSettings: Settings = {
  darkMode: false,
  dateFormat: "MM/DD/YYYY",
};

/*
 * Loads assignments from localStorage.
 *
 * This supports both:
 *
 * 1. The old format:
 *    [
 *      { ...assignment }
 *    ]
 *
 * 2. The new versioned format:
 *    {
 *      version: 1,
 *      assignments: [...]
 *    }
 *
 * This means existing users won't lose their assignments
 * when this update is installed.
 */
function loadAssignments(): Assignment[] {
  const saved = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);

    /*
     * Legacy format
     *
     * Older versions stored the assignments directly as an array.
     */
    if (Array.isArray(parsed)) {
      return parsed.map((assignment: Assignment) => ({
        ...assignment,
        completed: assignment.completed ?? false,
      }));
    }

    /*
     * Versioned format
     */
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.assignments)
    ) {
      return parsed.assignments.map((assignment: Assignment) => ({
        ...assignment,
        completed: assignment.completed ?? false,
      }));
    }

    return [];
  } catch {
    return [];
  }
}

/*
 * Loads settings from localStorage.
 *
 * Like assignments, this supports both the old unversioned
 * format and the new versioned format.
 */
function loadSettings(): Settings {
  const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);

  if (!saved) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(saved);

    /*
     * Legacy settings format
     */
    if (
      parsed &&
      typeof parsed === "object" &&
      "darkMode" in parsed &&
      "dateFormat" in parsed
    ) {
      return {
        darkMode: parsed.darkMode ?? false,
        dateFormat: parsed.dateFormat ?? "MM/DD/YYYY",
      };
    }

    /*
     * Versioned settings format
     */
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.settings
    ) {
      return {
        darkMode: parsed.settings.darkMode ?? false,
        dateFormat:
          parsed.settings.dateFormat ?? "MM/DD/YYYY",
      };
    }

    return defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function App() {
  const [assignments, setAssignments] = useState<Assignment[]>(
    loadAssignments
  );

  const [settings, setSettings] = useState<Settings>(
    loadSettings
  );

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [className, setClassName] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");

  const [showSettings, setShowSettings] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editPriority, setEditPriority] =
    useState<Priority>("Medium");

  const settingsRef = useRef<HTMLDivElement>(null);

  /*
   * Save assignments using the versioned storage format.
   *
   * The storage key stays the same so existing data continues
   * to belong to this app.
   */
  useEffect(() => {
    const storageData: AssignmentStorage = {
      version: STORAGE_VERSION,
      assignments,
    };

    localStorage.setItem(
      ASSIGNMENTS_STORAGE_KEY,
      JSON.stringify(storageData)
    );
  }, [assignments]);

  /*
   * Save settings using the versioned storage format.
   */
  useEffect(() => {
    const storageData: SettingsStorage = {
      version: STORAGE_VERSION,
      settings,
    };

    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(storageData)
    );
  }, [settings]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(
          event.target as Node
        )
      ) {
        setShowSettings(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
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

    setAssignments((current) => [
      ...current,
      newAssignment,
    ]);

    setName("");
    setDate("");
    setDueDate("");
    setClassName("");
    setPriority("Medium");
  }

  function deleteAssignment(id: number) {
    setAssignments((current) =>
      current.filter(
        (assignment) => assignment.id !== id
      )
    );

    if (editingId === id) {
      setEditingId(null);
    }
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

  function startEditing(assignment: Assignment) {
    setEditingId(assignment.id);
    setEditName(assignment.name);
    setEditDate(assignment.date);
    setEditDueDate(assignment.dueDate);
    setEditClassName(assignment.className);
    setEditPriority(assignment.priority);
  }

  function cancelEditing() {
    setEditingId(null);
  }

  function saveEdit() {
    if (!editName.trim() || editingId === null) {
      return;
    }

    setAssignments((current) =>
      current.map((assignment) => {
        if (assignment.id !== editingId) {
          return assignment;
        }

        return {
          ...assignment,
          name: editName.trim(),
          date: editDate,
          dueDate: editDueDate,
          className: editClassName.trim(),
          priority: editPriority,
        };
      })
    );

    setEditingId(null);
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

    const completedDate = new Date(timestamp);

    const year = completedDate.getFullYear();

    const month = String(
      completedDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      completedDate.getDate()
    ).padStart(2, "0");

    if (settings.dateFormat === "DD/MM/YYYY") {
      return `${day}/${month}/${year}`;
    }

    if (settings.dateFormat === "YYYY-MM-DD") {
      return `${year}-${month}-${day}`;
    }

    return `${month}/${day}/${year}`;
  }

  function isSameDay(
    timestamp: number | undefined,
    date: Date
  ) {
    if (!timestamp) {
      return false;
    }

    const completedDate = new Date(timestamp);

    return (
      completedDate.getFullYear() ===
        date.getFullYear() &&
      completedDate.getMonth() === date.getMonth() &&
      completedDate.getDate() === date.getDate()
    );
  }

  function isDueWithinNextWeek(dueDate: string) {
    if (!dueDate) {
      return false;
    }

    const [year, month, day] =
      dueDate.split("-").map(Number);

    const due = new Date(
      year,
      month - 1,
      day
    );

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);

    nextWeek.setDate(
      today.getDate() + 7
    );

    return (
      due >= today &&
      due <= nextWeek
    );
  }

  const activeAssignments = assignments
    .filter(
      (assignment) => !assignment.completed
    )
    .sort(
      (a, b) =>
        priorityOrder[b.priority] -
        priorityOrder[a.priority]
    );

  const completedAssignments = assignments
    .filter(
      (assignment) => assignment.completed
    )
    .sort((a, b) => {
      const aCompleted =
        a.completedAt ?? 0;

      const bCompleted =
        b.completedAt ?? 0;

      return bCompleted - aCompleted;
    });

  const today = new Date();

  const completedToday =
    assignments.filter((assignment) =>
      isSameDay(
        assignment.completedAt,
        today
      )
    ).length;

  const dueNextWeek =
    assignments.filter(
      (assignment) =>
        !assignment.completed &&
        isDueWithinNextWeek(
          assignment.dueDate
        )
    ).length;

  return (
    <div
      className={
        settings.darkMode
          ? "app dark"
          : "app"
      }
    >
      <header className="header">
        <div>
          <h1>Homework Tracker</h1>
          <p>
            Keep track of your assignments
          </p>
        </div>

        <div
          className="settings-wrapper"
          ref={settingsRef}
        >
          <button
            className="settings-button"
            onClick={() =>
              setShowSettings(
                (current) => !current
              )
            }
          >
            ⚙ Settings
          </button>

          {showSettings && (
            <div className="settings-panel">
              <h2>Settings</h2>

              <div className="setting-row">
                <div>
                  <strong>
                    Dark Mode
                  </strong>

                  <p>
                    Change the appearance
                    of the app
                  </p>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={
                      settings.darkMode
                    }
                    onChange={(event) =>
                      setSettings(
                        (current) => ({
                          ...current,
                          darkMode:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-row">
                <div>
                  <strong>
                    Date Format
                  </strong>

                  <p>
                    Choose how dates are
                    displayed
                  </p>
                </div>

                <select
                  value={
                    settings.dateFormat
                  }
                  onChange={(event) =>
                    setSettings(
                      (current) => ({
                        ...current,
                        dateFormat:
                          event.target
                            .value as DateFormat,
                      })
                    )
                  }
                >
                  <option value="MM/DD/YYYY">
                    MM/DD/YYYY
                  </option>

                  <option value="DD/MM/YYYY">
                    DD/MM/YYYY
                  </option>

                  <option value="YYYY-MM-DD">
                    YYYY-MM-DD
                  </option>
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
              <label>
                Assignment Name *
              </label>

              <input
                type="text"
                placeholder="e.g. Math Homework"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Class</label>

              <input
                type="text"
                placeholder="e.g. Math"
                value={className}
                onChange={(event) =>
                  setClassName(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="form-group">
              <label>
                Date Assigned
              </label>

              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Due Date</label>

              <input
                type="date"
                value={dueDate}
                onChange={(event) =>
                  setDueDate(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="form-group">
              <label>Priority</label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target
                      .value as Priority
                  )
                }
              >
                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>

                <option value="Urgent">
                  Urgent
                </option>
              </select>
            </div>
          </div>

          <button
            className="add-button"
            onClick={addAssignment}
          >
            + Add Assignment
          </button>
        </section>

        <section className="statistics-line">
          <strong>Statistics:</strong>
          <span>Completed Today: {completedToday}</span>
          <span>Due Next 7 Days: {dueNextWeek}</span>
        </section>

        <section className="assignments-section">
          <div className="section-heading">
            <h2>Assignments</h2>
            <span>
              {activeAssignments.length}
            </span>
          </div>

          {activeAssignments.length ===
          0 ? (
            <div className="empty-state">
              <p>
                No active assignments.
              </p>
            </div>
          ) : (
            <div className="assignment-list">
              {activeAssignments.map(
                (assignment) => (
                  <div
                    className="assignment-card"
                    key={assignment.id}
                  >
                    {editingId ===
                    assignment.id ? (
                      <div className="edit-form">
                        <h3>
                          Edit Assignment
                        </h3>

                        <div className="edit-grid">
                          <div className="form-group">
                            <label>
                              Assignment
                              Name *
                            </label>

                            <input
                              type="text"
                              value={
                                editName
                              }
                              onChange={(
                                event
                              ) =>
                                setEditName(
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              Class
                            </label>

                            <input
                              type="text"
                              value={
                                editClassName
                              }
                              onChange={(
                                event
                              ) =>
                                setEditClassName(
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              Date Assigned
                            </label>

                            <input
                              type="date"
                              value={
                                editDate
                              }
                              onChange={(
                                event
                              ) =>
                                setEditDate(
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              Due Date
                            </label>

                            <input
                              type="date"
                              value={
                                editDueDate
                              }
                              onChange={(
                                event
                              ) =>
                                setEditDueDate(
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              Priority
                            </label>

                            <select
                              value={
                                editPriority
                              }
                              onChange={(
                                event
                              ) =>
                                setEditPriority(
                                  event
                                    .target
                                    .value as Priority
                                )
                              }
                            >
                              <option value="Low">
                                Low
                              </option>

                              <option value="Medium">
                                Medium
                              </option>

                              <option value="High">
                                High
                              </option>

                              <option value="Urgent">
                                Urgent
                              </option>
                            </select>
                          </div>
                        </div>

                        <div className="edit-actions">
                          <button
                            className="save-edit-button"
                            onClick={
                              saveEdit
                            }
                          >
                            Save Changes
                          </button>

                          <button
                            className="cancel-edit-button"
                            onClick={
                              cancelEditing
                            }
                          >
                            Cancel
                          </button>

                          <button
                            className="delete-edit-button"
                            onClick={() =>
                              deleteAssignment(
                                assignment.id
                              )
                            }
                          >
                            Delete Assignment
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <label className="assignment-checkbox">
                          <input
                            type="checkbox"
                            checked={
                              assignment.completed
                            }
                            onChange={() =>
                              toggleCompleted(
                                assignment.id
                              )
                            }
                          />

                          <span className="custom-checkbox"></span>
                        </label>

                        <div className="assignment-content">
                          <div className="assignment-top">
                            <h3>
                              {
                                assignment.name
                              }
                            </h3>

                            <span
                              className={`priority-badge ${assignment.priority.toLowerCase()}`}
                            >
                              {
                                assignment.priority
                              }
                            </span>
                          </div>

                          <div className="assignment-details">
                            {assignment.className && (
                              <span>
                                📚{" "}
                                {
                                  assignment.className
                                }
                              </span>
                            )}

                            {assignment.date && (
                              <span>
                                Assigned:{" "}
                                {formatDate(
                                  assignment.date
                                )}
                              </span>
                            )}

                            {assignment.dueDate && (
                              <span>
                                Due:{" "}
                                {formatDate(
                                  assignment.dueDate
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          className="edit-button"
                          onClick={() =>
                            startEditing(
                              assignment
                            )
                          }
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {completedAssignments.length >
          0 && (
          <section className="assignments-section completed-section">
            <button
              className="completed-dropdown-button"
              onClick={() =>
                setShowCompleted(
                  (current) => !current
                )
              }
            >
              <div className="section-heading">
                <h2>
                  Completed Assignments
                </h2>

                <span>
                  {
                    completedAssignments.length
                  }
                </span>
              </div>

              <span
                className={`dropdown-arrow ${
                  showCompleted
                    ? "open"
                    : ""
                }`}
              >
                ▼
              </span>
            </button>

            {showCompleted && (
              <div className="assignment-list">
                {completedAssignments.map(
                  (assignment) => (
                    <div
                      className="assignment-card completed-card"
                      key={
                        assignment.id
                      }
                    >
                      {editingId ===
                      assignment.id ? (
                        <div className="edit-form">
                          <h3>
                            Edit Assignment
                          </h3>

                          <div className="edit-grid">
                            <div className="form-group">
                              <label>
                                Assignment
                                Name *
                              </label>

                              <input
                                type="text"
                                value={
                                  editName
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditName(
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />
                            </div>

                            <div className="form-group">
                              <label>
                                Class
                              </label>

                              <input
                                type="text"
                                value={
                                  editClassName
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditClassName(
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />
                            </div>

                            <div className="form-group">
                              <label>
                                Date Assigned
                              </label>

                              <input
                                type="date"
                                value={
                                  editDate
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditDate(
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />
                            </div>

                            <div className="form-group">
                              <label>
                                Due Date
                              </label>

                              <input
                                type="date"
                                value={
                                  editDueDate
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditDueDate(
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />
                            </div>

                            <div className="form-group">
                              <label>
                                Priority
                              </label>

                              <select
                                value={
                                  editPriority
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditPriority(
                                    event
                                      .target
                                      .value as Priority
                                  )
                                }
                              >
                                <option value="Low">
                                  Low
                                </option>

                                <option value="Medium">
                                  Medium
                                </option>

                                <option value="High">
                                  High
                                </option>

                                <option value="Urgent">
                                  Urgent
                                </option>
                              </select>
                            </div>
                          </div>

                          <div className="edit-actions">
                            <button
                              className="save-edit-button"
                              onClick={
                                saveEdit
                              }
                            >
                              Save Changes
                            </button>

                            <button
                              className="cancel-edit-button"
                              onClick={
                                cancelEditing
                              }
                            >
                              Cancel
                            </button>

                            <button
                              className="delete-edit-button"
                              onClick={() =>
                                deleteAssignment(
                                  assignment.id
                                )
                              }
                            >
                              Delete Assignment
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <label className="assignment-checkbox">
                            <input
                              type="checkbox"
                              checked={
                                assignment.completed
                              }
                              onChange={() =>
                                toggleCompleted(
                                  assignment.id
                                )
                              }
                            />

                            <span className="custom-checkbox"></span>
                          </label>

                          <div className="assignment-content">
                            <div className="assignment-top">
                              <h3>
                                {
                                  assignment.name
                                }
                              </h3>

                              <span
                                className={`priority-badge ${assignment.priority.toLowerCase()}`}
                              >
                                {
                                  assignment.priority
                                }
                              </span>
                            </div>

                            <div className="assignment-details">
                              {assignment.className && (
                                <span>
                                  📚{" "}
                                  {
                                    assignment.className
                                  }
                                </span>
                              )}

                              {assignment.dueDate && (
                                <span>
                                  Due:{" "}
                                  {formatDate(
                                    assignment.dueDate
                                  )}
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
                            className="edit-button"
                            onClick={() =>
                              startEditing(
                                assignment
                              )
                            }
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;