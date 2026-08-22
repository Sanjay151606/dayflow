import os
import shutil
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.document import Document, DocumentType
from app.schemas.document import DocumentResponse
from app.api.deps import get_current_user, get_current_active_employee, require_hr_or_admin
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    employee_id: int = Form(...),
    document_type: DocumentType = Form(DocumentType.OTHER),
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Authorization guard: Employees can only upload to their own profile
    if current_user.role == UserRole.EMPLOYEE and employee.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot upload documents for other employees")

    # Allowed extensions
    allowed_exts = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"}
    filename = file.filename or "unnamed_document"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File extension {ext} not allowed. Supported: {allowed_exts}")

    # Check directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Read and validate size (max 10MB)
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    doc_url = f"/api/v1/documents/file/{unique_filename}"
    doc = Document(
        employee_id=employee_id,
        document_type=document_type,
        file_name=filename,
        file_url=doc_url,
        uploaded_by=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="UPLOAD_DOCUMENT",
        entity="DOCUMENT",
        entity_id=str(doc.id),
        new_value={"type": doc.document_type.value, "file_name": doc.file_name},
        ip_address=request.client.host if (request and request.client) else None
    )

    return DocumentResponse(
        id=doc.id,
        employee_id=doc.employee_id,
        document_type=doc.document_type,
        file_name=doc.file_name,
        file_url=doc.file_url,
        uploaded_by=doc.uploaded_by,
        created_at=doc.created_at,
        employee_name=f"{employee.first_name} {employee.last_name}"
    )


@router.get("/me", response_model=List[DocumentResponse])
def get_my_documents(
    db: Session = Depends(get_db),
    employee: Employee = Depends(get_current_active_employee)
):
    docs = db.query(Document).options(joinedload(Document.employee)).filter(
        Document.employee_id == employee.id
    ).order_by(desc(Document.created_at)).all()

    return [
        DocumentResponse(
            id=d.id,
            employee_id=d.employee_id,
            document_type=d.document_type,
            file_name=d.file_name,
            file_url=d.file_url,
            uploaded_by=d.uploaded_by,
            created_at=d.created_at,
            employee_name=f"{employee.first_name} {employee.last_name}"
        )
        for d in docs
    ]


@router.get("/employee/{employee_id}", response_model=List[DocumentResponse])
def get_employee_documents(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    docs = db.query(Document).options(joinedload(Document.employee)).filter(
        Document.employee_id == employee_id
    ).order_by(desc(Document.created_at)).all()

    return [
        DocumentResponse(
            id=d.id,
            employee_id=d.employee_id,
            document_type=d.document_type,
            file_name=d.file_name,
            file_url=d.file_url,
            uploaded_by=d.uploaded_by,
            created_at=d.created_at,
            employee_name=f"{d.employee.first_name} {d.employee.last_name}" if d.employee else ""
        )
        for d in docs
    ]


@router.get("/file/{filename}")
def serve_document_file(filename: str):
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return FileResponse(file_path)


@router.delete("/{id}")
def delete_document(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).options(joinedload(Document.employee)).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Authorization guard: Only Admin/HR or the owner
    if current_user.role == UserRole.EMPLOYEE and (not doc.employee or doc.employee.user_id != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Remove file from disk
    stored_name = doc.file_url.split("/")[-1]
    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()

    log_audit_event(
        db,
        user_id=current_user.id,
        action="DELETE_DOCUMENT",
        entity="DOCUMENT",
        entity_id=str(id),
        old_value={"file_name": doc.file_name},
        ip_address=request.client.host if request.client else None
    )

    return {"message": "Document deleted successfully"}
