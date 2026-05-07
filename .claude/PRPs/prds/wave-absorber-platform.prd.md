# 吸波材料计算平台

## Problem Statement

吸波材料领域的高校研究生和科研工作者在拿到矢量网络分析仪的测试数据后，需要计算反射损耗(RL)、输入阻抗(IM)、Delta参数并绘制等高线图用于论文发表。当前唯一的工具是运行本地Python脚本，需要手动修改文件路径、无法分享给同事、无法在实验室外使用。商业替代品（CST Studio Suite、Keycom EAS01）价格昂贵且过度设计，不适合快速数据处理场景。

## Evidence

- 作者自身痛点：每次处理数据都要手动改脚本路径，无法让同课题组其他人使用
- 市场调研：目前没有面向吸波材料参数分析的在线工具，最接近的竞品 Keycom EAS01 是日本付费桌面软件，无在线版
- 工具现状：吸波材料研究者普遍使用 MATLAB 或 Python 脚本处理数据，无标准化工具

## Proposed Solution

构建一个Web平台，用户上传电磁参数数据文件（.dat/.eu/.xlsx），系统自动计算RL/IM/Delta参数并生成交互式等高线图，支持Excel结果下载。平台提供用户系统和任务管理，数据处理历史可追溯。后续扩展AI数据分析和多数据对比功能。

技术方案：FastAPI后端 + React/Ant Design前端 + PostgreSQL + Docker部署 + ECharts可视化。

## Key Hypothesis

我们相信一个**简单易用的在线吸波材料参数计算工具**将解决**研究生和科研工作者处理实验数据慢、无法协作**的问题。当**平台有用户愿意为订阅付费**时，我们知道方向是对了。

## What We're NOT Building

- **多层材料计算** — 第一期仅支持单层材料，多层计算涉及更复杂的传输矩阵法，后续版本加入
- **AI数据分析** — 第二期功能，需要接入LLM API，第一期先做基础计算
- **电磁仿真/建模** — 不做FDTD/FEM等全波仿真，这是CST/FEKO的领域，我们聚焦参数分析
- **桌面端打包** — 第三期功能（Electron），先做Web端
- **移动端适配** — 科研工作者主要用电脑，移动端优先级低

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| 注册用户数 | 上线3个月内100人 | 数据库用户表 |
| 日活跃用户 | 稳定5-10人/天 | 任务创建日志 |
| 付费转化率 | 注册用户中5%订阅 | 订阅记录 |
| 任务完成率 | >95%任务成功完成 | 任务状态统计 |

## Open Questions

- [ ] 服务器配置选择（CPU/内存/带宽）需要根据实际用户量调整
- [ ] 订阅定价策略需要参考同类SaaS产品
- [ ] 是否需要支持英文界面（国际期刊作者）

---

## Users & Context

**Primary User**
- **Who**: 吸波材料领域的高校研究生（硕/博）和科研工作者，具备基本Python或MATLAB使用经验，但不一定是编程专家
- **Current behavior**: 拿到VNA测试数据后，运行本地Python脚本，手动修改路径和参数，生成Excel和图片，用于论文写作
- **Trigger**: 刚测完一批新数据，导师催着要结果，需要快速出图
- **Success state**: 上传文件后几分钟内拿到等高线图和面积占比数据，直接用于论文

**Job to Be Done**
当拿到新的电磁参数测试数据时，我想要一个在线工具快速计算RL/IM/Delta并生成等高线图，以便我能高效完成吸波材料性能分析和论文写作。

**Non-Users**
- 需要全波电磁仿真的用户（应使用CST/FEKO）
- 需要多层材料建模的用户（后续版本支持）
- 非吸波材料领域的电磁研究者

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | 用户注册登录(JWT认证) | 后续付费功能的基础，保护用户数据 |
| Must | 文件上传(.dat/.eu/.xlsx) + RL/IM/Delta计算 + Excel导出 | 核心价值，用户来的唯一原因 |
| Must | ECharts等高线图可视化 + 面积占比标注 + 频率/厚度/数值交互 | 论文出图的核心需求 |
| Should | 任务历史管理(查看/删除/重新下载) | 用户体验，方便回溯 |
| Should | 计算参数可配置(厚度范围/阈值) | 不同研究场景需要不同参数 |
| Should | 订阅制付费系统 | 变现核心 |
| Could | 英文界面支持 | 拓展国际用户 |
| Could | 多数据对比功能 | 用户明确提到的后续需求 |
| Won't | 多层材料计算 | 明确推迟到第二期 |
| Won't | AI数据分析 | 明确推迟到第二期 |
| Won't | Electron桌面端 | 明确推迟到第三期 |

### MVP Scope

第一版验证假设：有人愿意为这个工具付费。

最小功能集：
1. 注册登录
2. 上传文件 → 计算 → 显示等高线图（含面积占比） → 下载Excel
3. 任务列表（查看历史、删除）

### User Flow

```
注册/登录 → 首页(任务列表) → 点击"新建任务"
  → 上传文件(.dat/.eu/.xlsx)
  → 配置参数(可选，有默认值)
  → 提交 → 等待计算(几秒)
  → 跳转任务详情 → 查看RL/IM/Delta等高线图
  → 下载Excel → 用于论文
```

