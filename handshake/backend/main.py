from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import engine, get_db

# Create tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Handshake API")

# Allow the React dev server to talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Simulated users (no auth, just a header) ---
USERS = [
    {"id": "muzammil", "name": "Muzammil", "initials": "MZ"},
    {"id": "suresh",   "name": "Suresh R.", "initials": "SR"},
    {"id": "priya",    "name": "Priya T.",  "initials": "PT"},
    {"id": "arjun",    "name": "Arjun K.",  "initials": "AK"},
]
USER_MAP = {u["id"]: u for u in USERS}


def get_current_user(x_user_id: str = Header(default="muzammil")):
    """
    Read the active user from the X-User-Id header.
    Frontend sends this with every request based on the switcher dropdown.
    Defaults to 'muzammil' so the API works without the header too.
    """
    user = USER_MAP.get(x_user_id)
    if not user:
        raise HTTPException(status_code=400, detail=f"Unknown user: {x_user_id}")
    return user


# --- Routes ---

@app.get("/users")
def list_users():
    """Return all simulated users. Frontend uses this to populate dropdowns."""
    return USERS


@app.get("/commitments/mine", response_model=List[schemas.CommitmentOut])
def get_my_commitments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Commitments the current user requested (they own these)."""
    return (
        db.query(models.Commitment)
        .filter(models.Commitment.requester_id == current_user["id"])
        .order_by(models.Commitment.created_at.desc())
        .all()
    )


@app.get("/commitments/incoming", response_model=List[schemas.CommitmentOut])
def get_incoming_commitments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Commitments assigned TO the current user (they need to act on these)."""
    return (
        db.query(models.Commitment)
        .filter(models.Commitment.assignee_id == current_user["id"])
        .filter(models.Commitment.state != models.CommitmentState.done)
        .order_by(models.Commitment.created_at.desc())
        .all()
    )


@app.get("/commitments/ledger", response_model=List[schemas.CommitmentOut])
def get_ledger(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """All commitments involving the current user (both sides), including done."""
    uid = current_user["id"]
    return (
        db.query(models.Commitment)
        .filter(
            (models.Commitment.requester_id == uid) |
            (models.Commitment.assignee_id == uid)
        )
        .order_by(models.Commitment.created_at.desc())
        .all()
    )


@app.post("/commitments", response_model=schemas.CommitmentOut, status_code=201)
def create_commitment(
    body: schemas.CommitmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new commitment. Requester = current user. State starts as pending."""
    if body.assignee_id not in USER_MAP:
        raise HTTPException(status_code=400, detail="Unknown assignee")
    if body.assignee_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Can't assign a handshake to yourself")

    commitment = models.Commitment(
        title=body.title,
        requester_id=current_user["id"],
        assignee_id=body.assignee_id,
        deadline=body.deadline,
        is_undeclared=str(body.is_undeclared).lower(),
    )
    db.add(commitment)
    db.commit()
    db.refresh(commitment)
    return commitment


@app.patch("/commitments/{commitment_id}", response_model=schemas.CommitmentOut)
def update_commitment(
    commitment_id: str,
    body: schemas.CommitmentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    State transitions — who can do what:
      pending   → active     : assignee accepts
      active    → verifying  : assignee marks done (with optional work_note)
      verifying → done       : requester verifies
      verifying → active     : requester rejects (sends back for revision)
      any       → snoozed    : either party, with a snooze_reason
      snoozed   → active     : either party resumes
    """
    commitment = db.query(models.Commitment).filter(
        models.Commitment.id == commitment_id
    ).first()

    if not commitment:
        raise HTTPException(status_code=404, detail="Commitment not found")

    uid = current_user["id"]
    is_requester = commitment.requester_id == uid
    is_assignee = commitment.assignee_id == uid

    if not (is_requester or is_assignee):
        raise HTTPException(status_code=403, detail="Not your commitment")

    # Apply state transition if requested
    if body.state:
        new_state = body.state
        old_state = commitment.state

        # Validate who can make which transition
        valid = False
        if old_state == "pending"   and new_state == "active"    and is_assignee:  valid = True
        if old_state == "active"    and new_state == "verifying"  and is_assignee:  valid = True
        if old_state == "verifying" and new_state == "done"       and is_requester: valid = True
        if old_state == "verifying" and new_state == "active"     and is_requester: valid = True
        if new_state == "snoozed":                                                  valid = True
        if old_state == "snoozed"   and new_state == "active":                     valid = True

        if not valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid transition: {old_state} → {new_state} for your role"
            )
        commitment.state = new_state

    if body.snooze_reason is not None:
        commitment.snooze_reason = body.snooze_reason

    if body.work_note is not None:
        commitment.work_note = body.work_note

    db.commit()
    db.refresh(commitment)
    return commitment


@app.get("/health")
def health():
    return {"status": "ok"}