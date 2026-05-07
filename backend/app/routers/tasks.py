import os
import json
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.task import Task
from app.schemas.task import TaskResponse, TaskDetailResponse
from app.routers.auth import get_current_user_id
from app.services.file_service import save_upload_file, delete_file
from datetime import datetime

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    file: UploadFile = File(...),
    params: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    file_path = await save_upload_file(file)

    parsed_params = {
        "thick_range": [0, 5, 0.01],
        "rl_threshold": -10,
        "im_threshold": [0.52, 1.93],
        "delta_threshold": 0.3,
    }
    if params:
        try:
            parsed_params = json.loads(params)
        except json.JSONDecodeError:
            pass

    task = Task(
        user_id=user_id,
        filename=file.filename,
        file_path=file_path,
        params=parsed_params,
        status="pending",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    return task


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    tasks = db.query(Task).filter(Task.user_id == user_id).order_by(Task.created_at.desc()).all()
    return tasks


@router.get("/{task_id}", response_model=TaskDetailResponse)
def get_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    result = None
    if task.status == "completed" and task.result_path:
        result_json_path = task.result_path.replace(".xlsx", ".json")
        if os.path.exists(result_json_path):
            with open(result_json_path, "r") as f:
                result = json.load(f)

    return TaskDetailResponse(
        id=task.id,
        filename=task.filename,
        status=task.status,
        params=task.params,
        error_message=task.error_message,
        created_at=task.created_at,
        completed_at=task.completed_at,
        result=result,
    )


@router.get("/{task_id}/download")
def download_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    if task.status != "completed" or not task.result_path:
        raise HTTPException(status_code=400, detail="任务未完成或无结果文件")

    return FileResponse(
        task.result_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"{task.filename}_结果.xlsx",
    )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    delete_file(task.file_path)
    delete_file(task.result_path)

    db.delete(task)
    db.commit()
