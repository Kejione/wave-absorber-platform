import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import get_settings

settings = get_settings()

ALLOWED_EXTENSIONS = {".dat", ".eu", ".xlsx"}


def validate_file(filename: str) -> None:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"不支持的文件格式: {ext}，仅支持 .dat/.eu/.xlsx")


async def save_upload_file(file: UploadFile) -> str:
    validate_file(file.filename)

    ext = Path(file.filename).suffix.lower()
    saved_name = f"{uuid.uuid4()}{ext}"
    save_path = os.path.join(settings.UPLOAD_DIR, saved_name)

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小超过50MB限制")

    with open(save_path, "wb") as f:
        f.write(content)

    return save_path


def delete_file(file_path: str) -> None:
    if file_path and os.path.exists(file_path):
        os.remove(file_path)
