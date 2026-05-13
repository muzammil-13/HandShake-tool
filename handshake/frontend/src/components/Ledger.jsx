function ageLabel(createdAt) {
  const diff = Date.now() - new Date(createdAt)
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

const STATE_COLOR = {
  pending:   '#a1a1aa',
  active:    '#93c5fd',
  verifying: '#fcd34d',
  done:      '#6ee7b7',
  snoozed:   '#fcd34d',
}

export default function Ledger({ commitments }) {
  if (!commitments.length) {
    return <div className="empty-state">No commitments in the ledger yet.</div>
  }

  return (
    <div className="ledger">
      <div className="ledger-header">
        <span>Task</span>
        <span>Status</span>
        <span style={{ textAlign: 'right' }}>Age</span>
      </div>
      {commitments.map((c) => (
        <div className="ledger-row" key={c.id}>
          <div className="ledger-task">{c.title}</div>
          <div className="ledger-status" style={{ color: STATE_COLOR[c.state] }}>
            {c.state.charAt(0).toUpperCase() + c.state.slice(1)}
          </div>
          <div className="ledger-time">{ageLabel(c.created_at)}</div>
        </div>
      ))}
    </div>
  )
}