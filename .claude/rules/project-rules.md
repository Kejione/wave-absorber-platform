# Project Rules

## Python 环境管理

- 必须使用 `uv` 创建和管理 Python 虚拟环境（`uv venv`, `uv pip install`）
- 不得使用 `venv`, `virtualenv`, `conda`, `pip` 直接创建环境
- 安装依赖时使用 `uv pip install -r requirements.txt` 或 `uv pip install <package>`

## 安全操作限制

- 禁止执行 `rm -rf`、`rm -r`、`rmdir /s` 等强制删除操作
- 禁止执行 `git push --force`、`git reset --hard`、`git clean -f` 等破坏性 git 操作
- 禁止未经用户确认执行 `git push`
- 删除文件前必须先确认用户意图
