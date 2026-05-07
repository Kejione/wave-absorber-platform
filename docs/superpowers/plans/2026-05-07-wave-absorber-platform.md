# 吸波材料计算平台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有的吸波材料电磁参数计算脚本重构为全栈Web平台（FastAPI + React），支持用户注册登录、文件上传、在线计算RL/IM/Delta、ECharts等高线图可视化、Excel结果下载。

**Architecture:** 前后端分离架构。FastAPI后端提供REST API，同步计算处理；React + Ant Design前端提供用户界面；PostgreSQL存储用户和任务数据；Docker Compose一键部署。计算核心为纯函数模块，从现有脚本提取。

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy, Alembic, React 18, TypeScript, Ant Design, ECharts, PostgreSQL 16, Docker, Nginx, JWT

---

## Phase 1: 项目初始化

### Task 1: 创建项目根目录结构和配置文件

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/requirements.txt`
- Create: `backend/Dockerfile`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `frontend/package.json`
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: 创建后端目录结构**

```bash
cd E:/claude_program/吸波材料计算平台
mkdir -p backend/app/models backend/app/schemas backend/app/routers backend/app/services backend/app/core backend/app/utils backend/uploads backend/results backend/alembic/versions
```

- [ ] **Step 2: 创建 backend/app/config.py**

```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/wave_absorber"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    UPLOAD_DIR: str = "/app/uploads"
    RESULT_DIR: str = "/app/results"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 3: 创建 backend/app/database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

settings = get_settings()

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 4: 创建 backend/app/__init__.py**

```python
```

- [ ] **Step 5: 创建 backend/app/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="吸波材料计算平台", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}
```

- [ ] **Step 6: 创建 backend/requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.35
alembic==1.13.0
psycopg2-binary==2.9.9
pydantic[email]==2.9.0
pydantic-settings==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.12
pandas==2.2.0
numpy==1.26.0
openpyxl==3.1.2
```

- [ ] **Step 7: 创建 backend/Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/uploads /app/results

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 8: 创建 .env.example**

```
DATABASE_URL=postgresql://postgres:postgres@db:5432/wave_absorber
SECRET_KEY=your-secret-key-change-in-production
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=wave_absorber
```

- [ ] **Step 9: 创建 docker-compose.yml**

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - uploads:/app/uploads
      - results:/app/results
    depends_on:
      - db
    env_file:
      - .env
    restart: unless-stopped

  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-wave_absorber}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
    restart: unless-stopped

volumes:
  uploads:
  results:
  pgdata:
```

- [ ] **Step 10: 创建 frontend/nginx.conf**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    client_max_body_size 50M;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

- [ ] **Step 11: 创建 frontend/Dockerfile**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

- [ ] **Step 12: 验证目录结构**

```bash
find backend -type f | sort
```

Expected output:
```
backend/Dockerfile
backend/app/__init__.py
backend/app/config.py
backend/app/database.py
backend/app/main.py
backend/requirements.txt
```

- [ ] **Step 13: Commit**

```bash
git add backend/ frontend/Dockerfile frontend/nginx.conf docker-compose.yml .env.example
git commit -m "feat: initialize project structure with Docker Compose"
```

---

### Task 2: 初始化前端项目

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/vite-env.d.ts`

- [ ] **Step 1: 创建 frontend/package.json**

```json
{
  "name": "wave-absorber-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "antd": "^5.20.0",
    "@ant-design/icons": "^5.4.0",
    "axios": "^1.7.0",
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.2",
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: 创建 frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 4: 创建 frontend/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>吸波材料计算平台</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建 frontend/src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 6: 创建 frontend/src/App.tsx**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>吸波材料计算平台</div>} />
    </Routes>
  )
}

export default App
```

- [ ] **Step 7: 创建 frontend/src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 8: 安装依赖并验证**

```bash
cd frontend
npm install
npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 9: Commit**

```bash
git add frontend/
git commit -m "feat: initialize React + TypeScript frontend with Vite"
```

---

### Task 3: 配置 Alembic 数据库迁移

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/script.py.mako`
- Create: `backend/alembic/versions/.gitkeep`

- [ ] **Step 1: 初始化 Alembic**

```bash
cd backend
alembic init alembic
```

- [ ] **Step 2: 修改 backend/alembic.ini**

在 `[alembic]` 部分设置：
```ini
sqlalchemy.url = postgresql://postgres:postgres@localhost:5432/wave_absorber
```

- [ ] **Step 3: 修改 backend/alembic/env.py**

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import Base
from app.config import get_settings

