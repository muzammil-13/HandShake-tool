import React, { useState, useEffect } from 'react';
import CommitmentCard from './components/CommitmentCard';
import NewHandshakeModal from './components/NewHandshakeModal';
import Ledger from './components/Ledger';
import { fetchHandshakes } from './api';
import './App.css';

function App() {
  const [handshakes, setHandshakes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHandshakes();
  }, []);

  const loadHandshakes = async () => {
    try {
      setLoading(true);
      const data = await fetchHandshakes();
      setHandshakes(data);
    } catch (error) {
      console.error('Error loading handshakes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHandshake = async (newHandshake) => {
    await loadHandshakes();
    setShowModal(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>HandShake</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          New Handshake
        </button>
      </header>

      {showModal && (
        <NewHandshakeModal
          onClose={() => setShowModal(false)}
          onSuccess={handleCreateHandshake}
        />
      )}

      <main className="app-main">
        <div className="commitments-section">
          <h2>Commitments</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="commitments-grid">
              {handshakes.map((handshake) => (
                <CommitmentCard key={handshake.id} commitment={handshake} />
              ))}
            </div>
          )}
        </div>

        <aside className="ledger-section">
          <Ledger handshakes={handshakes} />
        </aside>
      </main>
    </div>
  );
}

export default App;
