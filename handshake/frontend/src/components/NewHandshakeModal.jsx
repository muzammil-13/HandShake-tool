import { useState } from 'react'
import { api } from '../api'

export default function NewHandshakeModal({ users, currentUserId, onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState(() => {
    // Default to first user that isn't the current user
    const others = users.filter((u) => u.id !== currentUserId)
    return others[0]?.id || ''
  })
  const [deadline, setDeadline] = useState('')
  const [isUndeclared, setIsUndeclared] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const otherUsers = users.filter((u) => u.id !== currentUserId)

  async function handleSubmit() {
    if (!title.trim()) {
      setError('Commitment title is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        title: title.trim(),
        assignee_id: assigneeId,
        is_undeclared: isUndeclared,
        deadline: isUndeclared || !deadline ? null : new Date(deadline).toISOString(),
      }
      const created = await api.createCommitment(payload)
      onCreate(created)
      onClose()
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">🤝 New Handshake</div>
        <div className="modal-sub">Create an accountability commitment with a teammate</div>

        {error && (
          <div style={{ color: '#fca5a5', fontSize: 11, marginBottom: 10 }}>{error}</div>
        )}

        <div className="field-label">Commitment</div>
        <input
          className="field-input"
          placeholder="What are you committing to?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <div className="field-label">Assignee</div>
        <select
          className="field-input"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          {otherUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <div className="field-label">Deadline</div>
        <div className="field-row">
          <input
            className="field-input"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={isUndeclared}
            style={{ flex: 1, marginBottom: 0 }}
          />
          <button
            className={`deadline-toggle ${isUndeclared ? 'active' : ''}`}
            onClick={() => {
              setIsUndeclared((v) => !v)
              if (!isUndeclared) setDeadline('')
            }}
          >
            Undeclared
          </button>
        </div>

        {isUndeclared && (
          <div style={{ marginBottom: 12 }}>
            <span className="soft-deadline-tag">
              <span className="tag-dot" />
              Soft deadline of 72h will be auto-applied
            </span>
          </div>
        )}

        <button className="btn-send" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Sending…' : 'Send Handshake →'}
        </button>
        <button
          className="btn"
          style={{ width: '100%', justifyContent: 'center', marginTop: 7 }}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}