config = context.config
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 4: 验证 Alembic 配置**

```bash
cd backend
alembic current
```

Expected: 连接数据库成功（如果数据库未启动则报连接错误，这是正常的）。

- [ ] **Step 5: Commit**

```bash
git add backend/alembic.ini backend/alembic/
git commit -m "feat: configure Alembic for database migrations"
```

---

## Phase 2: 后端核心

### Task 4: 用户模型和认证

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/utils/security.py`
- Create: `backend/app/services/auth_service.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/auth.py`
- Test: `backend/tests/test_auth.py`

- [ ] **Step 1: 创建 backend/app/models/__init__.py**

```python
from app.models.user import User
from app.models.task import Task

__all__ = ["User", "Task"]
```

- [ ] **Step 2: 创建 backend/app/models/user.py**

```python
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
```

- [ ] **Step 3: 创建 backend/app/schemas/__init__.py**

```python
```

- [ ] **Step 4: 创建 backend/app/schemas/user.py**

```python
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

- [ ] **Step 5: 创建 backend/app/utils/security.py**

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
```

- [ ] **Step 6: 创建 backend/app/services/auth_service.py**

```python
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token
from app.utils.security import hash_password, verify_password, create_access_token


def register_user(db: Session, user_data: UserCreate) -> User:
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已存在")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="邮箱已注册")

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, login_data: UserLogin) -> Token:
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)


def get_current_user(db: Session, user_id: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    return user
```

- [ ] **Step 7: 创建 backend/app/utils/__init__.py**

```python
```

- [ ] **Step 8: 创建 backend/app/services/__init__.py**

```python
```

- [ ] **Step 9: 创建 backend/app/routers/__init__.py**

```python
```

- [ ] **Step 10: 创建 backend/app/routers/auth.py**

```python
from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import register_user, authenticate_user, get_current_user
from app.utils.security import decode_access_token
from fastapi import HTTPException

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="无效的token")
    return payload.get("sub")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user = register_user(db, user_data)
    return user


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    token = authenticate_user(db, login_data)
    return token


@router.get("/me", response_model=UserResponse)
def me(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = get_current_user(db, user_id)
    return user
```

- [ ] **Step 11: 更新 backend/app/main.py 注册路由**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth

app = FastAPI(title="吸波材料计算平台", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
```

- [ ] **Step 12: Commit**

```bash
git add backend/
git commit -m "feat: add user model, auth service, and auth API endpoints"
```

---

### Task 5: 任务模型和文件上传

**Files:**
- Create: `backend/app/models/task.py`
- Create: `backend/app/schemas/task.py`
- Create: `backend/app/services/file_service.py`
- Create: `backend/app/routers/tasks.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: 创建 backend/app/models/task.py**

```python
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    status = Column(String(20), default="pending")  # pending / processing / completed / failed
    params = Column(JSON, nullable=True)
    result_path = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="tasks")
```

- [ ] **Step 2: 创建 backend/app/schemas/task.py**

```python
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
```

- [ ] **Step 3: 创建 backend/app/services/file_service.py**

```python
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
```

- [ ] **Step 4: 创建 backend/app/routers/tasks.py**

```python
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
from app.services.calculation_service import run_calculation
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
        status="processing",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    try:
        result_path, result_data = run_calculation(file_path, parsed_params)
        task.status = "completed"
        task.result_path = result_path
        task.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
    except Exception as e:
        task.status = "failed"
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=500, detail=f"计算失败: {str(e)}")

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
        import json
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
```

- [ ] **Step 5: 更新 backend/app/main.py 注册任务路由**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, tasks

app = FastAPI(title="吸波材料计算平台", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
```

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: add task model, file upload, and task management API"
```

---

### Task 6: 核心计算模块 — data_reader

**Files:**
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/data_reader.py`
- Test: `backend/tests/test_data_reader.py`

- [ ] **Step 1: 创建 backend/app/core/__init__.py**

```python
```

- [ ] **Step 2: 创建 backend/app/core/data_reader.py**

从现有脚本 `RL-IM-DELTA.py` 的 `read_data` 函数重构：

