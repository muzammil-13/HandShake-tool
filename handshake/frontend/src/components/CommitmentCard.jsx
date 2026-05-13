import { useState } from 'react'
import { api } from '../api'

// How long ago / how far ahead is a date?
function timeLabel(dateStr) {
  if (!dateStr) return 'Undeclared'
  const diff = new Date(dateStr) - Date.now()
  const hours = Math.round(diff / 3600000)
  if (hours < 0) return `Overdue by ${Math.abs(hours)}h`
  if (hours < 24) return `Due in ${hours}h`
  return `Due in ${Math.ceil(hours / 24)}d`
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < Date.now()
}

// Who is the other person in this commitment?
function peerLabel(commitment, currentUserId, users) {
  const peerId =
    commitment.requester_id === currentUserId
      ? commitment.assignee_id
      : commitment.requester_id
  const peer = users.find((u) => u.id === peerId)
  return peer ? { name: peer.name, initials: peer.initials } : { name: peerId, initials: '?' }
}

const STATE_PILL = {
  pending:   { label: 'Pending',   cls: 'pill-pending' },
  active:    { label: 'Active',    cls: 'pill-active' },
  verifying: { label: 'Verifying', cls: 'pill-verifying' },
  done:      { label: '✓ Done',    cls: 'pill-done' },
  snoozed:   { label: 'Snoozed',  cls: 'pill-snoozed' },
}

export default function CommitmentCard({ commitment, currentUserId, users, onUpdate }) {
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [snoozeReason, setSnoozeReason] = useState('')
  const [workNote, setWorkNote] = useState('')
  const [workNoteOpen, setWorkNoteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const isRequester = commitment.requester_id === currentUserId
  const isAssignee = commitment.assignee_id === currentUserId
  const peer = peerLabel(commitment, currentUserId, users)
  const overdue = isOverdue(commitment.deadline)
  const pill = STATE_PILL[commitment.state] || { label: commitment.state, cls: 'pill-pending' }

  async function transition(state, extra = {}) {
    setLoading(true)
    try {
      const updated = await api.updateCommitment(commitment.id, { state, ...extra })
      onUpdate(updated)
    } finally {
      setLoading(false)
    }
  }

  async function submitSnooze() {
    await transition('snoozed', { snooze_reason: snoozeReason })
    setSnoozeOpen(false)
    setSnoozeReason('')
  }

  async function submitWorkNote() {
    await transition('verifying', { work_note: workNote })
    setWorkNoteOpen(false)
    setWorkNote('')
  }

  const cardClass = [
    'card',
    commitment.state === 'active' ? 'state-active' : '',
    commitment.state === 'verifying' ? 'state-verifying' : '',
    commitment.state === 'pending' ? 'state-pending' : '',
    commitment.state === 'done' ? 'state-done' : '',
    overdue && commitment.state === 'pending' ? 'state-urgent' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClass}>
      <div className="glass-overlay" />

      {/* Header row */}
      <div className="card-top">
        <div style={{ flex: 1 }}>
          <div className="card-title" style={commitment.state === 'done' ? { textDecoration: 'line-through', opacity: 0.5 } : {}}>
            {commitment.title}
          </div>
          <div className="card-meta" style={{ marginTop: 6 }}>
            <div className="meta-item">
              <div className="avatar av-blue">{peer.initials}</div>
              <span>{peer.name}</span>
            </div>
            <div className="meta-item" style={overdue ? { color: '#fca5a5' } : {}}>
              <span className="meta-icon">◷</span>
              <span>{timeLabel(commitment.deadline)}</span>
            </div>
            {commitment.is_undeclared && (
              <span className="soft-deadline-tag">
                <span className="tag-dot" />
                Soft deadline · 72h
              </span>
            )}
          </div>
        </div>
        <span className={`state-pill ${pill.cls}`}>{pill.label}</span>
      </div>

      {/* Work note from assignee (shown in verifying state) */}
      {commitment.state === 'verifying' && commitment.work_note && (
        <div className="work-note-box">
          <div className="work-note-label">WORK NOTE FROM ASSIGNEE</div>
          <div className="work-note-text">{commitment.work_note}</div>
        </div>
      )}

      {/* Snooze reason (shown when snoozed) */}
      {commitment.state === 'snoozed' && commitment.snooze_reason && (
        <div className="work-note-box" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
          <div className="work-note-label">SNOOZE REASON</div>
          <div className="work-note-text">{commitment.snooze_reason}</div>
        </div>
      )}

      {/* Actions — shown based on state + role */}
      {commitment.state !== 'done' && (
        <div className="card-actions">

          {/* ASSIGNEE: accept when pending */}
          {commitment.state === 'pending' && isAssignee && (
            <button className="btn btn-accept" onClick={() => transition('active')} disabled={loading}>
              ✓ Accept
            </button>
          )}

          {/* REQUESTER: nudge or withdraw when pending */}
          {commitment.state === 'pending' && isRequester && (
            <>
              <button className="btn" onClick={() => alert('Nudge sent!')} disabled={loading}>
                ↑ Nudge
              </button>
              <button className="btn btn-danger" onClick={() => alert('Withdrawn.')} disabled={loading}>
                ✗ Withdraw
              </button>
            </>
          )}

          {/* ASSIGNEE: mark done when active */}
          {commitment.state === 'active' && isAssignee && (
            <>
              {!workNoteOpen ? (
                <button className="btn btn-verify" onClick={() => setWorkNoteOpen(true)} disabled={loading}>
                  ✓ Mark Done
                </button>
              ) : (
                <div className="inline-form">
                  <input
                    className="snooze-input"
                    placeholder="Add a work note (optional)"
                    value={workNote}
                    onChange={(e) => setWorkNote(e.target.value)}
                  />
                  <button className="btn btn-verify" onClick={submitWorkNote} disabled={loading}>
                    Confirm
                  </button>
                  <button className="btn" onClick={() => setWorkNoteOpen(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}

          {/* REQUESTER: verify or request revision when verifying */}
          {commitment.state === 'verifying' && isRequester && (
            <>
              <button className="btn btn-verify" onClick={() => transition('done')} disabled={loading}>
                ✓ Verify & Close
              </button>
              <button className="btn btn-danger" onClick={() => transition('active')} disabled={loading}>
                ✗ Request Revision
              </button>
            </>
          )}

          {/* EITHER: resume when snoozed */}
          {commitment.state === 'snoozed' && (
            <button className="btn btn-accept" onClick={() => transition('active')} disabled={loading}>
              ▶ Resume
            </button>
          )}

          {/* Snooze (available in pending/active) */}
          {['pending', 'active'].includes(commitment.state) && (
            <div className="snooze-wrap">
              <button className="btn" onClick={() => setSnoozeOpen((o) => !o)} disabled={loading}>
                ⏸ Snooze
              </button>
              {snoozeOpen && (
                <div className="snooze-dropdown">
                  <div className="snooze-why">
                    <input
                      className="snooze-input"
                      placeholder="Why? e.g. In a fire drill"
                      value={snoozeReason}
                      onChange={(e) => setSnoozeReason(e.target.value)}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: 6, justifyContent: 'center' }}
                      onClick={submitSnooze}
                      disabled={loading}
                    >
                      Confirm Snooze
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}