# 吸波材料计算平台

> 基于 FastAPI + React 的吸波材料电磁参数在线计算与可视化平台

一个面向高校研究生和科研工作者的在线工具，用于计算和分析吸波材料的电磁参数。支持上传矢量网络分析仪测试数据，自动计算反射损耗（RL）、输入阻抗（IM）和 Delta 参数，并生成交互式等高线图用于论文发表。

---

## 功能特性

### 核心功能

- **数据上传**：支持 `.dat`、`.eu`、`.xlsx` 三种常见电磁参数数据格式
- **参数计算**：
  - **反射损耗（RL）**：基于传输线理论计算，公式 `RL = 20·log₁₀(|(Zin-1)/(Zin+1)|)`
  - **输入阻抗（IM）**：归一化输入阻抗模值 `|Zin|`
  - **Delta 参数**：阻抗匹配判据，用于评估材料的吸波性能
- **可视化**：ECharts 交互式等高线图，支持缩放、拖拽、悬浮提示
- **面积占比**：自动计算各参数在阈值范围内的面积占比
- **结果导出**：Excel 格式下载（含 RL/IM/Delta 三个 Sheet）

### 用户系统

- 用户注册与登录（JWT 认证）
- 任务历史管理（查看、删除、重新下载）
- 参数可配置（厚度范围、RL/IM/Delta 阈值，均有默认值）

### 部署

- Docker Compose 一键部署
- GitHub Actions CI/CD 自动构建
- Nginx 反向代理 + HTTPS 支持

---

## 技术栈

| 层 | 技术 |
|---|---|
| **后端** | Python 3.11 + FastAPI + Uvicorn |
| **前端** | React 18 + TypeScript + Vite |
| **UI 组件** | Ant Design 5 |
| **图表** | ECharts 5 |
| **数据库** | PostgreSQL 16 |
| **ORM** | SQLAlchemy 2.0 + Alembic |
| **认证** | JWT (python-jose + passlib/bcrypt) |
| **部署** | Docker Compose + Nginx |
| **CI/CD** | GitHub Actions |

---

## 项目结构

```
吸波材料计算平台/
├── backend/                          # FastAPI 后端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI 应用入口
│   │   ├── config.py                 # 配置管理（Pydantic Settings）
│   │   ├── database.py               # SQLAlchemy 数据库连接
│   │   ├── models/                   # 数据模型
│   │   │   ├── user.py               # 用户模型
│   │   │   └── task.py               # 任务模型
│   │   ├── schemas/                  # Pydantic 请求/响应模型
│   │   │   ├── user.py
│   │   │   └── task.py
│   │   ├── routers/                  # API 路由
│   │   │   ├── auth.py               # 认证接口（注册/登录/用户信息）
│   │   │   └── tasks.py              # 任务管理接口（CRUD + 文件上传下载）
│   │   ├── services/                 # 业务逻辑
│   │   │   ├── auth_service.py       # 认证服务
│   │   │   ├── calculation_service.py # 计算编排服务
│   │   │   └── file_service.py       # 文件上传/验证服务
│   │   ├── core/                     # 核心计算模块（纯函数，无副作用）
│   │   │   ├── data_reader.py        # 数据读取（.dat/.eu/.xlsx）
│   │   │   ├── reflection_loss.py    # RL 和 IM 计算
│   │   │   └── delta.py              # Delta 参数计算
│   │   └── utils/
│   │       ├── security.py           # JWT + 密码哈希工具
│   │       └── export.py             # Excel/JSON 导出
│   ├── alembic/                      # 数据库迁移
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                         # React 前端
│   ├── src/
│   │   ├── api/                      # API 请求封装
│   │   │   ├── client.ts             # Axios 实例（拦截器 + Token）
│   │   │   ├── auth.ts               # 认证 API
│   │   │   └── tasks.ts              # 任务 API
│   │   ├── components/               # 通用组件
│   │   │   └── ContourChart.tsx       # ECharts 等高线图组件
│   │   ├── pages/                    # 页面组件
│   │   │   ├── Login/                # 登录页
│   │   │   ├── Register/             # 注册页
│   │   │   ├── Dashboard/            # 任务列表页
│   │   │   ├── Upload/               # 上传+参数配置页
│   │   │   └── Result/               # 结果展示页（图表+下载）
│   │   ├── stores/
│   │   │   └── auth.tsx              # 认证状态管理（React Context）
│   │   ├── utils/
│   │   │   └── token.ts              # Token 存储工具
│   │   ├── App.tsx                   # 路由配置
│   │   └── main.tsx                  # 应用入口
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml                # Docker 编排
├── .env.example                      # 环境变量模板
├── .github/workflows/deploy.yml      # CI/CD 配置
├── CLAUDE.md                         # 项目 AI 辅助开发指南
├── docs/
│   ├── superpowers/
│   │   ├── specs/                    # 设计文档
│   │   └── plans/                    # 实现计划
│   └── ...
└── README.md
```

---

## 快速开始

### 环境要求

- Docker + Docker Compose
- Git

### 1. 克隆项目