---

## Technical Approach

**Feasibility**: HIGH — 计算公式已验证可用（现有脚本），技术栈成熟

**Architecture Notes**
- FastAPI同步计算（数据量不大，单次请求完成）
- ECharts前端渲染等高线图（交互性强，支持缩放/悬浮/标注）
- Docker Compose一键部署（frontend/nginx + backend + postgresql）
- GitHub Actions CI/CD（push自动构建部署）
- 计算核心为纯函数模块，方便测试和扩展

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 大文件上传超时 | M | Nginx限制+前端文件大小校验 |
| ECharts等高线图大数据量卡顿 | L | 数据采样或WebWorker |
| 服务器带宽不足 | L | CDN + 结果文件压缩 |
| PostgreSQL数据增长 | L | 定期清理过期任务 |

---

## Implementation Phases

| # | Phase | Description | Status | Parallel | Depends |
|---|-------|-------------|--------|----------|---------|
| 1 | 项目初始化 | Docker Compose + 项目骨架 + 数据库迁移 | pending | - | - |
| 2 | 后端核心 | 用户认证 + 文件上传 + 计算引擎 + API | pending | - | 1 |
| 3 | 前端核心 | 登录/注册 + 任务列表 + 上传页面 + 结果图表 | pending | - | 1 |
| 4 | 集成联调 | 前后端对接 + 端到端测试 | pending | - | 2, 3 |
| 5 | 部署上线 | CI/CD配置 + 服务器部署 + 域名配置 | pending | - | 4 |
| 6 | 付费功能 | 订阅系统 + 支付集成 | pending | - | 4 |

### Phase Details

**Phase 1: 项目初始化**
- **Goal**: 建立可运行的项目骨架，一键启动开发环境
- **Scope**: Docker Compose配置、FastAPI项目结构、React项目结构、Alembic数据库迁移、基础Health Check API
- **Success signal**: `docker-compose up` 能启动全部服务，访问前端页面和后端API

**Phase 2: 后端核心**
- **Goal**: 实现完整的后端API
- **Scope**: JWT认证、用户CRUD、文件上传/存储、RL/IM/Delta计算核心、任务管理API、Excel导出
- **Success signal**: 用Postman能完成注册→登录→上传文件→获取结果→下载Excel的完整流程

**Phase 3: 前端核心**
- **Goal**: 实现完整的前端页面
- **Scope**: 登录/注册页、任务列表页、新建任务页(上传+配参)、任务详情页(ECharts等高线图+面积占比+下载按钮)
- **Success signal**: 前端页面可用Mock数据正常展示和交互

**Phase 4: 集成联调**
- **Goal**: 前后端打通，端到端可用
- **Scope**: API对接、错误处理、Loading状态、文件上传进度
- **Success signal**: 从上传文件到看到等高线图的完整流程可用

**Phase 5: 部署上线**
- **Goal**: 平台可公网访问
- **Scope**: GitHub Actions CI/CD、Docker镜像构建、服务器部署、域名HTTPS配置
- **Success signal**: 通过域名可以正常访问和使用全部功能

**Phase 6: 付费功能**
- **Goal**: 实现订阅制变现
- **Scope**: 订阅计划定义、支付集成（支付宝/微信）、用量限制、订阅状态管理
- **Success signal**: 用户可以完成付费订阅，订阅用户和免费用户有功能区分

### Parallelism Notes

- Phase 2 和 Phase 3 可以并行开发（后端API和前端页面互不影响）
- Phase 6 可以在Phase 5之后独立进行，不影响核心功能

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| 后端框架 | FastAPI | Flask, Django | 异步支持好，自动生成API文档，Python生态 |
| 前端框架 | React + Ant Design | Vue, Angular | Ant Design表格/表单开箱即用，中文文档完善 |
| 图表库 | ECharts | Plotly.js, Matplotlib后端渲染 | 等高线图支持好，交互性强，Apache项目 |
| 数据库 | PostgreSQL | SQLite, MySQL | 功能强大，Docker部署方便，后续扩展性好 |
| 认证方式 | JWT | Session/Cookie | 前后端分离友好，无状态 |
| 部署方式 | Docker Compose + GitHub Actions | K8s, 手动部署 | 简单可控，个人服务器足够 |
| 计算方式 | 同步请求 | Celery异步 | 数据量小，同步足够，架构简单 |

---

## Research Summary

**Market Context**
吸波材料参数分析是一个被现有工具忽视的细分市场。商业电磁仿真软件（CST/FEKO）过度设计且昂贵，研究者普遍依赖自写脚本。没有现成的在线工具。这为一个轻量级、专注的Web平台创造了明确的市场机会。

**Technical Context**
计算公式已验证可用（现有Python脚本），技术栈成熟（FastAPI+React+PostgreSQL），无技术风险。关键挑战在于等高线图的前端交互体验和Docker部署的运维。

---

*Generated: 2026-05-07*
*Status: DRAFT - needs validation*
