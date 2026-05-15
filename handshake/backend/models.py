from sqlalchemy import Column, String, DateTime, Text, Enum
from sqlalchemy.sql import func
import uuid
import enum

from database import Base


class CommitmentState(str, enum.Enum):
    pending = "pending"      # proposed, waiting for assignee to accept
    active = "active"        # accepted, work in progress
    verifying = "verifying"  # assignee marked done, requester must verify
    done = "done"            # both sides confirmed
    snoozed = "snoozed"      # temporarily deferred


class Commitment(Base):
    __tablename__ = "commitments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    requester_id = Column(String, nullable=False)   # who created it
    assignee_id = Column(String, nullable=False)    # who must do the work
    state = Column(Enum(CommitmentState), default=CommitmentState.pending, nullable=False)
    deadline = Column(DateTime, nullable=True)       # None = undeclared (soft 72h)
    is_undeclared = Column(String, default="false")  # "true" if no hard deadline
    snooze_reason = Column(Text, nullable=True)
    work_note = Column(Text, nullable=True)          # assignee's note when marking done
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())