# Copilot Instructions for Handshake

## Quick Start

**Handshake** is a micro-commitment tracker built as a React + FastAPI + SQLite application. It tracks small promises between teammates without process overhead.

### Running Locally

**Backend (Terminal 1):**
```bash
cd handshake/backend
pip install fastapi uvicorn sqlalchemy  # or source a requirements.txt if it exists
uvicorn main:app --reload
# API at http://localhost:8000, docs at http://localhost:8000/docs
```

**Frontend (Terminal 2):**
```bash
cd handshake/frontend
npm install
npm start  # runs on http://localhost:3000 or 5173 depending on setup
```

The frontend has CORS configured to connect to both `localhost:3000` and `localhost:5173`, and the backend defaults to `X-User-Id: muzammil` if no header is sent.

---

## Architecture

### Full-Stack Overview

**Handshake** implements a **dual-sided accountability model** where commitments require mutual acknowledgment:

1. **Frontend (React)**: UI for creating, viewing, and managing commitments across three views:
   - **Mine Tab**: Commitments the user *requested* (they're the requester)
   - **Incoming Tab**: Commitments *assigned to them* (they're the assignee)
   - **Ledger Tab**: All commitments they're involved in (both sides)

2. **Backend (FastAPI)**: Stateless REST API handling:
   - User list and identity (simulated users via `X-User-Id` header, no real auth)
   - Commitment CRUD and state transitions
   - Role-based permission checks (requester vs. assignee)

3. **Database (SQLite)**: Single `commitments` table with:
   - `Commitment` model with UUID primary key
   - State enum: `pending` → `active` → `verifying` → `done` (with `snoozed` as lateral state)
   - Requester/assignee IDs, deadline, undeclared flag, snooze reason, work notes

### State Machine

```
Proposed (pending)
    ↓ [Assignee accepts]
Accepted (active)
    ├→ [Assignee marks done] Verifying
    │   ├→ [Requester verifies] Done ✓
    │   └→ [Requester rejects] Active (revision cycle)
    └→ [Either party] Snoozed (with reason)
        └→ [Either party] Active (resume)
```

**Permission rules:**
- `pending → active`: only assignee
- `active → verifying`: only assignee
- `verifying → done`: only requester
- `verifying → active`: only requester (rejection/revision)
- `* → snoozed`: either party (requires `snooze_reason`)
- `snoozed → active`: either party

---

## API Endpoints

All endpoints require `X-User-Id` header (default: "muzammil" if omitted).

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/users` | GET | List all simulated users (for dropdowns) |
| `/commitments/mine` | GET | Get commitments *requester created* |
| `/commitments/incoming` | GET | Get commitments *assigned to user* (excludes done) |
| `/commitments/ledger` | GET | Get all commitments *user is involved in* |
| `/commitments` | POST | Create new commitment |
| `/commitments/{id}` | PATCH | Update commitment (state transitions, notes, etc.) |
| `/health` | GET | Health check |

**Request/Response format:**

Create:
```json
{
  "title": "Review PR #42",
  "assignee_id": "suresh",
  "deadline": "2025-05-15T18:00:00",  // optional
  "is_undeclared": false
}
```

Update:
```json
{
  "state": "active",        // optional
  "snooze_reason": "In a fire drill",  // optional
  "work_note": "Done, see commit abc123"  // optional
}
```

---

## Key Conventions

### Backend (Python/FastAPI)

1. **User Simulation**: No real authentication. Users are hardcoded in `USERS` list in `main.py`. The `X-User-Id` header selects the active user. Always validate `get_current_user()` in routes that need context.

2. **Error Handling**: Use FastAPI's `HTTPException`:
   - 400 for invalid input or role violations
   - 403 for permission denied
   - 404 for missing resource

3. **State Transitions**: Always validate in the `/commitments/{id}` PATCH endpoint. Invalid transitions return 400 with a clear error message.

4. **Database Session**: Use `Depends(get_db)` to inject SQLAlchemy sessions. Sessions auto-commit and close properly.

### Frontend (React)

1. **API Client**: All HTTP calls go through `api.js`, which exports functions like `fetchCommitmentsMine()`, `updateCommitment(id, data)`, etc. Always import from here, not `axios` directly.

2. **User Switcher**: Top-right dropdown selects the active user. The selected ID is sent as `X-User-Id` header on every request. This simulates different team members' perspectives.

3. **State Rendering**: Components like `CommitmentCard.jsx` are state-aware—they render different buttons and styles based on the commitment's current state and the user's role.

4. **Component Structure**:
   - `App.jsx`: Root component, tab switching, user switcher, data fetching
   - `CommitmentCard.jsx`: Individual commitment card with role-aware actions
   - `NewHandshakeModal.jsx`: Form for creating new commitments
   - `Ledger.jsx`: Stats dashboard (simple version of Phase 1)

---

## Design & Visual Conventions

Per the system prompt in `.ai_assistant/`:

- **Theme**: Dark mode with Zinc/Slate palette (Tailwind/Radix UI style)
- **Typography**: Clean sans-serif (Inter/Geist preferred)
- **Vibe**: Sophisticated, low-friction, high-trust
  - Subtle borders, micro-interactions, soft shadows
  - Glassmorphism cards for pending states
  - No loud colors except soft amber/muted red for urgent states
  - "Ghost" icons for stale (>3 days, undeclared) commitments

---

## Files to Know

| Path | Purpose |
|------|---------|
| `.ai_assistant/Handshake_MVP_System_Prompt.md` | High-level design vision & component specs |
| `handshake/README.md` | Dev setup & quick architecture overview |
| `handshake/backend/main.py` | All FastAPI routes & user logic |
| `handshake/backend/models.py` | SQLAlchemy ORM (Commitment, CommitmentState) |
| `handshake/backend/schemas.py` | Pydantic request/response validation |
| `handshake/backend/database.py` | SQLite setup & session factory |
| `handshake/frontend/src/App.jsx` | Root component, tabs, user switcher |
| `handshake/frontend/src/api.js` | All HTTP calls & Axios config |
| `handshake/frontend/src/components/` | Reusable React components |

---

## When Modifying Code

### Adding a New Endpoint
1. Define request schema in `backend/schemas.py`
2. Add route in `backend/main.py`, always using `Depends(get_current_user)`
3. Validate role permissions before executing DB logic
4. Use existing `get_db` session pattern

### Adding a New State Transition
1. Update the state machine logic in `main.py`'s PATCH endpoint validation block
2. Add the new state to `CommitmentState` enum in `models.py` if needed
3. Update the state machine diagram in this file and comments

### Adding a Component
1. Keep components in `frontend/src/components/`
2. Import styles via `../styles/ComponentName.css`
3. Use the user context from `App.jsx` via props or API calls
4. Always send `X-User-Id` header via the `api.js` client

### Testing Changes
- Backend: Visit `http://localhost:8000/docs` for interactive OpenAPI docs
- Frontend: Use the user switcher to verify role-specific UIs work correctly
- State transitions: Test invalid transitions return 400, valid ones succeed

---

## Project Conventions

- **IDs**: UUIDs for commitments (set in models.py), string IDs for simulated users
- **Timestamps**: SQLite `DateTime` with `func.now()` for server defaults
- **Boolean strings**: Is/undeclared stored as "true"/"false" strings in DB (legacy; consider moving to bool)
- **No tests yet**: This is MVP. No linting or test runner configured.
- **No real auth**: User selection is via header for demo purposes only. In production, use proper session/token auth.

---

## Relevant Context from System Prompt

The MVP is designed for a **browser extension** eventually, with these phases:
- **Phase 1** (current): Minimal dashboard, tabs, user switcher, state transitions
- **Phase 2**: Slack/Teams integration
- **Phase 3**: Team insights & visibility
- **Phase 4**: Cross-tool commitment layer

Focus on the **state transitions** and **dual-sided handshake feeling** when building. The UI should make it clear when a commitment moves from *Proposed* → *Accepted* → *Verifying* → *Done*.