```python
import numpy as np
import pandas as pd
from pathlib import Path


def read_data(file_path: str) -> dict:
    """读取电磁参数数据文件，支持 .dat / .eu / .xlsx 格式。

    Returns:
        dict: 包含 f(Hz), e(复数), u(复数), e_real, e_imag, u_real, u_imag
    """
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".dat":
        df = pd.read_csv(path, sep="\t", skiprows=2, header=None, encoding="utf-8")
        f = df.iloc[:, 0].values * 1e9
        e_real = df.iloc[:, 1].values
        e_imag = df.iloc[:, 2].values
        u_real = df.iloc[:, 3].values
        u_imag = df.iloc[:, 4].values
    elif suffix == ".eu":
        df = pd.read_csv(path, sep="\t", skiprows=13, header=None, encoding="ANSI")
        f = df.iloc[:, 0].values * 1e9
        e_real = df.iloc[:, 1].values
        e_imag = df.iloc[:, 2].values
        u_real = df.iloc[:, 4].values
        u_imag = df.iloc[:, 5].values
    elif suffix == ".xlsx":
        df = pd.read_excel(path, header=None, index_col=None)
        f = df.iloc[:, 0].values * 1e9
        e_real = df.iloc[:, 1].values
        e_imag = df.iloc[:, 2].values
        u_real = df.iloc[:, 3].values
        u_imag = df.iloc[:, 4].values
    else:
        raise ValueError(f"不支持的文件格式: {suffix}")

    e = e_real - 1j * e_imag
    u = u_real - 1j * u_imag

    return {
        "f": f,
        "e": e,
        "u": u,
        "e_real": e_real,
        "e_imag": e_imag,
        "u_real": u_real,
        "u_imag": u_imag,
    }
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/core/
git commit -m "feat: add data_reader module for .dat/.eu/.xlsx parsing"
```

---

### Task 7: 核心计算模块 — reflection_loss (RL + IM)

**Files:**
- Create: `backend/app/core/reflection_loss.py`
- Test: `backend/tests/test_reflection_loss.py`

- [ ] **Step 1: 创建 backend/app/core/reflection_loss.py**

从现有脚本 `RL-IM-DELTA.py` 的 `calculate_reflection_loss` 函数重构：

```python
import numpy as np
from cmath import sqrt, tanh


def calculate_rl_im(
    f: np.ndarray,
    e: np.ndarray,
    u: np.ndarray,
    thick_range: tuple[float, float, float],
) -> dict:
    """计算反射损耗(RL)和输入阻抗(IM)。

    Args:
        f: 频率数组 (Hz)
        e: 复数介电常数数组
        u: 复数磁导率数组
        thick_range: (起始厚度mm, 结束厚度mm, 步长mm)

    Returns:
        dict: {rl: 2D array, im: 2D array, frequency: array, thickness: array}
    """
    c = 299792458  # 光速
    thickness = np.arange(thick_range[0], thick_range[1] + thick_range[2], thick_range[2]) / 1000  # 转为米

    im_result = []
    rl_result = []

    for i in range(len(f)):
        im_list = []
        rl_list = []
        freq = f[i]
        for d in thickness:
            zin = sqrt(u[i] / e[i]) * tanh(1j * (2 * np.pi * freq * d / c) * sqrt(u[i] * e[i]))
            im = abs(zin)
            im_list.append(im)
            rl = 20 * np.log10(abs((zin - 1) / (zin + 1)))
            rl_list.append(rl)
        im_result.append(im_list)
        rl_result.append(rl_list)

    return {
        "rl": np.array(rl_result),
        "im": np.array(im_result),
        "frequency": f / 1e9,  # 转为GHz用于前端展示
        "thickness": np.arange(thick_range[0], thick_range[1] + thick_range[2], thick_range[2]),
    }


def calculate_area_ratio(values: np.ndarray, threshold: float, mode: str = "below") -> float:
    """计算面积占比。

    Args:
        values: 2D数组
        threshold: 阈值
        mode: "below" 表示小于阈值, "range" 表示在范围内(用于IM)

    Returns:
        float: 面积占比百分比
    """
    if mode == "below":
        mask = values <= threshold
    else:
        mask = values >= threshold[0] if isinstance(threshold, (list, tuple)) else values <= threshold

    pixel_count = np.sum(mask)
    total_count = values.size
    if total_count == 0:
        return 0.0
    return (pixel_count / total_count) * 100
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/core/reflection_loss.py
git commit -m "feat: add reflection_loss module for RL and IM calculation"
```

---

### Task 8: 核心计算模块 — delta

**Files:**
- Create: `backend/app/core/delta.py`
- Test: `backend/tests/test_delta.py`

- [ ] **Step 1: 创建 backend/app/core/delta.py**

从现有脚本 `RL-IM-DELTA.py` 的 `calculate_delta` 函数重构：

