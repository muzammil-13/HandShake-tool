import React from 'react';
import '../styles/CommitmentCard.css';

function CommitmentCard({ commitment }) {
  return (
    <div className="commitment-card">
      <div className="card-header">
        <h3>{commitment.title}</h3>
        <span className={`status-badge status-${commitment.status}`}>
          {commitment.status}
        </span>
      </div>
      <p className="card-description">{commitment.description}</p>
      <div className="card-footer">
        <small>{new Date(commitment.created_at).toLocaleDateString()}</small>
      </div>
    </div>
  );
}

export default CommitmentCard;
