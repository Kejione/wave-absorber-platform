# 吸波材料计算平台 — 设计文档

## 概述

将现有的吸波材料电磁参数计算脚本重构为全栈Web平台，支持用户注册登录、文件上传、在线计算与可视化、结果下载。后续可扩展更多计算功能并打包为桌面应用。

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | FastAPI + Uvicorn + SQLAlchemy + Alembic |
| 前端 | React + TypeScript + Ant Design + ECharts |
| 数据库 | PostgreSQL |
| 部署 | Docker Compose + Nginx |
| CI/CD | GitHub Actions |
| 认证 | JWT (access token) |

## 项目目录结构

```
吸波材料计算平台/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   └── task.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   └── task.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── tasks.py
│   │   │   └── files.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── calculation_service.py
│   │   │   └── file_service.py
│   │   ├── core/
│   │   │   ├── data_reader.py
│   │   │   ├── reflection_loss.py
│   │   │   ├── impedance.py
│   │   │   └── delta.py
│   │   └── utils/
│   │       ├── security.py
│   │       └── export.py
│   ├── uploads/
│   ├── results/
│   ├── alembic/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic.ini
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Login/
│   │   │   ├── Register/
│   │   │   ├── Dashboard/
│   │   │   ├── Upload/
│   │   │   └── Result/
│   │   ├── stores/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .github/workflows/deploy.yml
├── .env.example
└── README.md
```

## 数据模型

### users 表

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | 主键 |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 邮箱 |
| hashed_password | VARCHAR(255) | NOT NULL | bcrypt加密密码 |
| created_at | TIMESTAMP | DEFAULT NOW | 注册时间 |

### tasks 表

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | UUID | PK | 主键 |
| user_id | UUID | FK → users.id | 所属用户 |
| filename | VARCHAR(255) | NOT NULL | 原始文件名 |
| file_path | VARCHAR(500) | NOT NULL | 服务器存储路径 |
| status | VARCHAR(20) | DEFAULT 'pending' | pending / processing / completed / failed |
| params | JSON | | 计算参数 |
| result_path | VARCHAR(500) | | 结果Excel路径 |
| error_message | TEXT | | 失败时的错误信息 |
| created_at | TIMESTAMP | DEFAULT NOW | 创建时间 |
| completed_at | TIMESTAMP | | 完成时间 |

## API 接口

### 认证

| 方法 | 路径 | 说明 | 认证 |
|---|---|---|---|
| POST | `/api/auth/register` | 注册(username, email, password) | 否 |
| POST | `/api/auth/login` | 登录，返回JWT access_token | 否 |
| GET | `/api/auth/me` | 获取当前用户信息 | 是 |

### 任务

| 方法 | 路径 | 说明 | 认证 |
|---|---|---|---|
| POST | `/api/tasks` | 创建任务(multipart: file + params JSON) | 是 |
| GET | `/api/tasks` | 获取当前用户任务列表 | 是 |
| GET | `/api/tasks/{id}` | 获取任务详情(含计算结果数据) | 是 |
| GET | `/api/tasks/{id}/download` | 下载结果Excel文件 | 是 |
| DELETE | `/api/tasks/{id}` | 删除任务(连同文件) | 是 |

### 创建任务请求

```
POST /api/tasks
Content-Type: multipart/form-data

file: [上传的文件 (.dat/.eu/.xlsx)]
params: {
  "thick_range": [0, 5, 0.01],
  "rl_threshold": -10,
  "im_threshold": [0.52, 1.93],
  "delta_threshold": 0.3
}
```

params 为可选，不传则使用默认值。

### 任务详情响应

