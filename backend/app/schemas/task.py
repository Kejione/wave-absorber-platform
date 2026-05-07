from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class TaskCreate(BaseModel):
    thick_range: list[float] = [0, 5, 0.01]
    rl_threshold: float = -10
    im_threshold: list[float] = [0.52, 1.93]
    delta_threshold: float = 0.3


class TaskResponse(BaseModel):
    id: UUID
    filename: str
    status: str
    params: Optional[dict] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskDetailResponse(TaskResponse):
    result: Optional[dict] = None
