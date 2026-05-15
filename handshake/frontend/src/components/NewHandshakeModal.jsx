import { useMemo, useState } from 'react'
import { api } from '../api'

function localDateTimePlusHours(hours) {
  const date = new Date(Date.now() + hours * 3600000)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export default function NewHandshakeModal({ currentUserId, onClose, onCreate, users }) {
  const assignees = useMemo(() => users.filter((user) => user.id !== currentUserId), [currentUserId, users])
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState(assignees[0]?.id || '')
  const [deadline, setDeadline] = useState(localDateTimePlusHours(24))
  const [isUndeclared, setIsUndeclared] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (!title.trim()) {
      setError('Give the handshake a clear title.')
      return
    }

    if (!assigneeId) {
      setError('Choose a teammate.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const created = await api.createCommitment({
        title: title.trim(),
        assignee_id: assigneeId,
        deadline: isUndeclared ? null : new Date(deadline).toISOString(),
        is_undeclared: isUndeclared,
      })
      onCreate(created)
      onClose()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not create handshake.')
    } finally {
      setLoading(false)
    }
  }

  function toggleUndeclared() {
    setIsUndeclared((value) => !value)
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="handshake-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-header">
          <div>
            <h2>New Handshake</h2>
            <p>Make the ask explicit, then track the agreement.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>

        {error && <div className="notice error">{error}</div>}

        <label className="field-stack">
          <span>Title</span>
          <input
            autoFocus
            placeholder="Refactor auth middleware"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="field-stack">
          <span>Assignee</span>
          <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </label>

        <div className="field-stack">
          <span>Deadline</span>
          <div className="deadline-row">
            <input
              disabled={isUndeclared}
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
            <button
              className={isUndeclared ? 'toggle-pill active' : 'toggle-pill'}
              type="button"
              onClick={toggleUndeclared}
            >
              Undeclared
            </button>
          </div>
          {isUndeclared && <small>Soft 72h deadline. No hard due date is sent.</small>}
        </div>

        <div className="modal-actions">
          <button className="action-button" type="button" onClick={onClose}>Cancel</button>
          <button className="action-button primary" disabled={loading} type="submit">
            {loading ? 'Sending...' : 'Send Handshake'}
          </button>
        </div>
      </form>
    </div>
  )
}
