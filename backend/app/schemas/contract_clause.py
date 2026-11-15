"""
Schemas for clauses. These read and write the same `clauses` table that
AI extraction fills, so manual edits and extracted clauses live together.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.clause import ClauseType


class ContractClauseCreate(BaseModel):
    contract_id: int
    clause_number: Optional[str] = None
    title: Optional[str] = None
    type: ClauseType = ClauseType.OTHER
    text: Optional[str] = None
    summary: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    is_important: bool = False
    confidence: Optional[float] = None

class ContractClauseUpdate(BaseModel):
    clause_number: Optional[str] = None
    title: Optional[str] = None
    type: Optional[ClauseType] = None
    text: Optional[str] = None
    summary: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    is_important: Optional[bool] = None
    confidence: Optional[float] = None

class ContractClauseResponse(BaseModel):
    id: int
    contract_id: int
    clause_number: Optional[str] = None
    title: Optional[str] = None
    type: Optional[ClauseType] = None
    text: Optional[str] = None
    summary: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    is_important: bool
    confidence: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
