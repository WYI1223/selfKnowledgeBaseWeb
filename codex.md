可以。**Codex CLI 可以被 bash 调用**，推荐用非交互模式 `codex exec`，它就是给脚本、CI、管道化工作流用的；官方文档说明它不会打开 TUI，并且最终回复会输出到 `stdout`，进度走 `stderr`，所以很适合 shell 管道。([OpenAI Developers][1])

### 1. Bash 中直接调用

```bash
codex exec "总结这个仓库结构，并列出最可能出问题的 5 个区域"
```

管道输入也可以：

```bash
npm test 2>&1 \
  | codex exec "总结失败测试，并给出最小修复建议" \
  > test-summary.md
```

也可以让 stdin 本身作为 prompt：

```bash
cat prompt.txt | codex exec -
```

这些 stdin 用法是官方支持的。([OpenAI Developers][1])

### 2. 指定特定模型

可以用 `--model` / `-m`：

```bash
codex exec --model gpt-5.5 "审查这次改动中的并发问题"
```

`--model` 会覆盖配置里的默认模型；Codex 也支持在启动 CLI 时指定模型，交互会话中还可以用 `/model` 切换。([OpenAI Developers][2])

### 3. “特定任务用特定模型”的常见做法

最简单是写 bash wrapper：

```bash
#!/usr/bin/env bash
set -euo pipefail

task="${1:-}"

case "$task" in
  review)
    codex exec --model gpt-5.5 \
      "Review current branch vs main. Focus on correctness, security, and missing tests."
    ;;
  summarize)
    codex exec --model gpt-5.4-mini \
      "Summarize the repository and produce a concise architecture overview."
    ;;
  fix)
    codex exec --model gpt-5.3-codex-spark --full-auto --sandbox workspace-write \
      "Run tests, find the smallest fix, implement only that fix, then stop."
    ;;
  *)
    echo "Usage: $0 {review|summarize|fix}" >&2
    exit 1
    ;;
esac
```

也可以用 profile，把模型和权限写进 `~/.codex/config.toml`，再按任务调用：

```toml
[profiles.review]
model = "gpt-5.5"
sandbox_mode = "read-only"

[profiles.fix]
model = "gpt-5.3-codex-spark"
sandbox_mode = "workspace-write"
approval_policy = "on-request"
```

```bash
codex exec --profile review "Review this PR for security and correctness"
codex exec --profile fix "Fix the failing tests with the smallest change"
```

Codex 的配置优先级是 CLI flags / `--config` 最高，其次是 profile、项目配置、用户配置等；所以脚本里用 `--model` 或 `--profile` 都适合做“任务路由”。([OpenAI Developers][3])

### 4. 更高级：自定义 subagent 按角色用不同模型

Codex subagents 支持自定义 agent，并且每个 agent 文件里可以设置自己的 `model`、`model_reasoning_effort`、`sandbox_mode` 等。官方示例里就有 `pr_explorer`、`reviewer`、`docs_researcher` 分别使用不同模型和权限。([OpenAI Developers][4])

结论：**bash 调用可以；指定模型可以；按任务指定模型也可以**。单次任务用 `--model`，固定工作流用 `--profile` 或 shell wrapper，复杂多角色任务用 custom subagents。

[1]: https://developers.openai.com/codex/noninteractive "Non-interactive mode – Codex | OpenAI Developers"
[2]: https://developers.openai.com/codex/cli/reference "Command line options – Codex CLI | OpenAI Developers"
[3]: https://developers.openai.com/codex/config-basic "Config basics – Codex | OpenAI Developers"
[4]: https://developers.openai.com/codex/subagents "Subagents – Codex | OpenAI Developers"
