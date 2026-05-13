from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CommitmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "pending"

class CommitmentCreate(CommitmentBase):
    handshake_id: int

class Commitment(CommitmentBase):
    id: int
    handshake_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class HandshakeBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "pending"

class HandshakeCreate(HandshakeBase):
    pass

class Handshake(HandshakeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
