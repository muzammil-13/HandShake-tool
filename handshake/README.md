# 🤝 Handshake MVP

Micro-commitment tracker. React + FastAPI + SQLite.

## Run locally (two terminals)

### Terminal 1 — Backend
```bash
cd handshake/backend
pip install -r requirements.txt
uvicorn main:app --reload
# API running at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Terminal 2 — Frontend
```bash
cd handshake/frontend
npm install
npm run dev
# UI running at http://localhost:5173
```

## How it works

- The **user switcher** (top right dropdown) simulates being a different teammate.
  All API calls send `X-User-Id: <selected>` so you see each person's view.

- **Mine tab** — commitments you requested (you own them)
- **Incoming tab** — commitments assigned to you (you act on them)
- **Ledger tab** — all commitments you're involved in

## State machine

```
Proposed → Accepted → Verifying → Done
              ↕          ↕
           Snoozed   (reject → back to Active)
```

Who can do what:
- `pending → active` : assignee accepts
- `active → verifying` : assignee marks done (+ optional work note)
- `verifying → done` : requester verifies
- `verifying → active` : requester rejects (revision)
- `any → snoozed` : either party, with a reason

## API endpoints

```
GET  /users
GET  /commitments/mine
GET  /commitments/incoming
GET  /commitments/ledger
POST /commitments
PATCH /commitments/{id}
```

All requests need the `X-User-Id` header (handled automatically by the frontend).

## File structure

```
handshake/
├── backend/
│   ├── main.py        # FastAPI routes + CORS
│   ├── models.py      # SQLAlchemy ORM models
│   ├── schemas.py     # Pydantic request/response schemas
│   ├── database.py    # SQLite engine + session
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx              # Root: tabs, user switcher, data fetching
    │   ├── api.js               # All axios calls in one place
    │   ├── index.css            # Global styles (ported from original HTML)
    │   └── components/
    │       ├── CommitmentCard.jsx   # Card + state-aware action buttons
    │       ├── NewHandshakeModal.jsx
    │       └── Ledger.jsx
    ├── index.html
    ├── vite.config.js           # Proxy /api → localhost:8000
    └── package.json
```
