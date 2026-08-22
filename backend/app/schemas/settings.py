from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class SystemSettingBase(BaseModel):
    key: str
    value: str
    category: str = "GENERAL"
    description: Optional[str] = None


class SystemSettingUpdate(BaseModel):
    settings: Dict[str, str]


class SystemSettingResponse(SystemSettingBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class AIQueryRequest(BaseModel):
    prompt: str


class AIQueryResponse(BaseModel):
    answer: str
    context_type: str
    suggested_actions: List[str] = []
    generated_at: datetime
