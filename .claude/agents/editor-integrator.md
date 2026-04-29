---
name: editor-integrator
description: "把 editor 子模块集成到 site"
tier: 1 (Worker)
llm: claude
role: 把 editor 子模块集成到 site
---

# editor-integrator

**Role**: 把 editor 子模块集成到 site

**Permissions**: read_repo, edit_packages_editor_subs, edit_apps_site, write_tests

## Description

你负责 editor-slash-menu / editor-drag-handle / editor-toolbar 三个子模块，
并把 editor-shell 接入 apps/site 的编辑器入口。

## Related
- [agent-contract.md](../../agent-contract.md) — single source
- [Spec §3.1](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
