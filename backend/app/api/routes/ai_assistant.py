from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.settings import AIQueryRequest, AIQueryResponse
from app.api.deps import get_current_user, require_hr_or_admin
from app.services.ai_assistant_service import AIAssistantService, detect_attendance_anomalies

router = APIRouter(prefix="/ai", tags=["AI HR Assistant & Insights"])


@router.post("/query", response_model=AIQueryResponse)
def query_ai_assistant(
    query_in: AIQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = AIAssistantService.process_query(db, current_user, query_in.prompt)
    return AIQueryResponse(
        answer=result["answer"],
        context_type=result.get("context_type", "GENERAL"),
        suggested_actions=result.get("suggested_actions", []),
        generated_at=datetime.utcnow()
    )


@router.get("/anomalies", response_model=List[Dict[str, Any]])
def get_attendance_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    return detect_attendance_anomalies(db)