```bash
git clone https://github.com/Kejione/wave-absorber-platform.git
cd wave-absorber-platform
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改以下配置：

```env
DATABASE_URL=postgresql://postgres:your_password@db:5432/wave_absorber
SECRET_KEY=your_random_secret_key_here
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=wave_absorber
```

> **安全提示**：`SECRET_KEY` 和 `POSTGRES_PASSWORD` 请使用随机生成的强密码。

### 3. 启动服务

```bash
docker-compose up -d --build
```

首次启动会下载镜像并构建，需要几分钟。

### 4. 初始化数据库

```bash
# 生成迁移文件
docker-compose exec backend alembic revision --autogenerate -m "init tables"

# 执行迁移
docker-compose exec backend alembic upgrade head
```

### 5. 访问应用

- 前端：http://localhost:3000
- 后端 API 文档：http://localhost:8000/docs

---

## 本地开发

### 后端

```bash
cd backend

# 使用 uv 创建虚拟环境（推荐）
uv venv
uv pip install -r requirements.txt

# 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

> 需要本地运行 PostgreSQL，或修改 `config.py` 中的 `DATABASE_URL` 指向远程数据库。

### 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端开发服务器运行在 http://localhost:5173，API 请求会自动代理到 http://localhost:8000。

---

## API 接口

### 认证

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册 | 否 |
| POST | `/api/auth/login` | 登录，返回 JWT | 否 |
| GET | `/api/auth/me` | 获取当前用户信息 | 是 |

### 任务

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/tasks` | 创建任务（上传文件 + 参数） | 是 |
| GET | `/api/tasks` | 获取任务列表 | 是 |
| GET | `/api/tasks/{id}` | 获取任务详情（含计算结果） | 是 |
| GET | `/api/tasks/{id}/download` | 下载结果 Excel | 是 |
| DELETE | `/api/tasks/{id}` | 删除任务 | 是 |

### 创建任务示例

```bash
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sample.dat" \
  -F 'params={"thick_range":[0,5,0.01],"rl_threshold":-10,"im_threshold":[0.52,1.93],"delta_threshold":0.3}'
```

### 任务详情响应

```json
{
  "id": "uuid",
  "status": "completed",
  "filename": "sample.dat",
  "result": {
    "rl": { "frequency": [1.0, 1.5, ...], "thickness": [0, 0.01, ...], "values": [[...]] },
    "im": { "frequency": [...], "thickness": [...], "values": [[...]] },
    "delta": { "frequency": [...], "thickness": [...], "values": [[...]] },
    "area_ratios": { "rl": 45.2, "im": 32.1, "delta": 28.7 }
  }
}
```

---

## 计算原理

### 反射损耗（RL）

基于传输线理论，计算电磁波在材料表面的反射损耗：

```
Zin = √(μr/εr) · tanh(j·2πfd/c · √(μr·εr))
RL = 20·log₁₀(|(Zin - 1) / (Zin + 1)|)
```

其中：
- `εr` = 复数介电常数（ε' - jε''）
- `μr` = 复数磁导率（μ' - jμ''）
- `f` = 频率（Hz）
- `d` = 材料厚度（m）
- `c` = 光速（299,792,458 m/s）

### 输入阻抗（IM）

归一化输入阻抗模值 `|Zin|`，理想匹配时 `|Zin| = 1`。

### Delta 参数

阻抗匹配判据，值越小表示吸波性能越好：

```
Δ = |sinh²(K·f·d) - M|
```

---

## 部署到服务器

### 使用宝塔面板

1. 在宝塔面板中安装 Docker 管理器
2. 克隆项目到 `/opt/wave-absorber-platform`
3. 配置 `.env` 文件
4. 执行 `docker-compose up -d --build`
5. 执行数据库迁移
6. 在宝塔中添加网站，选择反向代理，目标 `http://127.0.0.1:3000`
7. 申请 HTTPS 证书

### GitHub Actions 自动部署

配置以下 Secrets：

| Secret | 说明 |
|--------|------|
| `SERVER_HOST` | 服务器 IP |
| `SERVER_USER` | SSH 用户名 |
| `SSH_PRIVATE_KEY` | SSH 私钥 |

推送到 `main` 分支后自动触发部署。

---

## 后续规划

- [ ] **第二期**：Other_Para 计算模块（衰减常数 α、C0、损耗角正切、匹配厚度、Cole-Cole 图）
- [ ] **第二期**：多数据对比分析
- [ ] **第二期**：AI 数据分析（接入 LLM API）
- [ ] **第三期**：Electron 桌面端打包
- [ ] **长期**：更多计算方法、批量处理、数据导出模板

---

## 数据格式说明

### .dat 文件

制表符分隔，前两行为注释：
```
# 注释行1
# 注释行2
频率(GHz)	ε'	ε''	μ'	μ''
```

### .eu 文件

制表符分隔，前 13 行为注释：
```
# 13行注释
频率(GHz)	ε'	ε''	—	μ'	μ''
```

### .xlsx 文件

无表头，列顺序：
```
频率(GHz) | ε' | ε'' | μ' | μ''
```

---

## 许可证

MIT License

---

## 致谢

- 电磁参数计算公式参考自吸波材料领域经典文献
- 前端 UI 基于 [Ant Design](https://ant.design/)
- 图表可视化基于 [Apache ECharts](https://echarts.apache.org/)
