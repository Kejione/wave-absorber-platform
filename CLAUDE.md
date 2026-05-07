# CLAUDE.md — 吸波材料计算平台

## 项目概述

吸波材料电磁参数计算与可视化Web平台。将电磁参数数据（.dat/.eu/.xlsx）解析后计算反射损耗(RL)、输入阻抗(IM)、Delta参数，并以等高线图可视化展示。

**愿景**：成为吸波材料研究领域人人必备的工具，所有计算、绘图、分析操作都在平台完成，后续加入AI数据分析和多数据对比。

**目标用户**：高校研究生和科研工作者（吸波材料领域），拿到新数据时需要快速出图写论文。

**变现模式**：订阅制

技术栈：FastAPI + React + Ant Design + ECharts + PostgreSQL + Docker

## 项目结构

```
backend/          → FastAPI 后端
  app/core/       → 纯计算模块（data_reader, reflection_loss, impedance, delta）
  app/models/     → SQLAlchemy 数据模型
  app/schemas/    → Pydantic 请求/响应模型
  app/routers/    → API 路由
  app/services/   → 业务逻辑
  app/utils/      → 工具函数（JWT, Excel导出）
frontend/         → React + Ant Design 前端
  src/pages/      → 页面组件
  src/api/        → API 请求封装
  src/components/ → 通用组件
docker-compose.yml → 一键部署
```

## 编码规范

### 命名

- Python：snake_case（函数、变量、文件名），PascalCase（类名）
- TypeScript/React：camelCase（变量、函数），PascalCase（组件、接口）
- API路由：kebab-case（`/api/auth/login`）
- 数据库表名：复数snake_case（`users`, `tasks`）

### Python 后端

- 类型注解必须完整（函数参数和返回值）
- 使用 async def 定义路由处理函数
- 数据库操作通过 SQLAlchemy ORM，不写原生SQL
- 计算模块（core/）保持纯函数，无副作用，参数全部由调用方传入
- 错误处理只在系统边界做（用户输入、文件解析、数据库操作），内部逻辑不加防御性代码

### React 前端

- 函数组件 + Hooks，不用 class 组件
- API请求统一封装在 `src/api/` 目录
- 页面级组件放在 `src/pages/`，可复用组件放在 `src/components/`
- ECharts图表封装为独立组件，接收数据props

### 数据格式

- 频率统一用 Hz 存储，前端展示时转为 GHz
- 厚度统一用 mm
- 复数介电常数/磁导率：实部 - j*虚部（注意现有代码的符号约定）

## 重构原则

从现有脚本重构时遵循：

- **只提取计算逻辑**，丢弃脚本中的硬编码路径、main函数、绘图代码
- 计算公式保持不变，不做数学层面的修改
- `data_reader.py` 统一处理三种文件格式，输出标准化的numpy数组
- 不引入原脚本没有的计算方法

## Karpathy 编码准则

### 1. 先想再写

- 不假设，不隐藏困惑，暴露权衡
- 多种解读存在时，呈现出来，不默默选择
- 有更简单的方案就说出来

### 2. 简洁优先

- 不写没被要求的功能
- 不为单次使用写抽象
- 不加未被要求的"灵活性"和"可配置性"
- 200行能50行解决的，重写

### 3. 精准修改

- 只动必须动的，不"顺手改进"相邻代码
- 匹配现有代码风格，即使你偏好另一种
- 自己引入的未使用代码自己清理，不碰原有死代码
- 每一行改动都能追溯到用户请求

### 4. 目标驱动

- 定义成功标准，循环直到验证通过
- 多步任务列出验证清单

## Docker 部署

- `docker-compose up -d` 启动全部服务
- Nginx 反向代理 `/api/*` 到后端
- 上传文件和计算结果通过 Docker Volume 持久化
- 环境变量通过 `.env` 文件配置

## 第一期范围 (MVP)

**必须有 (Must)**:
- 用户注册登录 (JWT认证) — 后续付费的基础
- 文件上传 (.dat/.eu/.xlsx) + RL/IM/Delta计算 + Excel导出 — 核心价值
- ECharts等高线图可视化 + 面积占比标注 — 论文出图需求

**应该有 (Should)**:
- 任务历史管理（查看/删除/重新下载）
- 计算参数可配置（厚度范围/阈值，有默认值）

**不做 (Won't)**:
- 多层材料计算 — 第二期
- AI数据分析 — 第二期
- Electron桌面端 — 第三期
- 多数据对比 — 第二期

## 实现阶段

| # | Phase | 说明 | 并行 |
|---|-------|------|------|
| 1 | 项目初始化 | Docker Compose + 项目骨架 + 数据库迁移 | - |
| 2 | 后端核心 | 认证 + 上传 + 计算引擎 + API | with 3 |
| 3 | 前端核心 | 登录/注册 + 任务列表 + 上传 + 图表 | with 2 |
| 4 | 集成联调 | 前后端对接 + 端到端测试 | - |
| 5 | 部署上线 | CI/CD + 服务器部署 + 域名 | - |
| 6 | 付费功能 | 订阅系统 + 支付集成 | - |

## 设计文档

- 完整设计：`docs/superpowers/specs/2026-05-07-wave-absorber-platform-design.md`
- PRD文档：`.claude/PRPs/prds/wave-absorber-platform.prd.md`