```python
import numpy as np


def calculate_delta(
    f: np.ndarray,
    thick_range: tuple[float, float, float],
    e_real: np.ndarray,
    e_imag: np.ndarray,
    u_real: np.ndarray,
    u_imag: np.ndarray,
) -> dict:
    """计算Delta参数。

    Args:
        f: 频率数组 (Hz)
        thick_range: (起始厚度mm, 结束厚度mm, 步长mm)
        e_real, e_imag, u_real, u_imag: 电磁参数实部虚部

    Returns:
        dict: {delta: 2D array, frequency: array, thickness: array}
    """
    thickness = np.arange(thick_range[0], thick_range[1] + thick_range[2], thick_range[2]) / 1000
    c = 299792458

    delta_result = []
    for i in range(len(f)):
        delta_list = []
        freq = f[i]
        for d in thickness:
            tane = np.arctan(e_imag[i] / e_real[i])
            tanu = np.arctan(u_imag[i] / u_real[i])
            k1 = e_real[i] * u_real[i]
            k2 = np.sqrt(e_real[i] * u_real[i])
            K = (4 * np.pi * k2 * np.sin((tane + tanu) / 2)) / (c * np.cos(tane) * np.cos(tanu))
            M = (4 * k1 * np.cos(tane) * np.cos(tanu)) / (
                (u_real[i] * np.cos(tane) - e_real[i] * np.cos(tanu)) ** 2
                + (np.tan((tanu - tane) / 2) * (u_real[i] * np.cos(tane) + e_real[i] * np.cos(tanu))) ** 2
            )
            delta = abs(np.sinh(K * freq * d) ** 2 - M)
            delta_list.append(delta)
        delta_result.append(delta_list)

    return {
        "delta": np.array(delta_result),
        "frequency": f / 1e9,
        "thickness": np.arange(thick_range[0], thick_range[1] + thick_range[2], thick_range[2]),
    }
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/core/delta.py
git commit -m "feat: add delta module for Delta parameter calculation"
```

---

### Task 9: 计算服务和Excel导出

**Files:**
- Create: `backend/app/utils/export.py`
- Create: `backend/app/services/calculation_service.py`
- Modify: `backend/app/routers/tasks.py`

- [ ] **Step 1: 创建 backend/app/utils/export.py**

```python
import json
import pandas as pd
import numpy as np
from pathlib import Path


def export_to_excel(rl_data: dict, im_data: dict, delta_data: dict, output_path: str) -> str:
    """将计算结果导出为Excel文件。"""
    rl_df = pd.DataFrame(rl_data["rl"], index=rl_data["frequency"], columns=rl_data["thickness"])
    im_df = pd.DataFrame(im_data["im"], index=im_data["frequency"], columns=im_data["thickness"])
    delta_df = pd.DataFrame(delta_data["delta"], index=delta_data["frequency"], columns=delta_data["thickness"])

    with pd.ExcelWriter(output_path) as writer:
        rl_df.to_excel(writer, sheet_name="RL")
        im_df.to_excel(writer, sheet_name="IM")
        delta_df.to_excel(writer, sheet_name="Delta")

    return output_path


def export_result_json(rl_data: dict, im_data: dict, delta_data: dict, area_ratios: dict, output_path: str) -> str:
    """将计算结果导出为JSON（用于前端图表渲染）。"""
    result = {
        "rl": {
            "frequency": rl_data["frequency"].tolist(),
            "thickness": rl_data["thickness"].tolist(),
            "values": rl_data["rl"].tolist(),
        },
        "im": {
            "frequency": im_data["frequency"].tolist(),
            "thickness": im_data["thickness"].tolist(),
            "values": im_data["im"].tolist(),
        },
        "delta": {
            "frequency": delta_data["frequency"].tolist(),
            "thickness": delta_data["thickness"].tolist(),
            "values": delta_data["delta"].tolist(),
        },
        "area_ratios": area_ratios,
    }

    with open(output_path, "w") as f:
        json.dump(result, f)

    return output_path
```

- [ ] **Step 2: 创建 backend/app/services/calculation_service.py**