```json
{
  "id": "uuid",
  "status": "completed",
  "filename": "sample.dat",
  "params": {
    "thick_range": [0, 5, 0.01],
    "rl_threshold": -10,
    "im_threshold": [0.52, 1.93],
    "delta_threshold": 0.3
  },
  "result": {
    "rl": {
      "frequency": [1.0, 1.5, ...],
      "thickness": [0, 0.01, ...],
      "values": [[...], ...]
    },
    "im": { "frequency": [...], "thickness": [...], "values": [[...]] },
    "delta": { "frequency": [...], "thickness": [...], "values": [[...]] },
    "area_ratios": {
      "rl": 45.2,
      "im": 32.1,
      "delta": 28.7
    }
  },
  "created_at": "2026-05-07T10:00:00Z",
  "completed_at": "2026-05-07T10:00:05Z"
}
```

## 核心计算模块

从现有代码重构为独立纯函数模块，无副作用，参数全部由调用方传入。

### data_reader.py

统一数据读取，支持 .dat / .eu / .xlsx 三种格式。

输出：frequency(Hz), e(复数), u(复数), e_real, e_imag, u_real, u_imag

### reflection_loss.py

反射损耗 RL 和输入阻抗 IM 计算。

公式：
- Zin = sqrt(u/e) * tanh(j * 2*pi*f*d/c * sqrt(u*e))
- RL = 20 * log10(|(Zin - 1) / (Zin + 1)|)
- IM = |Zin|

### delta.py

Delta 参数计算。

### 计算流程

```
上传文件 → data_reader 解析 → 依次计算 RL/IM/Delta → 合并结果 → 导出 Excel + 返回 JSON
```

计算在单次请求内同步完成，不做并行处理（方案A架构）。后续如需异步可平滑迁移。

## 前端页面

### 页面流

```
登录/注册 → 任务列表(首页) → 新建任务(上传+配参) → 任务详情(图表+下载)
```

### 页面说明

1. **登录/注册页** — 表单，登录后跳转首页
2. **任务列表页 (Dashboard)** — Ant Design Table，显示状态、文件名、创建时间，支持删除操作
3. **新建任务页** — 文件上传区域 + 参数配置表单(厚度范围、各阈值)，提交后跳转任务列表
4. **任务详情页** — 三个Tab切换(RL / IM / Delta)，每个Tab包含ECharts等高线图，显示面积占比，页面顶部有下载Excel按钮

### 图表交互

- ECharts contour 图表
- 鼠标悬浮显示频率/厚度/数值
- 支持缩放和拖拽
- 面积占比文字标注

## 部署架构

### Docker Compose

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["80:80", "443:443"]
    depends_on: [backend]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    volumes:
      - uploads:/app/uploads
      - results:/app/results
    depends_on: [db]
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/wave_absorber
      SECRET_KEY: ${SECRET_KEY}

  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: wave_absorber
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

### Nginx 配置

- 托管前端静态文件
- 反向代理 `/api/*` 到 backend:8000
- 后续可加 HTTPS (Let's Encrypt)

### CI/CD (GitHub Actions)

```
push to main → 构建前端镜像 → 构建后端镜像 → SSH部署到服务器 → docker-compose up -d
```

### 环境变量 (.env)

```
DATABASE_URL=postgresql://user:pass@db:5432/wave_absorber
SECRET_KEY=your-jwt-secret-key
POSTGRES_USER=wave_absorber
POSTGRES_PASSWORD=secure-password
```

### 注意事项

- backend Dockerfile 需在构建时创建 `/app/uploads` 和 `/app/results` 目录
- 上传文件大小限制默认 50MB，可通过 Nginx `client_max_body_size` 和 FastAPI 配置调整

## 第一期范围

仅包含核心三件套：
- RL (反射损耗) 计算 + 等高线图
- IM (输入阻抗) 计算 + 等高线图
- Delta 参数计算 + 等高线图
- 面积占比计算
- Excel 结果导出
- 用户注册登录 + 任务管理

不包含：Other_Para 模块(α、C0、损耗正切、匹配厚度、Cole-Cole图)，后续版本加入。

## 后续规划

- 第二期：加入 Other_Para 计算模块
- 第三期：Electron 桌面端打包
- 长期：更多计算方法、数据对比、批量分析
