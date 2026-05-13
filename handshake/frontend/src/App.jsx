import { useState, useEffect, useCallback } from 'react'
import { api, setActiveUser } from './api'
import CommitmentCard from './components/CommitmentCard'
import NewHandshakeModal from './components/NewHandshakeModal'
import Ledger from './components/Ledger'

export default function App() {
  const [tab, setTab] = useState('mine')
  const [modalOpen, setModalOpen] = useState(false)

  const [users, setUsers] = useState([])
  const [currentUserId, setCurrentUserId] = useState('muzammil')

  const [mine, setMine] = useState([])
  const [incoming, setIncoming] = useState([])
  const [ledger, setLedger] = useState([])
  const [loading, setLoading] = useState(true)

  // Load users once on mount
  useEffect(() => {
    api.getUsers()
      .then((data) => {
        setUsers(Array.isArray(data) ? data : (data?.users || []))
      })
      .catch((err) => console.error("Failed to load users:", err))
  }, [])

  // Reload all data whenever the active user changes
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [m, i, l] = await Promise.all([
        api.getMine(),
        api.getIncoming(),
        api.getLedger(),
      ])
      setMine(Array.isArray(m) ? m : [])
      setIncoming(Array.isArray(i) ? i : [])
      setLedger(Array.isArray(l) ? l : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [currentUserId, loadAll])

  function switchUser(userId) {
    setCurrentUserId(userId)
    setActiveUser(userId)
    // loadAll() will be called via the useEffect above
  }

  // After a card action updates one commitment, splice it into local state
  // so we don't need a full refetch
  function handleUpdate(updated) {
    const splice = (list) =>
      list.map((c) => (c.id === updated.id ? updated : c))

    setMine((prev) => splice(prev))
    setIncoming((prev) =>
      // Remove from incoming if done
      updated.state === 'done'
        ? prev.filter((c) => c.id !== updated.id)
        : splice(prev)
    )
    setLedger((prev) => splice(prev))
  }

  function handleCreate(newCommitment) {
    // Immediately prepend to mine + ledger without refetch
    setMine((prev) => [newCommitment, ...prev])
    setLedger((prev) => [newCommitment, ...prev])
  }

  const currentUser = Array.isArray(users) ? users.find((u) => u.id === currentUserId) : null
  const incomingPending = Array.isArray(incoming) ? incoming.filter((c) => c.state === 'pending').length : 0

  return (
    <div className="shell">
      {/* Header */}
      <div className="header">
        <div className="logo">
          <div className="logo-icon">🤝</div>
          Handshake
        </div>
        <div className="header-actions">
          {/* User switcher — simulates being a different teammate */}
          <select
            className="user-switcher"
            value={currentUserId}
            onChange={(e) => switchUser(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <button className="btn-new" onClick={() => setModalOpen(true)}>
            + New
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div
          className={`tab ${tab === 'mine' ? 'active' : ''}`}
          onClick={() => setTab('mine')}
        >
        Mine {Array.isArray(mine) && mine.filter((c) => c.state !== 'done').length > 0 && <span className="tab-dot" />}
        </div>
        <div
          className={`tab ${tab === 'incoming' ? 'active' : ''}`}
          onClick={() => setTab('incoming')}
        >
          Incoming {incomingPending > 0 && <span className="tab-dot" />}
        </div>
        <div
          className={`tab ${tab === 'ledger' ? 'active' : ''}`}
          onClick={() => setTab('ledger')}
        >
          Ledger
        </div>
      </div>

      {/* Body */}
      <div className="body">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : (
          <>
            {/* MINE tab */}
            {tab === 'mine' && (
              <>
                <div className="section-label">Your commitments</div>
                {mine.length === 0 ? (
                  <div className="empty-state">
                    No commitments yet.
                    <br />
                    Hit "+ New" to create one.
                  </div>
                ) : (
                  mine.map((c) => (
                    <CommitmentCard
                      key={c.id}
                      commitment={c}
                      currentUserId={currentUserId}
                      users={users}
                      onUpdate={handleUpdate}
                    />
                  ))
                )}
              </>
            )}

            {/* INCOMING tab */}
            {tab === 'incoming' && (
              <>
                <div className="section-label">Requests to you</div>
                {incoming.length === 0 ? (
                  <div className="empty-state">Nothing in your queue.</div>
                ) : (
                  incoming.map((c) => (
                    <CommitmentCard
                      key={c.id}
                      commitment={c}
                      currentUserId={currentUserId}
                      users={users}
                      onUpdate={handleUpdate}
                    />
                  ))
                )}
              </>
            )}

            {/* LEDGER tab */}
            {tab === 'ledger' && (
              <>
                <div className="section-label">Commitment ledger</div>
                <Ledger commitments={ledger} />
                <div
                  style={{
                    marginTop: 6,
                    padding: '8px 10px',
                    background: 'var(--surface)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontSize: 10,
                    color: 'var(--text3)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  All commitments involving you · both sides
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* New Handshake modal */}
      {modalOpen && (
        <NewHandshakeModal
          users={users}
          currentUserId={currentUserId}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}