```python
import os
from app.core.data_reader import read_data
from app.core.reflection_loss import calculate_rl_im, calculate_area_ratio
from app.core.delta import calculate_delta
from app.utils.export import export_to_excel, export_result_json
from app.config import get_settings

settings = get_settings()


def run_calculation(file_path: str, params: dict) -> tuple[str, dict]:
    """执行完整计算流程，返回结果文件路径和结果数据。"""
    data = read_data(file_path)

    thick_range = tuple(params.get("thick_range", [0, 5, 0.01]))
    rl_threshold = params.get("rl_threshold", -10)
    im_threshold = params.get("im_threshold", [0.52, 1.93])
    delta_threshold = params.get("delta_threshold", 0.3)

    rl_data = calculate_rl_im(data["f"], data["e"], data["u"], thick_range)
    delta_data = calculate_delta(
        data["f"], thick_range, data["e_real"], data["e_imag"], data["u_real"], data["u_imag"]
    )

    rl_area = calculate_area_ratio(rl_data["rl"], rl_threshold, mode="below")
    im_area = calculate_area_ratio(rl_data["im"], im_threshold, mode="range")
    delta_area = calculate_area_ratio(delta_data["delta"], delta_threshold, mode="below")

    area_ratios = {
        "rl": round(float(rl_area), 2),
        "im": round(float(im_area), 2),
        "delta": round(float(delta_area), 2),
    }

    base_name = os.path.splitext(os.path.basename(file_path))[0]
    excel_path = os.path.join(settings.RESULT_DIR, f"{base_name}_RL_IM_Delta.xlsx")
    json_path = os.path.join(settings.RESULT_DIR, f"{base_name}_RL_IM_Delta.json")

    export_to_excel(rl_data, rl_data, delta_data, excel_path)
    export_result_json(rl_data, rl_data, delta_data, area_ratios, json_path)

    return excel_path, {
        "rl": rl_data,
        "im": rl_data,
        "delta": delta_data,
        "area_ratios": area_ratios,
    }
```

- [ ] **Step 3: 更新 backend/app/routers/tasks.py 添加缺少的 import**

在文件顶部添加：
```python
import os
```

- [ ] **Step 4: Commit**

```bash
git add backend/
git commit -m "feat: add calculation service, Excel/JSON export"
```

---

## Phase 3: 前端核心

### Task 10: API请求封装和认证状态管理

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/auth.ts`
- Create: `frontend/src/api/tasks.ts`
- Create: `frontend/src/stores/auth.ts`
- Create: `frontend/src/utils/token.ts`

- [ ] **Step 1: 创建 frontend/src/api/client.ts**

```typescript
import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
```

- [ ] **Step 2: 创建 frontend/src/api/auth.ts**

```typescript
import client from './client'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  email: string
  password: string
}

