import { useState } from 'react'
import { api } from '../api'

const STATE_META = {
  pending: { label: 'Pending', tone: 'pending' },
  active: { label: 'Active', tone: 'active' },
  verifying: { label: 'Verifying', tone: 'verifying' },
  done: { label: 'Done', tone: 'done' },
  snoozed: { label: 'Snoozed', tone: 'snoozed' },
}

function formatDeadline(deadline, isUndeclared) {
  if (isUndeclared) return 'Soft 72h'
  if (!deadline) return 'Undeclared'

  const dueAt = new Date(deadline)
  const diffMs = dueAt.getTime() - Date.now()
  const absHours = Math.max(1, Math.round(Math.abs(diffMs) / 3600000))

  if (diffMs < 0) return `Overdue ${absHours}h`
  if (absHours < 24) return `Due ${absHours}h`
  return `Due ${Math.ceil(absHours / 24)}d`
}

function formatDate(deadline) {
  if (!deadline) return 'No hard date'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(deadline))
}

function getPeer(commitment, currentUserId, usersById) {
  const peerId = commitment.requester_id === currentUserId
    ? commitment.assignee_id
    : commitment.requester_id
  return usersById[peerId] || { id: peerId, name: peerId, initials: peerId.slice(0, 2).toUpperCase() }
}

export default function CommitmentCard({ commitment, currentUserId, onUpdate, usersById }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [workNoteOpen, setWorkNoteOpen] = useState(false)
  const [workNote, setWorkNote] = useState(commitment.work_note || '')
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [snoozeReason, setSnoozeReason] = useState(commitment.snooze_reason || '')

  const isRequester = commitment.requester_id === currentUserId
  const isAssignee = commitment.assignee_id === currentUserId
  const isParticipant = isRequester || isAssignee
  const isOverdue = commitment.deadline
    && new Date(commitment.deadline) < new Date()
    && commitment.state !== 'done'
  const urgentPending = isOverdue && commitment.state === 'pending'
  const peer = getPeer(commitment, currentUserId, usersById)
  const stateMeta = STATE_META[commitment.state] || { label: commitment.state, tone: 'pending' }

  async function transition(state, extra = {}) {
    setBusy(true)
    setError('')
    try {
      const updated = await api.updateCommitment(commitment.id, { state, ...extra })
      onUpdate(updated)
      setWorkNoteOpen(false)
      setSnoozeOpen(false)
      setWorkNote(updated.work_note || '')
      setSnoozeReason(updated.snooze_reason || '')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  function submitWorkNote(event) {
    event.preventDefault()
    transition('verifying', { work_note: workNote.trim() || null })
  }

  function submitSnooze(event) {
    event.preventDefault()
    transition('snoozed', { snooze_reason: snoozeReason.trim() || 'Snoozed without reason' })
  }

  return (
    <article className={[
      'commitment-card',
      `state-${stateMeta.tone}`,
      urgentPending ? 'urgent-pending' : '',
    ].filter(Boolean).join(' ')}
    >
      <div className="card-main">
        <div className="card-copy">
          <div className="card-kicker">
            <span className="peer-avatar">{peer.initials}</span>
            <span>{isRequester ? `Assigned to ${peer.name}` : `Requested by ${peer.name}`}</span>
            <span className="meta-divider">/</span>
            <span>{commitment.id.slice(0, 8)}</span>
          </div>
          <h3>{commitment.title}</h3>
          <div className="metadata-row">
            <span className={isOverdue ? 'deadline overdue' : 'deadline'}>
              {formatDeadline(commitment.deadline, commitment.is_undeclared)}
            </span>
            <span>{formatDate(commitment.deadline)}</span>
            {commitment.is_undeclared && <span>Undeclared</span>}
          </div>
        </div>

        <span className={`state-pill ${stateMeta.tone}`}>{stateMeta.label}</span>
      </div>

      {commitment.work_note && (
        <div className="note-panel">
          <span>Work note</span>
          <p>{commitment.work_note}</p>
        </div>
      )}

      {commitment.state === 'snoozed' && commitment.snooze_reason && (
        <div className="note-panel snooze-note">
          <span>Snooze reason</span>
          <p>{commitment.snooze_reason}</p>
        </div>
      )}

      {error && <div className="inline-error">{error}</div>}

      {workNoteOpen && (
        <form className="inline-action" onSubmit={submitWorkNote}>
          <input
            placeholder="Short note on what changed"
            value={workNote}
            onChange={(event) => setWorkNote(event.target.value)}
          />
          <button className="action-button primary" disabled={busy} type="submit">Submit</button>
          <button className="action-button" disabled={busy} type="button" onClick={() => setWorkNoteOpen(false)}>
            Cancel
          </button>
        </form>
      )}

      {snoozeOpen && (
        <form className="inline-action" onSubmit={submitSnooze}>
          <input
            placeholder="Reason for snoozing"
            value={snoozeReason}
            onChange={(event) => setSnoozeReason(event.target.value)}
          />
          <button className="action-button warning" disabled={busy} type="submit">Snooze</button>
          <button className="action-button" disabled={busy} type="button" onClick={() => setSnoozeOpen(false)}>
            Cancel
          </button>
        </form>
      )}

      {isParticipant && commitment.state !== 'done' && (
        <div className="card-actions">
          {isAssignee && commitment.state === 'pending' && (
            <button className="action-button primary" disabled={busy} type="button" onClick={() => transition('active')}>
              Accept
            </button>
          )}

          {isAssignee && commitment.state === 'active' && !workNoteOpen && (
            <button className="action-button primary" disabled={busy} type="button" onClick={() => setWorkNoteOpen(true)}>
              Mark Done
            </button>
          )}

          {isRequester && commitment.state === 'verifying' && (
            <>
              <button className="action-button primary" disabled={busy} type="button" onClick={() => transition('done')}>
                Verify & Close
              </button>
              <button className="action-button danger" disabled={busy} type="button" onClick={() => transition('active')}>
                Request Revision
              </button>
            </>
          )}

          {['pending', 'active'].includes(commitment.state) && !snoozeOpen && (
            <button className="action-button" disabled={busy} type="button" onClick={() => setSnoozeOpen(true)}>
              Snooze
            </button>
          )}

          {commitment.state === 'snoozed' && (
            <button className="action-button primary" disabled={busy} type="button" onClick={() => transition('active')}>
              Resume
            </button>
          )}
        </div>
      )}
    </article>
  )
}
