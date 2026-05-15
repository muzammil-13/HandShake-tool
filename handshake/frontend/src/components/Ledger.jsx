const STATE_LABELS = {
  pending: 'Pending',
  active: 'Active',
  verifying: 'Verifying',
  done: 'Done',
  snoozed: 'Snoozed',
}

function ageLabel(createdAt) {
  if (!createdAt) return 'n/a'
  const diffHours = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 3600000))
  if (diffHours < 1) return '<1h'
  if (diffHours < 24) return `${diffHours}h`
  return `${Math.floor(diffHours / 24)}d`
}

function peerNames(commitment, usersById, currentUserId) {
  const requester = usersById[commitment.requester_id]?.name || commitment.requester_id
  const assignee = usersById[commitment.assignee_id]?.name || commitment.assignee_id
  const role = commitment.requester_id === currentUserId ? 'requested' : 'assigned'
  return `${role} / ${requester} -> ${assignee}`
}

export default function Ledger({ commitments, currentUserId, usersById }) {
  if (!commitments.length) {
    return <div className="empty-panel">No ledger entries yet.</div>
  }

  return (
    <div className="ledger-panel">
      <div className="section-heading compact">
        <div>
          <h2>Ledger</h2>
          <p>Full history for both sides of your handshakes.</p>
        </div>
      </div>

      <div className="ledger-table" role="table" aria-label="Commitment ledger">
        <div className="ledger-row ledger-head" role="row">
          <span role="columnheader">Task</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Age</span>
        </div>

        {commitments.map((commitment) => (
          <div className="ledger-row" key={commitment.id} role="row">
            <div className="ledger-task" role="cell">
              <strong>{commitment.title}</strong>
              <small>{peerNames(commitment, usersById, currentUserId)}</small>
            </div>
            <div role="cell">
              <span className={`state-pill ${commitment.state}`}>
                {STATE_LABELS[commitment.state] || commitment.state}
              </span>
            </div>
            <span className="ledger-age" role="cell">{ageLabel(commitment.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