export interface User {
  id: string
  username: string
  email: string
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export const authApi = {
  login: (params: LoginParams) => client.post<Token>('/auth/login', params),
  register: (params: RegisterParams) => client.post<User>('/auth/register', params),
  me: () => client.get<User>('/auth/me'),
}
```

- [ ] **Step 3: 创建 frontend/src/api/tasks.ts**

```typescript
import client from './client'

export interface Task {
  id: string
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  params: Record<string, unknown> | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface TaskDetail extends Task {
  result: {
    rl: { frequency: number[]; thickness: number[]; values: number[][] }
    im: { frequency: number[]; thickness: number[]; values: number[][] }
    delta: { frequency: number[]; thickness: number[]; values: number[][] }
    area_ratios: { rl: number; im: number; delta: number }
  } | null
}

export interface TaskCreateParams {
  thick_range?: [number, number, number]
  rl_threshold?: number
  im_threshold?: [number, number]
  delta_threshold?: number
}

export const tasksApi = {
  list: () => client.get<Task[]>('/tasks'),
  get: (id: string) => client.get<TaskDetail>(`/tasks/${id}`),
  create: (file: File, params?: TaskCreateParams) => {
    const formData = new FormData()
    formData.append('file', file)
    if (params) {
      formData.append('params', JSON.stringify(params))
    }
    return client.post<Task>('/tasks', formData)
  },
  download: (id: string) => client.get(`/tasks/${id}/download`, { responseType: 'blob' }),
  delete: (id: string) => client.delete(`/tasks/${id}`),
}
```

- [ ] **Step 4: 创建 frontend/src/utils/token.ts**

```typescript
export const getToken = () => localStorage.getItem('token')
export const setToken = (token: string) => localStorage.setItem('token', token)
export const removeToken = () => localStorage.removeItem('token')
export const isLoggedIn = () => !!getToken()
```

- [ ] **Step 5: 创建 frontend/src/stores/auth.tsx**

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, User } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/token'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (getToken()) {
      authApi.me().then(res => setUser(res.data)).catch(() => removeToken()).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (token: string) => {
    setToken(token)
    const res = await authApi.me()
    setUser(res.data)
  }

  const logout = () => {
    removeToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 6: 更新 frontend/src/main.tsx 使用 AuthProvider**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider } from '@/stores/auth'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/
git commit -m "feat: add API client, auth store, and token utilities"
```

---

### Task 11: 登录和注册页面

**Files:**
- Create: `frontend/src/pages/Login/index.tsx`
- Create: `frontend/src/pages/Register/index.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 创建 frontend/src/pages/Login/index.tsx**

```tsx
import { useState } from 'react'
import { Form, Input, Button, Card, message, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, LoginParams } from '@/api/auth'
import { useAuth } from '@/stores/auth'

const { Title } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const onFinish = async (values: LoginParams) => {
    setLoading(true)
    try {
      const res = await authApi.login(values)
      await login(res.data.access_token)
      message.success('登录成功')
      navigate('/')
    } catch {
      message.error('用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>吸波材料计算平台</Title>
        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            还没有账号？<Link to="/register">立即注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: 创建 frontend/src/pages/Register/index.tsx**

```tsx
import { useState } from 'react'
import { Form, Input, Button, Card, message, Typography } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, RegisterParams } from '@/api/auth'

const { Title } = Typography

export default function Register() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: RegisterParams) => {
    setLoading(true)
    try {
      await authApi.register(values)
      message.success('注册成功，请登录')
      navigate('/login')
    } catch {
      message.error('注册失败，用户名或邮箱可能已存在')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>注册账号</Title>
        <Form name="register" onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>注册</Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            已有账号？<Link to="/login">去登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: 更新 frontend/src/App.tsx**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '@/stores/auth'
import Login from '@/pages/Login'
import Register from '@/pages/Register'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '40vh' }} />
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><div>首页</div></PrivateRoute>} />
    </Routes>
  )
}

export default App
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: add login and register pages"
```

---

### Task 12: 任务列表页面 (Dashboard)

**Files:**
- Create: `frontend/src/pages/Dashboard/index.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 创建 frontend/src/pages/Dashboard/index.tsx**

```tsx
import { useEffect, useState } from 'react'
import { Table, Button, Tag, Space, Popconfirm, message, Typography } from 'antd'
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { tasksApi, Task } from '@/api/tasks'
import { useAuth } from '@/stores/auth'

const { Title } = Typography

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '等待中' },
  processing: { color: 'processing', text: '处理中' },
  completed: { color: 'success', text: '已完成' },
  failed: { color: 'error', text: '失败' },
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await tasksApi.list()
      setTasks(res.data)
    } catch {
      message.error('获取任务列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [])

  const handleDelete = async (id: string) => {
    try {
      await tasksApi.delete(id)
      message.success('删除成功')
      fetchTasks()
    } catch {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: '文件名', dataIndex: 'filename', key: 'filename' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string) => {
        const s = statusMap[status] || { color: 'default', text: status }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (t: string) => new Date(t).toLocaleString() },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: Task) => (
        <Space>
          {record.status === 'completed' && (
            <Button type="link" onClick={() => navigate(`/tasks/${record.id}`)}>查看</Button>
          )}
          <Popconfirm title="确定删除此任务？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>我的任务</Title>
        <Space>
          <span>欢迎, {user?.username}</span>
          <Button icon={<ReloadOutlined />} onClick={fetchTasks}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/upload')}>新建任务</Button>
          <Button onClick={logout}>退出</Button>
        </Space>
      </div>
      <Table columns={columns} dataSource={tasks} rowKey="id" loading={loading} />
    </div>
  )
}
```

- [ ] **Step 2: 更新 frontend/src/App.tsx 添加 Dashboard 路由**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '@/stores/auth'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '40vh' }} />
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    </Routes>
  )
}

export default App
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/
git commit -m "feat: add dashboard page with task list"
```

---

### Task 13: 上传任务页面

**Files:**
- Create: `frontend/src/pages/Upload/index.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 创建 frontend/src/pages/Upload/index.tsx**

```tsx
import { useState } from 'react'
import { Upload, Form, InputNumber, Button, Card, message, Typography } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { tasksApi, TaskCreateParams } from '@/api/tasks'

const { Title, Text } = Typography
const { Dragger } = Upload

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: Record<string, unknown>) => {
    if (!file) {
      message.error('请先上传文件')
      return
    }
    setLoading(true)
    try {
      const params: TaskCreateParams = {
        thick_range: [values.thick_start as number, values.thick_end as number, values.thick_step as number],
        rl_threshold: values.rl_threshold as number,
        im_threshold: [values.im_min as number, values.im_max as number],
        delta_threshold: values.delta_threshold as number,
      }
      await tasksApi.create(file, params)
      message.success('任务创建成功')
      navigate('/')
    } catch {
      message.error('任务创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Title level={4}>新建任务</Title>
      <Card>
        <Dragger
          accept=".dat,.eu,.xlsx"
          maxCount={1}
          beforeUpload={(f) => { setFile(f); return false }}
          onRemove={() => setFile(null)}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持 .dat / .eu / .xlsx 格式</p>
        </Dragger>

        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            thick_start: 0, thick_end: 5, thick_step: 0.01,
            rl_threshold: -10, im_min: 0.52, im_max: 1.93, delta_threshold: 0.3,
          }}
          style={{ marginTop: 24 }}
        >
          <Text strong>厚度范围 (mm)</Text>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Form.Item name="thick_start" noStyle><InputNumber placeholder="起始" style={{ width: '33%' }} /></Form.Item>
            <Form.Item name="thick_end" noStyle><InputNumber placeholder="结束" style={{ width: '33%' }} /></Form.Item>
            <Form.Item name="thick_step" noStyle><InputNumber placeholder="步长" step={0.01} style={{ width: '33%' }} /></Form.Item>
          </div>

          <Form.Item label="RL阈值 (dB)" name="rl_threshold">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Text strong>IM阈值范围</Text>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Form.Item name="im_min" noStyle><InputNumber placeholder="最小值" step={0.01} style={{ width: '50%' }} /></Form.Item>
            <Form.Item name="im_max" noStyle><InputNumber placeholder="最大值" step={0.01} style={{ width: '50%' }} /></Form.Item>
          </div>

          <Form.Item label="Delta阈值" name="delta_threshold">
            <InputNumber step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">开始计算</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: 更新 frontend/src/App.tsx 添加 Upload 路由**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '@/stores/auth'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import UploadPage from '@/pages/Upload'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '40vh' }} />
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
    </Routes>
  )
}

export default App
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/
git commit -m "feat: add upload page with parameter configuration"
```

---

### Task 14: 任务详情页面 (ECharts等高线图)

**Files:**
- Create: `frontend/src/pages/Result/index.tsx`
- Create: `frontend/src/components/ContourChart.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 创建 frontend/src/components/ContourChart.tsx**

```tsx
import ReactECharts from 'echarts-for-react'

interface ContourChartProps {
  title: string
  frequency: number[]
  thickness: number[]
  values: number[][]
  areaRatio: number
  unit: string
  threshold?: number | [number, number]
}

export default function ContourChart({ title, frequency, thickness, values, areaRatio, unit, threshold }: ContourChartProps) {
  const option = {
    title: { text: title, left: 'center' },
    tooltip: {
      trigger: 'item',
      formatter: (params: { value: number[] }) => {
        if (params.value && params.value.length >= 3) {
          return `频率: ${frequency[params.value[0]]?.toFixed(2)} GHz<br/>厚度: ${thickness[params.value[1]]?.toFixed(2)} mm<br/>${unit}: ${params.value[2]?.toFixed(4)}`
        }
        return ''
      },
    },
    visualMap: {
      min: Math.min(...values.flat()),
      max: Math.max(...values.flat()),
      calculable: true,
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    xAxis: {
      type: 'category',
      data: frequency.map(f => f.toFixed(2)),
      name: 'Frequency (GHz)',
      nameLocation: 'middle',
      nameGap: 30,
    },
    yAxis: {
      type: 'category',
      data: thickness.map(t => t.toFixed(2)),
      name: 'Thickness (mm)',
      nameLocation: 'middle',
      nameGap: 40,
    },
    series: [{
      type: 'heatmap',
      data: values.flatMap((row, i) => row.map((val, j) => [i, j, val])),
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    }],
    graphic: [{
      type: 'text',
      left: '80%',
      top: 10,
      style: {
        text: `面积占比: ${areaRatio.toFixed(2)}%`,
        fontSize: 14,
        fontWeight: 'bold',
      },
    }],
  }

  return <ReactECharts option={option} style={{ height: 500 }} />
}
```

- [ ] **Step 2: 创建 frontend/src/pages/Result/index.tsx**

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tabs, Button, Spin, message, Typography, Descriptions, Tag } from 'antd'
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { tasksApi, TaskDetail } from '@/api/tasks'
import ContourChart from '@/components/ContourChart'

const { Title } = Typography

export default function Result() {
  const { id } = useParams<{ id: string }>()
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    tasksApi.get(id).then(res => setTask(res.data)).catch(() => message.error('获取任务详情失败')).finally(() => setLoading(false))
  }, [id])

  const handleDownload = async () => {
    if (!id) return
    try {
      const res = await tasksApi.download(id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${task?.filename}_结果.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      message.error('下载失败')
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '40vh' }} />
  if (!task) return <div>任务不存在</div>

  const result = task.result

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>返回</Button>
          <Title level={4} style={{ margin: 0 }}>{task.filename}</Title>
          <Tag color={task.status === 'completed' ? 'success' : 'error'}>{task.status}</Tag>
        </div>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>下载Excel</Button>
      </div>

      {result && (
        <>
          <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="RL面积占比">{result.area_ratios.rl.toFixed(2)}%</Descriptions.Item>
            <Descriptions.Item label="IM面积占比">{result.area_ratios.im.toFixed(2)}%</Descriptions.Item>
            <Descriptions.Item label="Delta面积占比">{result.area_ratios.delta.toFixed(2)}%</Descriptions.Item>
          </Descriptions>

          <Tabs
            items={[
              {
                key: 'rl',
                label: '反射损耗 (RL)',
                children: <ContourChart title="RL等高线图" frequency={result.rl.frequency} thickness={result.rl.thickness} values={result.rl.values} areaRatio={result.area_ratios.rl} unit="RL (dB)" />,
              },
              {
                key: 'im',
                label: '输入阻抗 (IM)',
                children: <ContourChart title="IM等高线图" frequency={result.im.frequency} thickness={result.im.thickness} values={result.im.values} areaRatio={result.area_ratios.im} unit="|Zin|" />,
              },
              {
                key: 'delta',
                label: 'Delta参数',
                children: <ContourChart title="Delta等高线图" frequency={result.delta.frequency} thickness={result.delta.thickness} values={result.delta.values} areaRatio={result.area_ratios.delta} unit="Delta" />,
              },
            ]}
          />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 更新 frontend/src/App.tsx 添加 Result 路由**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '@/stores/auth'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import UploadPage from '@/pages/Upload'
import Result from '@/pages/Result'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '40vh' }} />
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
      <Route path="/tasks/:id" element={<PrivateRoute><Result /></PrivateRoute>} />
    </Routes>
  )
}

