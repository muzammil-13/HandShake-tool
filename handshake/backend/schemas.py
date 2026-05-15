from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models import CommitmentState


# --- Request bodies ---

class CommitmentCreate(BaseModel):
    title: str
    assignee_id: str
    deadline: Optional[datetime] = None
    is_undeclared: bool = False


class CommitmentUpdate(BaseModel):
    state: Optional[CommitmentState] = None
    snooze_reason: Optional[str] = None
    work_note: Optional[str] = None


# --- Response bodies ---

class CommitmentOut(BaseModel):
    id: str
    title: str
    requester_id: str
    assignee_id: str
    state: CommitmentState
    deadline: Optional[datetime]
    is_undeclared: bool
    snooze_reason: Optional[str]
    work_note: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        # tells Pydantic to read from ORM objects, not just dicts
        from_attributes = True

    # Convert string "true"/"false" from DB to actual bool for the response
    @classmethod
    def from_orm(cls, obj):
        obj.is_undeclared = obj.is_undeclared == "true"
        return super().from_orm(obj)