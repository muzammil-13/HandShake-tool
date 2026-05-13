import React, { useMemo } from 'react';
import '../styles/Ledger.css';

function Ledger({ handshakes }) {
  const stats = useMemo(() => {
    return {
      total: handshakes.length,
      pending: handshakes.filter((h) => h.status === 'pending').length,
      completed: handshakes.filter((h) => h.status === 'completed').length,
      inProgress: handshakes.filter((h) => h.status === 'in_progress').length,
    };
  }, [handshakes]);

  return (
    <div className="ledger">
      <h2>Ledger</h2>
      <div className="stats-container">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item pending">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{stats.pending}</span>
        </div>
        <div className="stat-item in-progress">
          <span className="stat-label">In Progress</span>
          <span className="stat-value">{stats.inProgress}</span>
        </div>
        <div className="stat-item completed">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{stats.completed}</span>
        </div>
      </div>
    </div>
  );
}

export default Ledger;
