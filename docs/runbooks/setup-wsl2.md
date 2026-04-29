# WSL2 开发环境搭建

## 前置假设
- Windows 10 21H2+ 或 Windows 11
- 管理员账户

## 1. 安装 WSL2 + Ubuntu 22.04

PowerShell（管理员）：

```powershell
wsl --install -d Ubuntu-22.04
```

重启后首次进入 Ubuntu 设置 username + password。

## 2. 把项目克隆到 WSL2 文件系统内

**关键**：不要放在 `/mnt/d/` 下（IO 性能差）。放在 `~/projects/` 下。

```bash
mkdir -p ~/projects && cd ~/projects
git clone https://github.com/WYI1223/selfKnowledgeBaseWeb.git
cd selfKnowledgeBaseWeb
```

## 3. 安装 Node.js 22 LTS（用 fnm，不要用 apt）

```bash
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
fnm install 22
fnm use 22
fnm default 22
node --version  # v22.x.x
```

## 4. 启用 corepack 并锁定 pnpm 版本

```bash
corepack enable
corepack prepare pnpm@9.12.0 --activate
pnpm --version  # 9.12.0
```

## 5. 安装 Python 3.12（uv 管理）

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
uv python install 3.12
uv python pin 3.12
```

## 6. 安装 Codex CLI

```bash
npm install -g @openai/codex
codex --version
```

设置 OPENAI_API_KEY：

```bash
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.bashrc
source ~/.bashrc
```

## 7. 安装 Claude Code

参照 [官方文档](https://docs.claude.com/en/docs/claude-code/setup) 安装 Claude Code CLI。

## 8. 验证

跑这些命令，全部应有输出：

```bash
node --version       # v22.x.x
pnpm --version       # 9.12.0
uv --version
python3.12 --version # Python 3.12.x
codex --version
git --version
```

## 9. 关键 IO 守则

- 项目目录必须在 WSL2 内（`~/projects/`）
- 用 VS Code Remote-WSL 扩展打开（不要用 Windows 原生 VS Code 跨 mount 编辑）
- Claude Code 与 Codex 都在 WSL2 内运行（不要在 PowerShell 里跑）

## Related
- [设计规格 §4.1](../superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [README](README.md)
