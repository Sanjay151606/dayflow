from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.document import DocumentType


class DocumentCreate(BaseModel):
    employee_id: int
    document_type: DocumentType = DocumentType.OTHER


class DocumentResponse(BaseModel):
    id: int
    employee_id: int
    document_type: DocumentType
    file_name: str
    file_url: str
    uploaded_by: Optional[int] = None
    created_at: datetime
    employee_name: Optional[str] = None

    class Config:
        from_attributes = True
