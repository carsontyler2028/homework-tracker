import { useEffect, useRef, useState } from 'react'
import './App.css'

type Priority = 'Low' | 'Medium' | 'High' | 'Urgent'

type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'

type Assignment = {
  id: number
  name: string
  date: string
  dueDate: string
  className: string
  priority: Priority
}

type Settings = {
  darkMode: boolean
  dateFormat: DateFormat
}

const priorityOrder: Record<Priority, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
}

function App() {
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const savedAssignments = localStorage.getItem('homeworkAssignments')

    if (savedAssignments) {
      try {
        return JSON.parse(savedAssignments)
      } catch {
        return []
      }
    }

    return []
  })

  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [className, setClassName] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')

  const [settingsOpen, setSettingsOpen] = useState(false)

  const settingsRef = useRef<HTMLDivElement>(null)

  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('homeworkTrackerSettings')

    if (savedSettings) {
      try {
        return JSON.parse(savedSettings)
      } catch {
        // Use default settings
      }
    }

    return {
      darkMode: false,
      dateFormat: 'MM/DD/YYYY',
    }
  })

  useEffect(() => {
    localStorage.setItem(
      'homeworkAssignments',
      JSON.stringify(assignments),
    )
  }, [assignments])

  useEffect(() => {
    localStorage.setItem(
      'homeworkTrackerSettings',
      JSON.stringify(settings),
    )
  }, [settings])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false)
      }
    }

    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [settingsOpen])

  function updateSettings(changes: Partial<Settings>) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      ...changes,
    }))
  }

  function formatDate(dateString: string) {
    if (!dateString) {
      return ''
    }

    const [year, month, day] = dateString.split('-')

    switch (settings.dateFormat) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`

      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`

      case 'MM/DD/YYYY':
      default:
        return `${month}/${day}/${year}`
    }
  }

  function addAssignment() {
    if (!name.trim()) {
      return
    }

    const newAssignment: Assignment = {
      id: Date.now(),
      name: name.trim(),
      date,
      dueDate,
      className: className.trim(),
      priority,
    }

    setAssignments((currentAssignments) =>
      [...currentAssignments, newAssignment].sort(
        (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority],
      ),
    )

    setName('')
    setDate('')
    setDueDate('')
    setClassName('')
    setPriority('Medium')
  }

  function deleteAssignment(id: number) {
    setAssignments((currentAssignments) =>
      currentAssignments.filter((assignment) => assignment.id !== id),
    )
  }

  return (
    <main className={settings.darkMode ? 'app dark-mode' : 'app'}>
      <header className="header">
        <div>
          <h1>Homework Tracker</h1>
          <p>Keep track of your assignments</p>
        </div>

        <div className="settings-container" ref={settingsRef}>
          <button
            className="settings-button"
            onClick={() => setSettingsOpen((current) => !current)}
            aria-label="Open settings"
          >
            ⚙️ Settings
          </button>

          {settingsOpen && (
            <div className="settings-panel">
              <div className="settings-header">
                <h2>Settings</h2>

                <button
                  className="close-settings"
                  onClick={() => setSettingsOpen(false)}
                  aria-label="Close settings"
                >
                  ×
                </button>
              </div>

              <div className="setting">
                <div>
                  <strong>Dark Mode</strong>
                  <span>Use a darker appearance</span>
                </div>

                <button
                  className={
                    settings.darkMode
                      ? 'toggle active'
                      : 'toggle'
                  }
                  onClick={() =>
                    updateSettings({
                      darkMode: !settings.darkMode,
                    })
                  }
                  aria-label="Toggle dark mode"
                >
                  <span></span>
                </button>
              </div>

              <div className="setting-column">
                <label htmlFor="date-format">
                  <strong>Date Format</strong>
                  <span>Choose how dates are displayed</span>
                </label>

                <select
                  id="date-format"
                  value={settings.dateFormat}
                  onChange={(event) =>
                    updateSettings({
                      dateFormat: event.target.value as DateFormat,
                    })
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

      <section className="form-card">
        <h2>Add Assignment</h2>

        <div className="form-grid">
          <label>
            Assignment Name
            <input
              type="text"
              placeholder="Example: Chapter 5 Questions"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label>
            Class
            <input
              type="text"
              placeholder="Example: Math"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
            />
          </label>

          <label>
            Date Assigned
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          <label>
            Due Date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>

          <label>
            Priority
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as Priority)
              }
            >
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
        </div>

        <button className="add-button" onClick={addAssignment}>
          Add Assignment
        </button>
      </section>

      <section className="assignments-section">
        <div className="section-header">
          <h2>Assignments</h2>
          <span>{assignments.length}</span>
        </div>

        {assignments.length === 0 ? (
          <div className="empty-state">
            <p>No assignments yet.</p>
            <span>Add your first assignment above.</span>
          </div>
        ) : (
          <div className="assignment-list">
            {assignments.map((assignment) => (
              <article className="assignment-card" key={assignment.id}>
                <div className="assignment-main">
                  <div className="assignment-title-row">
                    <h3>{assignment.name}</h3>

                    <span
                      className={`priority priority-${assignment.priority.toLowerCase()}`}
                    >
                      {assignment.priority}
                    </span>
                  </div>

                  {assignment.className && (
                    <p className="class-name">
                      {assignment.className}
                    </p>
                  )}

                  <div className="assignment-details">
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
                  aria-label={`Delete ${assignment.name}`}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App