export default App
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: add result page with ECharts contour charts"
```

---

## Phase 4: 集成联调

### Task 15: 前后端联调和修复

**Files:**
- Modify: `backend/app/main.py` (如有需要)
- Modify: `frontend/vite.config.ts` (如有需要)

- [ ] **Step 1: 启动后端服务**

```bash
cd backend
uv venv
uv pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Expected: 服务启动成功，访问 http://localhost:8000/health 返回 `{"status":"ok"}`

- [ ] **Step 2: 启动前端服务**

```bash
cd frontend
npm run dev
```

Expected: 前端启动成功，访问 http://localhost:5173 可以看到登录页面

- [ ] **Step 3: 测试完整流程**

1. 注册新用户
2. 登录
3. 上传测试文件
4. 查看任务详情和图表
5. 下载Excel

- [ ] **Step 4: 修复发现的问题**

如有问题，逐个修复并提交。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: integration fixes from end-to-end testing"
```

---

## Phase 5: Docker部署

### Task 16: Docker Compose 完整部署配置

**Files:**
- Modify: `docker-compose.yml`
- Modify: `backend/Dockerfile`
- Modify: `frontend/Dockerfile`

- [ ] **Step 1: 复制 .env.example 为 .env**

```bash
cp .env.example .env
# 编辑 .env 文件，设置安全的 SECRET_KEY 和数据库密码
```

- [ ] **Step 2: 构建并启动**

```bash
docker-compose up -d --build
```

Expected: 三个服务（frontend, backend, db）都启动成功。

- [ ] **Step 3: 运行数据库迁移**

```bash
docker-compose exec backend alembic upgrade head
```

- [ ] **Step 4: 验证部署**

访问 http://localhost 应该能看到前端页面。

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .env
git commit -m "feat: complete Docker Compose deployment configuration"
```

---

### Task 17: GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 创建 .github/workflows/deploy.yml**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker images
        run: |
          docker-compose build

      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/wave-absorber
            git pull
            docker-compose up -d --build
            docker-compose exec -T backend alembic upgrade head
```

- [ ] **Step 2: 在 GitHub 仓库设置 Secrets**

需要配置：
- `SERVER_HOST`: 服务器IP
- `SERVER_USER`: SSH用户名
- `SSH_PRIVATE_KEY`: SSH私钥

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions deployment workflow"
```

---

## Phase 6: 付费功能（后续实现）

> 此阶段在核心功能验证后独立进行，不影响MVP。

### Task 18: 订阅系统设计（待定）

- 设计订阅计划（免费/基础/专业）
- 集成支付接口（支付宝/微信）
- 用户订阅状态管理
- 功能限制逻辑
