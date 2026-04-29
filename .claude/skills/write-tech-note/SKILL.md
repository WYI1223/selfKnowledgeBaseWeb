---
name: write-tech-note
description: Use when user asks to draft a technical note (e.g., "写一篇 transformer attention 笔记")
---

# Skill: 写一篇技术笔记

## 适用场景

用户请求新建一篇含 jupyter / nn-viz / pdf 等 block 的技术笔记。

## 步骤（playbook，非工具）

1. 读 `agent-tools` 工具 schema，理解可用操作
2. dispatch `create_page` 工具创建 `content/notes/<slug>/index.mdx`
3. 用 `insert_block` 添加：
   - heading h1（笔记标题）
   - 简介 paragraph
   - math block（核心公式，如适用）
   - jupyter block（实现 / 复现）
   - nn-viz block（如适用）
   - 总结 paragraph + 引用 list
4. 用 `save_page` 触发 commit (经 git-operator agent)
5. 等待用户审批（半自动模式，spec §2.6）

## 模板示例

[填实质模板，Phase 2b 完成]

## Related

- [Spec §2.6](../../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [Phase 2b plan](../../../docs/superpowers/plans/) (尚未创建)
