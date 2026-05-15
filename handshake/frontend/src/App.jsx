import { useEffect, useMemo, useState } from 'react'
import { api, setActiveUser } from './api'
import CommitmentCard from './components/CommitmentCard'
import Ledger from './components/Ledger'
import NewHandshakeModal from './components/NewHandshakeModal'

const VIEWS = [
  { id: 'mine', label: 'Mine' },
  { id: 'incoming', label: 'Incoming' },
  { id: 'ledger', label: 'Ledger' },
]

function countOpen(items) {
  return items.filter((item) => item.state !== 'done').length
}

function isOverdue(commitment) {
  return commitment.deadline && new Date(commitment.deadline) < new Date() && commitment.state !== 'done'
}

export default function App() {
  const [activeView, setActiveView] = useState('mine')
  const [currentUserId, setCurrentUserId] = useState('muzammil')
  const [users, setUsers] = useState([])
  const [mine, setMine] = useState([])
  const [incoming, setIncoming] = useState([])
  const [ledger, setLedger] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const usersById = useMemo(() => {
    return users.reduce((map, user) => ({ ...map, [user.id]: user }), {})
  }, [users])

  const currentUser = usersById[currentUserId]

  useEffect(() => {
    api.getUsers()
      .then((data) => {
        const nextUsers = Array.isArray(data) ? data : []
        setUsers(nextUsers)
        if (nextUsers.length && !nextUsers.some((user) => user.id === currentUserId)) {
          setCurrentUserId(nextUsers[0].id)
          setActiveUser(nextUsers[0].id)
        }
      })
      .catch(() => setError('Could not load teammates.'))
  }, [currentUserId])

  useEffect(() => {
    let ignore = false
    setActiveUser(currentUserId)

    Promise.all([
      api.getMine(),
      api.getIncoming(),
      api.getLedger(),
    ])
      .then(([mineData, incomingData, ledgerData]) => {
        if (ignore) return
        setMine(Array.isArray(mineData) ? mineData : [])
        setIncoming(Array.isArray(incomingData) ? incomingData : [])
        setLedger(Array.isArray(ledgerData) ? ledgerData : [])
      })
      .catch((requestError) => {
        if (!ignore) {
          setError(requestError.response?.data?.detail || 'Could not load commitments.')
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [currentUserId])

  function handleUserChange(event) {
    setLoading(true)
    setError('')
    setCurrentUserId(event.target.value)
  }

  function mergeUpdatedCommitment(updatedCommitment) {
    const replace = (items) => items.map((item) => (
      item.id === updatedCommitment.id ? updatedCommitment : item
    ))

    setMine((items) => replace(items))
    setIncoming((items) => (
      updatedCommitment.state === 'done'
        ? items.filter((item) => item.id !== updatedCommitment.id)
        : replace(items)
    ))
    setLedger((items) => replace(items))
  }

  function handleCreate(createdCommitment) {
    setMine((items) => [createdCommitment, ...items])
    setLedger((items) => [createdCommitment, ...items])
  }

  const viewItems = activeView === 'mine' ? mine : incoming
  const overdueCount = ledger.filter(isOverdue).length
  const verifyingCount = ledger.filter((item) => item.state === 'verifying').length

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">H</div>
          <div>
            <h1>Handshake</h1>
            <p>Micro-commitments for engineering teams</p>
          </div>
        </div>

        <div className="topbar-actions">
          <label className="user-select">
            <span>Acting as</span>
            <select value={currentUserId} onChange={handleUserChange}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </label>
          <button className="primary-action" type="button" onClick={() => setIsModalOpen(true)}>
            New Handshake
          </button>
        </div>
      </header>

      <section className="command-strip" aria-label="Commitment summary">
        <div>
          <span className="metric-value">{countOpen(mine)}</span>
          <span className="metric-label">requested open</span>
        </div>
        <div>
          <span className="metric-value">{countOpen(incoming)}</span>
          <span className="metric-label">incoming open</span>
        </div>
        <div className={overdueCount ? 'metric-alert' : ''}>
          <span className="metric-value">{overdueCount}</span>
          <span className="metric-label">overdue</span>
        </div>
        <div className={verifyingCount ? 'metric-warn' : ''}>
          <span className="metric-value">{verifyingCount}</span>
          <span className="metric-label">to verify</span>
        </div>
      </section>

      <nav className="view-tabs" aria-label="Views">
        {VIEWS.map((view) => (
          <button
            className={activeView === view.id ? 'active' : ''}
            key={view.id}
            type="button"
            onClick={() => setActiveView(view.id)}
          >
            {view.label}
          </button>
        ))}
      </nav>

      {error && <div className="notice error">{error}</div>}

      <section className="workspace">
        {loading ? (
          <div className="empty-panel">Syncing commitments...</div>
        ) : activeView === 'ledger' ? (
          <Ledger commitments={ledger} usersById={usersById} currentUserId={currentUserId} />
        ) : (
          <>
            <div className="section-heading">
              <div>
                <h2>{activeView === 'mine' ? 'Mine' : 'Incoming'}</h2>
                <p>
                  {activeView === 'mine'
                    ? 'Commitments you requested and are tracking.'
                    : 'Requests assigned to you that need a response.'}
                </p>
              </div>
              {currentUser && <span className="identity-chip">{currentUser.initials}</span>}
            </div>

            {viewItems.length ? (
              <div className="card-list">
                {viewItems.map((commitment) => (
                  <CommitmentCard
                    commitment={commitment}
                    currentUserId={currentUserId}
                    key={commitment.id}
                    onUpdate={mergeUpdatedCommitment}
                    usersById={usersById}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-panel">
                {activeView === 'mine' ? 'No requested commitments yet.' : 'Your incoming queue is clear.'}
              </div>
            )}
          </>
        )}
      </section>

      {isModalOpen && (
        <NewHandshakeModal
          currentUserId={currentUserId}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreate}
          users={users}
        />
      )}
    </main>
  )
}
