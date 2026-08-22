import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class DocumentType(str, enum.Enum):
    RESUME = "RESUME"
    ID_PROOF = "ID_PROOF"
    PAN = "PAN"
    OFFER_LETTER = "OFFER_LETTER"
    JOINING_LETTER = "JOINING_LETTER"
    CERTIFICATE = "CERTIFICATE"
    SALARY_SLIP = "SALARY_SLIP"
    OTHER = "OTHER"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(Enum(DocumentType), default=DocumentType.OTHER, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="documents")
    uploader = relationship("User", foreign_keys=[uploaded_by])
