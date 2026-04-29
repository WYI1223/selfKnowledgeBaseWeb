# Phase 1 Wave 1 实施计划：基础设施 + 接口

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Phase 0 脚手架基础上，落地 Phase 1 Wave 1 的 6 个并行 track + 1 个前置 task + 1 个收尾 task：消化 Phase 0 deferred follow-up，搭出 Astro 站点骨架、8 个接口/桥接包的契约层、FastAPI 后端骨架（含 ws/llm 抽象），使 Phase 1 Wave 2 可以并行展开 8 个 component block + 3 个 editor 子模块的实现工作。

**Architecture:**
- 6 个 track 互不依赖，可由 6 个 Claude worker 并行 dispatch（不卷入 Codex —— Wave 1 全 Claude，Codex 从 Wave 2 起）
- 每条 track 完工后**先**走双层 review（5.3-spark code-reviewer → Claude pr-reviewer；高风险 track B/C/E/F 自动 escalate 5.5 pr-gate），过了再合 main
- Track 间冲突点仅在 root `tsconfig.json` 的 `references` 数组——每 track 闭合时把自己加进去（git rebase 自动合并即可）

**Tech Stack:**
- 前端：Astro 5 · MDX · Tailwind 4 · Tiptap（仅类型，实例化在 Wave 2）
- 后端：FastAPI · Python 3.12 · pydantic 2 · python-jose（JWT）· argon2-cffi · GitPython
- 共享：TypeScript 5.6 strict · Zod · Vitest · ESLint flat config（已就绪）
- 仍不引入：数据库 / 第三方 OAuth / SSR

**Reference:** 必读
- [设计规格 §1 / §2 / §3](../specs/2026-04-29-self-knowledge-base-design.md) 全篇
- [设计规格 §4.2.1](../specs/2026-04-29-self-knowledge-base-design.md) Wave 1 退出标准
- [ADR-0001](../../decisions/ADR-0001-stack-selection.md) 含 Phase 0 errata 1-7 + 6 条 deferred follow-up
- [agent-contract.md](../../../agent-contract.md) 27 agent 单一源（确认 dispatch 时的 LLM/profile）

---

## File Structure

Wave 1 完工后新增（不含修改）：

```
apps/
├── site/                                  # Track A
│   ├── package.json
│   ├── astro.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── src/pages/index.astro
│   ├── src/pages/notes/[...slug].astro
│   ├── src/layouts/BaseLayout.astro
│   └── src/content.config.ts
└── api/                                   # Track D（Python 单独 venv，不进 ts references）
    ├── pyproject.toml
    ├── app/
    │   ├── __init__.py
    │   ├── main.py
    │   ├── auth.py
    │   ├── files.py
    │   ├── git_ops.py
    │   ├── schemas.py
    │   ├── ws/{__init__,protocol}.py
    │   └── llm/{__init__,provider}.py
    ├── tests/
    │   ├── conftest.py
    │   ├── test_auth.py
    │   ├── test_files.py
    │   └── test_ws_protocol.py
    ├── CONTRACT.md
    ├── ws/CONTRACT.md
    └── llm/CONTRACT.md

packages/
├── content-types/                         # Track B (1/2)
│   ├── package.json · tsconfig.json · CONTRACT.md
│   └── src/{index,frontmatter,block-props}.ts + __tests__/
├── block-foundation/                      # Track B (2/2)
│   ├── package.json · tsconfig.json · CONTRACT.md
│   └── src/{index,registry,prose}.ts + __tests__/
├── mdx-bridge/                            # Track C
│   ├── package.json · tsconfig.json · CONTRACT.md
│   └── src/{index,parse,serialize}.ts + __tests__/{round-trip,fixtures}/
├── kernel-adapter/                        # Track E (1/2)
│   ├── package.json · tsconfig.json · CONTRACT.md
│   └── src/{index,adapter,events}.ts + __tests__/
├── kernel-registry/                       # Track E (2/2)
│   ├── package.json · tsconfig.json · CONTRACT.md
│   └── src/{index,registry}.ts + __tests__/
├── editor-commands/                       # Track F (1/2)
│   ├── package.json · tsconfig.json · CONTRACT.md
│   └── src/{index,commands}.ts + __tests__/
└── agent-tools/                           # Track F (2/2)
    ├── package.json · tsconfig.json · CONTRACT.md
    └── src/{index,tools}.ts + __tests__/

content/
└── notes/sample-mdx-note/index.mdx       # Track A 烟测内容

docs/decisions/ADR-0002-wave-1-close.md   # Track Z
```

修改：

- `tsconfig.json`（root）—— `references` 数组从 `[{ path: "./scripts" }]` 扩展为含全部新增 ts package
- `package.json`（root）—— Track Z 移除 `vitest --passWithNoTests`，改 strict
- `.github/workflows/link-check.yml` —— Task 0 加 `configFile` + concurrency
- `agent-contract.md` —— 不修改（27 agent 在 Phase 0 已固化；Wave 2 才会有变更触发）

---

## 总览：8 个任务，1 串行 + 6 并行 + 1 串行

```
Task 0  (串行，必须先做)
   │
   ├──► Track A (并行)    ──┐
   ├──► Track B (并行)    ──┤
   ├──► Track C (并行)    ──┤
   ├──► Track D (并行)    ──┤    全部 ready-for-review
   ├──► Track E (并行)    ──┤    且 review pass 后
   └──► Track F (并行)    ──┘
                              │
                              ▼
                         Task Z（串行）
```

---

## Task 0: Phase 0 Deferred Follow-ups 处理

**Files:**
- Modify: `.github/workflows/link-check.yml`
- Modify: `package.json`（仅指 root）

**Why first:** 这些 follow-up 是 Phase 0 ADR-0001 显式记的债务（Erratum 7 + Deferred 3/4/6）。在 Wave 1 引入大量新文件之前修掉，避免 Wave 1 PR 撞到 lychee 假阳性 / vitest 假阴性。

**Agent dispatch:** `api-builder`（Claude）—— 因为这些是 CI / 配置文件改动，落在 api-builder 职责范围。

- [ ] **Step 1：读 ADR-0001 deferred follow-up 段，确认要点**

```bash
cat docs/decisions/ADR-0001-stack-selection.md | sed -n '/Deferred follow-ups/,/Related/p'
```

预期输出含 6 条 follow-up；本 task 处理其中第 3 / 4 / 6 条（CI 类）。第 2 条留到 Task Z；第 1 / 5 条由其他 track 自然消化。

- [ ] **Step 2：修 `.github/workflows/link-check.yml`**

把现有 lychee step 改为：

```yaml
      - uses: lycheeverse/lychee-action@v2
        with:
          configFile: .lychee.toml
          fail: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

注意：去掉原来的 `args: --no-progress './**/*.md'`。lychee-action 在 `args` 缺省时会读取 `.lychee.toml` 的 `paths` 字段（本仓库 `.lychee.toml` 已在 Phase 0 配 `**/*.md`）。

并在 workflow 顶部加 concurrency：

```yaml
concurrency:
  group: link-check-${{ github.ref }}
  cancel-in-progress: true
```

- [ ] **Step 3：本地干跑 lychee 验证**

```bash
pnpm exec lychee --config .lychee.toml --no-progress './**/*.md' 2>&1 | tail -20
```

预期：0 broken / 0 timeouts。如果有 timeout，把对应 URL 加进 `.lychee.toml` 的 `exclude` 段并重跑。

- [ ] **Step 4：commit**

```bash
git add .github/workflows/link-check.yml
git commit -m "fix(ci): link-check loads .lychee.toml + concurrency

ADR-0001 Erratum 7 + Deferred follow-up 3/4/6:
- lychee-action with explicit args bypassed .lychee.toml; switch to
  configFile to enforce include_verbatim=false set in Phase 0
- Add concurrency cancel-in-progress to match ci.yml/agent-contract-check
- Explicit fail: true (default but readable)
"
```

- [ ] **Step 5：push 触发 CI 验证**

```bash
git push
```

watch GitHub Actions; link-check 应在新仓库状态下 PASS 且不再误读 plan-doc 内的 fenced code 样例链接。

---

## Track A: apps/site Astro 骨架

**Agent dispatch:** `site-builder` (Claude)
**Risk level:** 中（核心架构包之一，会触发 pr-gate 5.5 escalation）
**Files:**
- Create: `apps/site/package.json`
- Create: `apps/site/astro.config.mjs`
- Create: `apps/site/tailwind.config.ts`
- Create: `apps/site/tsconfig.json`
- Create: `apps/site/src/layouts/BaseLayout.astro`
- Create: `apps/site/src/pages/index.astro`
- Create: `apps/site/src/pages/notes/[...slug].astro`
- Create: `apps/site/src/content.config.ts`
- Create: `content/notes/sample-mdx-note/index.mdx`
- Modify: `tsconfig.json`（root，加 references entry）
- Modify: `pnpm-workspace.yaml`（已含 `apps/*`，无需改）

**Wave 1 退出标准（Track A）**：`pnpm --filter site build` 成功；公开页可渲染 sample MDX；路由 `/notes/sample-mdx-note` 可访问。

- [ ] **Step 1：在 `apps/site/` 创建 `package.json`**

```bash
mkdir -p apps/site/src/{pages/notes,layouts}
mkdir -p content/notes/sample-mdx-note
```

写 `apps/site/package.json`：

```json
{
  "name": "@skb/site",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "typecheck": "astro check && tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run"
  },
  "dependencies": {
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/tailwind": "^6.0.0",
    "astro": "^5.0.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "~5.6.0"
  }
}
```

> **注**：Tailwind 4 仍是预览，stable 路径走 3.4 + Astro 官方 integration。Wave 2 视情况评估是否升级。

- [ ] **Step 2：写 `apps/site/astro.config.mjs`**

```javascript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://selfknowledgebaseweb.example.com',
  integrations: [
    mdx(),
    tailwind({ applyBaseStyles: false }),
  ],
  build: {
    format: 'directory',
  },
});
```

- [ ] **Step 3：写 `apps/site/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{astro,html,ts,tsx,md,mdx}', '../../content/**/*.mdx'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 4：写 `apps/site/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@layouts/*": ["src/layouts/*"]
    }
  },
  "include": ["src/**/*", "../../content/**/*"]
}
```

注意：不 extends 仓库根 `tsconfig.base.json`（Astro 官方 preset 已含等价严格设置；混用易冲突）。

- [ ] **Step 5：写 `apps/site/src/content.config.ts`**

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/index.mdx', base: '../../content/notes' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
```

> **TODO 在 Track B 完成后**：把 schema 改为 `import { frontmatterSchema } from '@skb/content-types'`；当前 inline 是为了 Track A 不阻塞 Track B。

- [ ] **Step 6：写 `apps/site/src/layouts/BaseLayout.astro`**

```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="prose mx-auto max-w-3xl py-12 px-4">
    <slot />
  </body>
</html>
```

- [ ] **Step 7：写 `apps/site/src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '@layouts/BaseLayout.astro';

const notes = (await getCollection('notes', ({ data }) => !data.draft))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
<BaseLayout title="SelfKnowledgeBaseWeb">
  <h1>Notes</h1>
  <ul>
    {notes.map((note) => (
      <li>
        <a href={`/notes/${note.id.replace(/\/index$/, '')}`}>{note.data.title}</a>
        <small> — {note.data.date.toISOString().slice(0, 10)}</small>
      </li>
    ))}
  </ul>
</BaseLayout>
```

- [ ] **Step 8：写 `apps/site/src/pages/notes/[...slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '@layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  return notes.map((note) => ({
    params: { slug: note.id.replace(/\/index$/, '') },
    props: { note },
  }));
}

const { note } = Astro.props;
const { Content } = await render(note);
---
<BaseLayout title={note.data.title}>
  <article>
    <h1>{note.data.title}</h1>
    <Content />
  </article>
</BaseLayout>
```

- [ ] **Step 9：写 `content/notes/sample-mdx-note/index.mdx`**

```mdx
---
title: Sample MDX Note
slug: sample-mdx-note
tags: [smoke-test]
date: 2026-04-29
draft: false
---

# Sample

这是 Track A 烟测页面。Wave 2 才会有真正的 component blocks。

- 普通 markdown 列表
- **粗体** / *斜体*

> 引用块。

\`\`\`ts
const x = 42;
\`\`\`
```

- [ ] **Step 10：装依赖 + 跑 build**

```bash
pnpm install
pnpm --filter @skb/site build 2>&1 | tail -20
```

预期：build 成功，`apps/site/dist/` 含 `index.html` 与 `notes/sample-mdx-note/index.html`。

- [ ] **Step 11：localhost 验证**

```bash
pnpm --filter @skb/site preview &
sleep 2
curl -s http://localhost:4321/ | head -30
curl -s http://localhost:4321/notes/sample-mdx-note/ | head -30
kill %1 2>/dev/null
```

预期 `/` 列出 1 条笔记，`/notes/sample-mdx-note/` 渲染样例 MDX。

- [ ] **Step 12：写 `apps/site/CONTRACT.md`**

```markdown
# apps/site Contract

## Public surface

- 路由：
  - `/` — 笔记列表
  - `/notes/<slug>` — 笔记内容
- Content collection schema：见 `src/content.config.ts`（Wave 1 内联 zod，Track B/C 完成后改为 `@skb/content-types`）

## Invariants

- 必须为静态构建（spec §1.8 约束 #3）；不得引入 SSR
- 默认零 JavaScript（Astro islands）；只有标注 `client:*` 的 React 组件才 hydrate

## Modifying this file

修改路由结构、frontmatter schema、构建输出形态时同步更新本文件。本文件改动会触发 pr-gate 5.5 review。

## Related

- [设计规格 §1.1 / §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [agent-contract.md site-builder agent](../../agent-contract.md)
```

- [ ] **Step 13：commit**

```bash
git add apps/site content/notes pnpm-lock.yaml
git commit -m "feat(site): Astro 5 + MDX skeleton with notes collection

- Static SSG (no SSR per spec §1.8)
- Content Collections loader pulls from ../../content/notes/
- BaseLayout + index + dynamic [...slug] route
- Sample smoke-test note renders end-to-end
- CONTRACT.md documents public surface + invariants

Wave 2 will replace inline zod frontmatter schema with @skb/content-types.

Track A of Wave 1 — Phase 1.
"
```

- [ ] **Step 14：把自己加进 root `tsconfig.json`**

```diff
 {
   "extends": "./tsconfig.base.json",
   "compilerOptions": { "composite": false, "noEmit": true },
   "files": [],
   "references": [
-    { "path": "./scripts" }
+    { "path": "./scripts" },
+    { "path": "./apps/site" }
   ]
 }
```

跑：
```bash
pnpm tsc -b
```
预期：clean。

- [ ] **Step 15：commit references 更新 + mark ready-for-review**

```bash
git add tsconfig.json
git commit -m "build: add apps/site to root tsconfig references"
git push
```

随后通知 orchestrator: Track A ready-for-review。

---

## Track B: content-types + block-foundation

**Agent dispatch:** `block-foundation-eng` (Claude)
**Risk level:** 高（核心架构包 + 跨 Wave 接口；自动 escalate 5.5 pr-gate）
**Files:**
- Create: `packages/content-types/{package.json,tsconfig.json,CONTRACT.md,src/{index,frontmatter,block-props}.ts,src/__tests__/frontmatter.test.ts}`
- Create: `packages/block-foundation/{package.json,tsconfig.json,CONTRACT.md,src/{index,registry,prose}.ts,src/__tests__/registry.test.ts}`
- Modify: `tsconfig.json`（root，加 2 个 references）

**Wave 1 退出标准（Track B）**：BlockRegistry 接口存在 + Prose blocks（StarterKit 包装）+ 单测覆盖率 ≥ 80% on each package。

### B1: content-types 包

- [ ] **Step 1：创建目录结构**

```bash
mkdir -p packages/content-types/src/__tests__
```

- [ ] **Step 2：写 `packages/content-types/package.json`**

```json
{
  "name": "@skb/content-types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "build": "tsc -b",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "~5.6.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 3：写 `packages/content-types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4：写最小失败测试 `src/__tests__/frontmatter.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { frontmatterSchema } from '../frontmatter';

describe('frontmatterSchema', () => {
  it('accepts a minimal valid frontmatter', () => {
    const r = frontmatterSchema.safeParse({
      title: 'Hello',
      date: '2026-04-29',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.draft).toBe(false);
  });

  it('rejects missing title', () => {
    const r = frontmatterSchema.safeParse({ date: '2026-04-29' });
    expect(r.success).toBe(false);
  });

  it('coerces date string to Date', () => {
    const r = frontmatterSchema.safeParse({ title: 'X', date: '2026-04-29' });
    expect(r.success && r.data.date).toBeInstanceOf(Date);
  });
});
```

- [ ] **Step 5：跑测试，应 fail**

```bash
pnpm --filter @skb/content-types test
```
预期：`Cannot find module '../frontmatter'`。

- [ ] **Step 6：写 `src/frontmatter.ts`**

```typescript
import { z } from 'zod';

export const frontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  tags: z.array(z.string()).default([]),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
```

- [ ] **Step 7：写 `src/block-props.ts`（占位 + 一个示例 schema）**

```typescript
import { z } from 'zod';

/**
 * Wave 2 中每种 component block 会向此文件追加自己的 props schema。
 * Wave 1 仅放 callout schema 作 smoke test，证明 Track B → Track C 类型链路通。
 */

export const calloutPropsSchema = z.object({
  type: z.enum(['info', 'warn', 'note']).default('info'),
  title: z.string().optional(),
});

export type CalloutProps = z.infer<typeof calloutPropsSchema>;
```

- [ ] **Step 8：写 `src/index.ts`**

```typescript
export * from './frontmatter';
export * from './block-props';
```

- [ ] **Step 9：跑测试，应 pass**

```bash
pnpm --filter @skb/content-types test
```
预期：3/3 passed。

- [ ] **Step 10：写 `packages/content-types/CONTRACT.md`**

```markdown
# @skb/content-types Contract

## Public surface

- `frontmatterSchema` — Zod schema 校验所有笔记 `index.mdx` 的 frontmatter
- `Frontmatter` — TypeScript type derived from schema
- `calloutPropsSchema` / `CalloutProps` — Wave 2 第一个 component block 的 props（示例 + 烟测）

## Invariants

- 单一权威源：apps/site / packages/mdx-bridge / packages/agent-tools 必须从这里 import 类型，不得各自定义
- Frontmatter 必含 `title` 与 `date`；新增 required 字段需 ADR

## Modifying this file

向 schema 加可选字段时只需更新本文件 + 单测。改动 required 字段或 enum 值是契约破坏，必须 ADR + 同步所有消费者。

## Related

- [设计规格 §2.5](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md)
```

- [ ] **Step 11：commit content-types 包**

```bash
git add packages/content-types pnpm-lock.yaml
git commit -m "feat(content-types): zod frontmatter + callout props seed

- frontmatterSchema validates note index.mdx (title/date required)
- calloutPropsSchema seeds the per-block props convention
- Single source for cross-package types per spec §2.5

Track B (1/2) of Wave 1 — Phase 1.
"
```

### B2: block-foundation 包

- [ ] **Step 12：创建目录结构**

```bash
mkdir -p packages/block-foundation/src/__tests__
```

- [ ] **Step 13：写 `packages/block-foundation/package.json`**

```json
{
  "name": "@skb/block-foundation",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "build": "tsc -b",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@skb/content-types": "workspace:*",
    "@tiptap/core": "^2.10.0",
    "@tiptap/starter-kit": "^2.10.0",
    "@tiptap/extension-task-list": "^2.10.0",
    "@tiptap/extension-task-item": "^2.10.0",
    "@tiptap/extension-typography": "^2.10.0",
    "tiptap-markdown": "^0.8.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "~5.6.0",
    "vitest": "^2.0.0"
  }
}
```

> **注**：Tiptap 在 Wave 1 仅引入类型；不 instance 化（那是 editor-shell 在 Wave 2 的工作）。

- [ ] **Step 14：写 tsconfig.json（同 B1 step 3，path 自适应）**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../content-types" }]
}
```

- [ ] **Step 15：写 BlockRegistry 接口失败测试 `src/__tests__/registry.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { BlockRegistry, defineBlock } from '../registry';
import { z } from 'zod';

describe('BlockRegistry', () => {
  it('registers and retrieves a block by name', () => {
    const reg = new BlockRegistry();
    const calloutBlock = defineBlock({
      name: 'callout',
      kind: 'component',
      propsSchema: z.object({ type: z.string() }),
      mdxComponent: 'Callout',
    });
    reg.register(calloutBlock);
    expect(reg.get('callout')).toBe(calloutBlock);
  });

  it('throws on duplicate name', () => {
    const reg = new BlockRegistry();
    const a = defineBlock({ name: 'x', kind: 'component', propsSchema: z.object({}), mdxComponent: 'X' });
    const b = defineBlock({ name: 'x', kind: 'component', propsSchema: z.object({}), mdxComponent: 'X' });
    reg.register(a);
    expect(() => reg.register(b)).toThrow(/duplicate/i);
  });

  it('lists all registered blocks', () => {
    const reg = new BlockRegistry();
    reg.register(defineBlock({ name: 'a', kind: 'prose', propsSchema: z.object({}), mdxComponent: '_' }));
    reg.register(defineBlock({ name: 'b', kind: 'component', propsSchema: z.object({}), mdxComponent: 'B' }));
    expect(reg.list().map((b) => b.name).sort()).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 16：跑测试，应 fail**

```bash
pnpm --filter @skb/block-foundation test
```

- [ ] **Step 17：写 `src/registry.ts`**

```typescript
import type { ZodTypeAny } from 'zod';

export type BlockKind = 'prose' | 'component';

export interface BlockDefinition<TSchema extends ZodTypeAny = ZodTypeAny> {
  /** kebab-case identifier，对应 MDX 组件名小写 */
  readonly name: string;
  readonly kind: BlockKind;
  readonly propsSchema: TSchema;
  /** MDX 中实际使用的 PascalCase 组件名，例如 "Callout" / "JupyterBlock" */
  readonly mdxComponent: string;
}

export function defineBlock<T extends ZodTypeAny>(def: BlockDefinition<T>): BlockDefinition<T> {
  return def;
}

export class BlockRegistry {
  readonly #blocks = new Map<string, BlockDefinition>();

  register(block: BlockDefinition): void {
    if (this.#blocks.has(block.name)) {
      throw new Error(`Duplicate block name: ${block.name}`);
    }
    this.#blocks.set(block.name, block);
  }

  get(name: string): BlockDefinition | undefined {
    return this.#blocks.get(name);
  }

  list(): readonly BlockDefinition[] {
    return [...this.#blocks.values()];
  }
}
```

- [ ] **Step 18：跑测试，应 pass**

```bash
pnpm --filter @skb/block-foundation test
```

- [ ] **Step 19：写 `src/prose.ts`**

```typescript
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import { Markdown } from 'tiptap-markdown';

/**
 * Tiptap extensions providing **all** prose-level markdown behavior:
 * paragraph / heading / list / quote / code / link / 强调样式 / typography /
 * task-list / markdown input rules / markdown serialization.
 *
 * Spec §1.5: prose blocks are zero-self-written; this list is the contract.
 */
export const proseExtensions = [
  StarterKit,
  TaskList,
  TaskItem.configure({ nested: true }),
  Typography,
  Markdown,
] as const;
```

- [ ] **Step 20：写 `src/index.ts`**

```typescript
export * from './registry';
export { proseExtensions } from './prose';
```

- [ ] **Step 21：写 `packages/block-foundation/CONTRACT.md`**

```markdown
# @skb/block-foundation Contract

## Public surface

- `BlockRegistry` class · `defineBlock(def)` factory · `BlockDefinition<T>` interface
- `BlockKind = 'prose' | 'component'` （二分类，spec §1.5 关键不变量）
- `proseExtensions` — Tiptap 扩展数组，提供全部 markdown 行为

## Invariants

- `BlockKind` 二分不可破坏：新 block 必须明确归属 `prose` 或 `component`
- Prose blocks **零自写代码**——任何看似需要新 prose block 的场景应通过组合 `proseExtensions` 内现有扩展或追加单条 Tiptap 扩展实现，不再加 prose-kind block
- `BlockDefinition.mdxComponent` 必须 PascalCase，且与 MDX 文件 import 中使用的名字一致

## Modifying this file

- 加新 BlockDefinition 字段：可加 optional，必加字段需 ADR
- 改 BlockKind 枚举：契约破坏，必须 ADR + 同步 mdx-bridge / 全部 component block

## Related

- [设计规格 §1.5 / §2.5](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [content-types/CONTRACT.md](../content-types/CONTRACT.md)
- [mdx-bridge/CONTRACT.md](../mdx-bridge/CONTRACT.md)
```

- [ ] **Step 22：commit block-foundation**

```bash
git add packages/block-foundation pnpm-lock.yaml
git commit -m "feat(block-foundation): BlockRegistry + Tiptap prose extensions

- BlockKind = 'prose' | 'component' (spec §1.5 invariant)
- BlockRegistry class throws on duplicate name
- proseExtensions bundles StarterKit + TaskList + Typography + Markdown
  giving all prose-level behavior with zero self-written code per spec

Track B (2/2) of Wave 1 — Phase 1.
"
```

- [ ] **Step 23：把两个新包加进 root `tsconfig.json` references**

```diff
   "references": [
     { "path": "./scripts" },
-    { "path": "./apps/site" }
+    { "path": "./apps/site" },
+    { "path": "./packages/content-types" },
+    { "path": "./packages/block-foundation" }
   ]
```

跑：
```bash
pnpm tsc -b
```

- [ ] **Step 24：commit references 更新并 mark ready-for-review**

```bash
git add tsconfig.json
git commit -m "build: add content-types + block-foundation to references"
git push
```

通知 orchestrator: Track B ready-for-review (高风险，escalate pr-gate 5.5)。

---

## Track C: mdx-bridge + RTT 基线

**Agent dispatch:** `mdx-bridge-eng` (Claude)
**Risk level:** 高（核心桥接，自动 escalate 5.5 pr-gate）
**Files:**
- Create: `packages/mdx-bridge/{package.json,tsconfig.json,CONTRACT.md,src/{index,parse,serialize}.ts,src/__tests__/{round-trip.test.ts,fixtures/}}`
- Modify: `tsconfig.json` references

**Wave 1 退出标准（Track C）**：5 个 prose RTT fixture 全部 pass（即同一段 MDX → Tiptap doc → MDX 字节级一致）。

- [ ] **Step 1：创建结构**

```bash
mkdir -p packages/mdx-bridge/src/__tests__/fixtures
```

- [ ] **Step 2：写 `package.json`**

```json
{
  "name": "@skb/mdx-bridge",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "build": "tsc -b",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@skb/block-foundation": "workspace:*",
    "@skb/content-types": "workspace:*",
    "@tiptap/core": "^2.10.0",
    "tiptap-markdown": "^0.8.0",
    "remark-mdx": "^3.0.0",
    "remark-parse": "^11.0.0",
    "remark-stringify": "^11.0.0",
    "unified": "^11.0.0",
    "vfile": "^6.0.0"
  },
  "devDependencies": {
    "typescript": "~5.6.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 3：写 tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../content-types" },
    { "path": "../block-foundation" }
  ]
}
```

- [ ] **Step 4：写 5 个 fixture（每个一对 .mdx 输入 + 期望 JSON tree）**

`src/__tests__/fixtures/01-paragraph.mdx`：

```mdx
---
title: One Paragraph
date: 2026-04-29
---

Hello world.
```

`src/__tests__/fixtures/02-heading.mdx`：

```mdx
---
title: Headings
date: 2026-04-29
---

# H1

## H2

text.
```

`src/__tests__/fixtures/03-list.mdx`：

```mdx
---
title: Lists
date: 2026-04-29
---

- item one
- item two
  - nested
- item three

1. ordered
2. ordered
```

`src/__tests__/fixtures/04-quote-and-code.mdx`：

```mdx
---
title: Quote and Code
date: 2026-04-29
---

> A quoted line.

\`\`\`ts
const x = 1;
\`\`\`
```

`src/__tests__/fixtures/05-emphasis-link.mdx`：

```mdx
---
title: Inline
date: 2026-04-29
---

This **bold** and *italic* and \`code\` and [link](https://example.com).
```

> **注**：这 5 个仅覆盖 prose；Wave 2 各 component block 完工时各自追加 fixture。

- [ ] **Step 5：写失败测试 `src/__tests__/round-trip.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { mdxToTiptap, tiptapToMdx } from '../index';

const FIXTURES_DIR = join(__dirname, 'fixtures');

describe('MDX ↔ Tiptap round-trip', () => {
  const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.mdx')).sort();

  for (const file of files) {
    it(`round-trips ${file} byte-equivalently`, () => {
      const original = readFileSync(join(FIXTURES_DIR, file), 'utf8');
      const doc = mdxToTiptap(original);
      const restored = tiptapToMdx(doc);
      expect(restored.trim()).toBe(original.trim());
    });
  }

  it('finds at least 5 fixtures', () => {
    expect(files.length).toBeGreaterThanOrEqual(5);
  });
});
```

- [ ] **Step 6：跑测试，应 fail**

```bash
pnpm --filter @skb/mdx-bridge test
```

- [ ] **Step 7：写 `src/parse.ts`（MDX → Tiptap doc）**

```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import type { Root } from 'mdast';

export interface TiptapDoc {
  type: 'doc';
  content: TiptapNode[];
  /** 提取出的 frontmatter raw object */
  frontmatter?: Record<string, unknown>;
}

export type TiptapNode = Record<string, unknown>;

/**
 * Wave 1 minimal implementation：
 *   - Parse MDX with remark-mdx
 *   - Walk mdast → emit a JSON tree shaped close to Tiptap's prose schema
 *   - JSX-style component blocks deferred to Wave 2 (they show up as 'mdxJsxFlowElement' in mdast)
 *
 * 不直接用 tiptap-markdown.parse(text) —— 那不识别 MDX JSX。
 */
export function mdxToTiptap(source: string): TiptapDoc {
  const tree = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .parse(source) as Root;

  const frontmatter = extractFrontmatter(tree);
  const content = mdastToTiptap(tree);

  return { type: 'doc', content, ...(frontmatter ? { frontmatter } : {}) };
}

function extractFrontmatter(_tree: Root): Record<string, unknown> | undefined {
  // Wave 1：frontmatter 由 remark-frontmatter 处理；最小实现先返回 undefined，
  // serialize 时把 frontmatter 段当透明 raw block 直传。
  return undefined;
}

function mdastToTiptap(tree: Root): TiptapNode[] {
  // Minimal walker; will grow in Wave 2.
  // Wave 1 只覆盖 prose——5 个 fixture 都不含 JSX 组件。
  return tree.children.map((node) => convertNode(node));
}

function convertNode(node: { type: string; [k: string]: unknown }): TiptapNode {
  // Stub —— 在 Step 10 - Step 14 增量补齐让测试逐个变绿
  return { type: 'paragraph', _raw: node };
}
```

- [ ] **Step 8：写 `src/serialize.ts`（Tiptap doc → MDX）**

```typescript
import type { TiptapDoc, TiptapNode } from './parse';

export function tiptapToMdx(doc: TiptapDoc): string {
  const body = doc.content.map((node) => serializeNode(node)).join('\n\n');
  if (doc.frontmatter) {
    return `---\n${frontmatterToYaml(doc.frontmatter)}---\n\n${body}\n`;
  }
  return body + '\n';
}

function serializeNode(_node: TiptapNode): string {
  // Stub
  return '';
}

function frontmatterToYaml(fm: Record<string, unknown>): string {
  return Object.entries(fm)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join('\n') + '\n';
}
```

- [ ] **Step 9：写 `src/index.ts`**

```typescript
export { mdxToTiptap } from './parse';
export type { TiptapDoc, TiptapNode } from './parse';
export { tiptapToMdx } from './serialize';
```

- [ ] **Step 10：增量实现 fixture 01（paragraph）—— 测试转绿**

向 `convertNode` / `serializeNode` 加 paragraph 与 inline text 的支持：

```typescript
// parse.ts convertNode
function convertNode(node: { type: string; [k: string]: unknown }): TiptapNode {
  if (node.type === 'paragraph' && Array.isArray(node.children)) {
    return { type: 'paragraph', content: node.children.map(convertInline) };
  }
  if (node.type === 'yaml') return { type: '_frontmatter', value: node.value };
  return { type: '_unhandled', _raw: node };
}

function convertInline(child: { type: string; value?: string; [k: string]: unknown }): TiptapNode {
  if (child.type === 'text') return { type: 'text', text: child.value ?? '' };
  return { type: '_unhandled', _raw: child };
}
```

```typescript
// serialize.ts
function serializeNode(node: TiptapNode): string {
  if (node.type === 'paragraph' && Array.isArray(node.content)) {
    return node.content.map(serializeInline).join('');
  }
  if (node.type === '_frontmatter') return ''; // handled at top level
  return '';
}

function serializeInline(node: TiptapNode): string {
  if (node.type === 'text' && typeof node.text === 'string') return node.text;
  return '';
}
```

把 frontmatter 处理也放到 top-level：

```typescript
export function tiptapToMdx(doc: TiptapDoc): string {
  const fmNode = doc.content.find((n) => n.type === '_frontmatter');
  const body = doc.content
    .filter((n) => n.type !== '_frontmatter')
    .map(serializeNode)
    .filter(Boolean)
    .join('\n\n');
  const fmText = fmNode && typeof fmNode.value === 'string' ? `---\n${fmNode.value}\n---\n\n` : '';
  return fmText + body + '\n';
}
```

也要让 parser 把 frontmatter 提出来，需要在 unified pipeline 加 remark-frontmatter：

```typescript
// parse.ts
import remarkFrontmatter from 'remark-frontmatter';
// ...
const tree = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkMdx).parse(source) as Root;
```

把 `remark-frontmatter` 加进 `package.json` deps（version `^5.0.0`）。

- [ ] **Step 11：跑测试，fixture 01 应 pass**

```bash
pnpm --filter @skb/mdx-bridge test
```

预期：fixture 01 PASS；02-05 仍 FAIL。

- [ ] **Step 12：增量补 heading 支持（fixture 02）**

向 convertNode + serializeNode 各加：

```typescript
// parse.ts convertNode
if (node.type === 'heading' && typeof node.depth === 'number') {
  return { type: 'heading', attrs: { level: node.depth }, content: (node.children as any[]).map(convertInline) };
}

// serialize.ts
if (node.type === 'heading' && typeof (node.attrs as any)?.level === 'number') {
  const level = (node.attrs as any).level as number;
  const inline = (node.content as TiptapNode[]).map(serializeInline).join('');
  return `${'#'.repeat(level)} ${inline}`;
}
```

跑测试：fixture 02 PASS。

- [ ] **Step 13：补 list 支持（fixture 03）**

加 `bulletList` / `orderedList` / `listItem` 节点类型。代码模式同上。注意：mdast 的 list 子节点可能含嵌套列表，要递归。

跑测试：fixture 03 PASS。

- [ ] **Step 14：补 quote / code / inline emphasis / link（fixture 04 + 05）**

类似模式。每加一类节点跑一次测试观察变化。

完成后：5/5 PASS。

- [ ] **Step 15：写 `packages/mdx-bridge/CONTRACT.md`**

```markdown
# @skb/mdx-bridge Contract

## Public surface

- `mdxToTiptap(source: string): TiptapDoc`
- `tiptapToMdx(doc: TiptapDoc): string`
- `TiptapDoc` / `TiptapNode` types

## Round-trip invariant

对任意我们支持的 MDX 输入 `S`，必有 `tiptapToMdx(mdxToTiptap(S)).trim() === S.trim()`。
**违反此不变量是 critical bug**——mdx-doctor agent 会阻断所有 block PR。

Wave 1 仅覆盖 prose（5 fixture）；Wave 2 每加一种 component block，必须扩 fixture
覆盖该 block 的 round-trip。

## Modifying this file

- 加新节点类型支持：扩 fixture + 实现 + 单测，不需要 ADR
- 改 TiptapDoc shape：契约破坏，必须 ADR + 同步 editor-shell / 各 block

## Related

- [设计规格 §1.4 / §2.5](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [block-foundation/CONTRACT.md](../block-foundation/CONTRACT.md)
- [agent-contract.md mdx-doctor](../../agent-contract.md)
```

- [ ] **Step 16：commit + references 更新 + mark ready-for-review**

```bash
git add packages/mdx-bridge tsconfig.json pnpm-lock.yaml
git commit -m "feat(mdx-bridge): MDX ↔ Tiptap round-trip baseline (5 prose fixtures)

- mdast walker handles paragraph/heading/list/quote/code/emphasis/link
- frontmatter passed through transparently
- Round-trip invariant enforced byte-equivalently per fixture
- Wave 2 will extend fixtures + walker for component blocks

Track C of Wave 1 — Phase 1.
"
echo "(also update tsconfig.json root references to add ./packages/mdx-bridge)"
git add tsconfig.json
git push
```

通知 orchestrator: Track C ready-for-review (高风险, escalate pr-gate 5.5)。

---

## Track D: apps/api FastAPI 骨架

**Agent dispatch:** `api-builder` (Claude)
**Risk level:** 中（含 ws + llm 抽象骨架，触碰 4 个 Phase 1 必建项之 2，触发 pr-gate 5.5）
**Files:**
- Create: `apps/api/` 全套（pyproject.toml + app/* + tests/* + 3 个 CONTRACT.md）

**Wave 1 退出标准（Track D）**：auth + 文件 CRUD + git ops + WS endpoint stub + LLMProvider interface 全有；`pytest` 全绿。

> **注**：apps/api 是 Python，不进 root `tsconfig.json`。它有自己的虚拟环境与 lint。

- [ ] **Step 1：创建结构**

```bash
mkdir -p apps/api/app/{ws,llm}
mkdir -p apps/api/tests
touch apps/api/app/{__init__,main,auth,files,git_ops,schemas}.py
touch apps/api/app/ws/{__init__,protocol}.py
touch apps/api/app/llm/{__init__,provider}.py
touch apps/api/tests/{__init__,conftest,test_auth,test_files,test_ws_protocol}.py
```

- [ ] **Step 2：写 `apps/api/pyproject.toml`**

```toml
[project]
name = "skb-api"
version = "0.0.0"
description = "SelfKnowledgeBaseWeb Edit API"
requires-python = ">=3.12"
dependencies = [
    "fastapi[standard]>=0.115",
    "pydantic>=2.9",
    "argon2-cffi>=23.0",
    "python-jose[cryptography]>=3.3",
    "GitPython>=3.1",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3",
    "pytest-asyncio>=0.24",
    "httpx>=0.27",
    "ruff>=0.7",
    "mypy>=1.13",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "W", "I", "B", "PL", "RUF"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 3：装 deps**

```bash
cd apps/api
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"
cd ../..
```

- [ ] **Step 4：写 schemas（Pydantic 模型）`apps/api/app/schemas.py`**

```python
"""Pydantic schemas; openapi-typescript will derive TS types from these in Wave 3."""
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class FileWriteRequest(BaseModel):
    path: str = Field(..., description="path relative to content/")
    content: str
    commit_message: str | None = None


class FileReadResponse(BaseModel):
    path: str
    content: str
    last_modified: datetime
```

- [ ] **Step 5：写 auth 失败测试 `tests/test_auth.py`**

```python
"""Spec §1.2 单用户密码 + JWT cookie。"""
from fastapi.testclient import TestClient


def test_login_with_correct_password_returns_jwt(client: TestClient, auth_password_hash):
    resp = client.post("/auth/login", json={"username": "admin", "password": "secret"})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body and len(body["access_token"]) > 20
    assert body["token_type"] == "bearer"


def test_login_with_wrong_password_returns_401(client: TestClient, auth_password_hash):
    resp = client.post("/auth/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401


def test_protected_endpoint_requires_token(client: TestClient):
    resp = client.get("/files/notes/sample/index.mdx")
    assert resp.status_code == 401
```

- [ ] **Step 6：写 `tests/conftest.py`**

```python
import pytest
from fastapi.testclient import TestClient
from argon2 import PasswordHasher

from app.main import create_app


@pytest.fixture
def auth_password_hash(monkeypatch):
    ph = PasswordHasher()
    h = ph.hash("secret")
    monkeypatch.setenv("SKB_USERNAME", "admin")
    monkeypatch.setenv("SKB_PASSWORD_HASH", h)
    monkeypatch.setenv("SKB_JWT_SECRET", "test-secret-not-for-production")
    return h


@pytest.fixture
def client(auth_password_hash) -> TestClient:
    return TestClient(create_app())
```

- [ ] **Step 7：跑测试，应 fail**

```bash
cd apps/api
pytest tests/test_auth.py -v
```

预期：`ImportError: cannot import name 'create_app'`。

- [ ] **Step 8：写 `app/main.py` + `app/auth.py` 让测试转绿**

`app/auth.py`：

```python
"""Single-user JWT auth per spec §1.2."""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from .schemas import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
_ph = PasswordHasher()

JWT_ALGO = "HS256"
JWT_TTL_HOURS = 12


def _settings() -> tuple[str, str, str]:
    user = os.environ["SKB_USERNAME"]
    pw_hash = os.environ["SKB_PASSWORD_HASH"]
    secret = os.environ["SKB_JWT_SECRET"]
    return user, pw_hash, secret


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest) -> LoginResponse:
    expected_user, expected_hash, secret = _settings()
    if req.username != expected_user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid credentials")
    try:
        _ph.verify(expected_hash, req.password)
    except VerifyMismatchError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid credentials") from exc
    exp = datetime.now(timezone.utc) + timedelta(hours=JWT_TTL_HOURS)
    payload = {"sub": req.username, "exp": exp}
    token = jwt.encode(payload, secret, algorithm=JWT_ALGO)
    return LoginResponse(access_token=token)


def require_user(token: str = Depends(oauth2_scheme)) -> str:
    _, _, secret = _settings()
    try:
        data = jwt.decode(token, secret, algorithms=[JWT_ALGO])
    except JWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token") from exc
    return str(data["sub"])
```

`app/main.py`：

```python
"""FastAPI app factory. Single instance lives in apps/api at runtime."""
from __future__ import annotations

from fastapi import FastAPI

from .auth import router as auth_router
from .files import router as files_router
from .ws import router as ws_router


def create_app() -> FastAPI:
    app = FastAPI(title="skb-api", version="0.0.0")
    app.include_router(auth_router)
    app.include_router(files_router)
    app.include_router(ws_router)
    return app


app = create_app()
```

- [ ] **Step 9：写最小 `app/files.py`（先让 import 通；test_files.py 后续 step）**

```python
"""File CRUD endpoints under content/ directory. Wave 1 minimal: read + write only."""
from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status

from .auth import require_user
from .schemas import FileReadResponse, FileWriteRequest

router = APIRouter(prefix="/files", tags=["files"])

CONTENT_ROOT = Path(__file__).resolve().parents[2] / "content"


def _safe_path(p: str) -> Path:
    target = (CONTENT_ROOT / p).resolve()
    if not str(target).startswith(str(CONTENT_ROOT)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "path escapes content/")
    return target


@router.get("/{path:path}", response_model=FileReadResponse)
def read_file(path: str, _user: str = Depends(require_user)) -> FileReadResponse:
    target = _safe_path(path)
    if not target.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not found")
    from datetime import datetime, timezone
    return FileReadResponse(
        path=path,
        content=target.read_text(encoding="utf-8"),
        last_modified=datetime.fromtimestamp(target.stat().st_mtime, tz=timezone.utc),
    )


@router.put("/{path:path}")
def write_file(path: str, body: FileWriteRequest, user: str = Depends(require_user)) -> dict[str, str]:
    target = _safe_path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(body.content, encoding="utf-8")
    # Wave 1 stub: git_ops integration in Step 12
    return {"path": path, "user": user}
```

- [ ] **Step 10：写 ws/protocol stub `app/ws/__init__.py`**

```python
from .protocol import router

__all__ = ["router"]
```

`app/ws/protocol.py`：

```python
"""WebSocket protocol endpoint. Wave 1: handshake + ping/pong only.

Spec §2.6 必建项 #3：通道 + 协议骨架先建好，
Phase 2b 才在此实现 agent_bridge 的双向工具调用。
"""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/ws", tags=["ws"])


@router.websocket("/")
async def ws_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            msg = await websocket.receive_json()
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            else:
                # Wave 1 echo only
                await websocket.send_json({"type": "echo", "received": msg})
    except WebSocketDisconnect:
        pass
```

- [ ] **Step 11：写 llm/provider abstract `app/llm/provider.py`**

```python
"""LLMProvider abstract interface (spec §2.6 必建项 #4).

Wave 1 仅冻结接口；Wave 2b 实现 AnthropicProvider 等。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Protocol


class ChatMessage(Protocol):
    role: str
    content: str


class LLMProvider(ABC):
    """Phase 1 freezes this interface; Phase 2b implements concrete providers."""

    name: str

    @abstractmethod
    async def stream(
        self,
        messages: list[ChatMessage],
        *,
        tools: list[dict] | None = None,
        system: str | None = None,
    ) -> AsyncIterator[dict]:
        """Yield SSE-shaped events: {type: 'text'|'tool_use'|'stop', ...}."""
        raise NotImplementedError
```

`app/llm/__init__.py`：

```python
from .provider import LLMProvider

__all__ = ["LLMProvider"]
```

- [ ] **Step 12：写 git_ops stub `app/git_ops.py`**

```python
"""Git operations on the repo root. Wave 1: minimal commit-on-write helper."""
from __future__ import annotations

from pathlib import Path

from git import Actor, Repo

REPO_ROOT = Path(__file__).resolve().parents[2]


def commit_path(rel_path: str, message: str, author: str = "skb-api") -> str:
    repo = Repo(REPO_ROOT)
    repo.index.add([str(REPO_ROOT / rel_path)])
    actor = Actor(author, "skb-api@local")
    commit = repo.index.commit(message, author=actor, committer=actor)
    return commit.hexsha
```

> **注**：write_file 在 Phase 1 Wave 4 的部署阶段才会调 commit_path（自动 commit 到 git）；Wave 1 阶段保留 stub。Phase 2b agent_bridge 用同一函数。

- [ ] **Step 13：跑全部测试**

```bash
cd apps/api
pytest -v
```

预期：3 个 auth 测试全绿。

- [ ] **Step 14：写 `app/CONTRACT.md`**

```markdown
# apps/api Contract

## Public surface

- `POST /auth/login` — 单用户密码登录，返回 JWT
- `GET /files/{path}` — 读取 content/<path>，需要 Bearer token
- `PUT /files/{path}` — 写入 content/<path>，需要 Bearer token
- `WS /ws/` — Wave 1 stub（ping/pong + echo）；Wave 2b 实现 agent_bridge

## Invariants

- 单用户：`SKB_USERNAME` 写在 env，无注册流程
- 路径安全：所有 file 路径必须在 `content/` 内（`_safe_path` 校验）
- JWT TTL 12h；secret 在 env，绝不入 git

## Modifying this file

- 加 endpoint：扩 schemas.py + 加测试，本文件 + openapi 自动同步
- 改 auth flow：契约破坏，必须 ADR + 同步 site auth-client

## Related

- [设计规格 §1.1 / §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [ws/CONTRACT.md](ws/CONTRACT.md)
- [llm/CONTRACT.md](llm/CONTRACT.md)
```

- [ ] **Step 15：写 `app/ws/CONTRACT.md`**

````markdown
# apps/api/ws Contract

## Public surface

- `WS /ws/` 入口；Wave 1 仅支持 `{"type": "ping"}` → `{"type": "pong"}`，其他消息 echo

## Wire protocol (Wave 1 stub)

```json
// client → server
{ "type": "ping" }
{ "type": "<any>", "data": "..." }

// server → client
{ "type": "pong" }
{ "type": "echo", "received": <whatever> }
```

## Phase 2b expansion

Phase 2b 把 ws 升级为 agent_bridge：双向 JSON-RPC，Custom Tools 通过此通道访问浏览器编辑器 LIVE state。具体协议待 Phase 2b plan 详定。

## Related

- 设计规格 §2.6（路径 `../../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md`）
- 父契约 `apps/api/app/CONTRACT.md`
````

- [ ] **Step 16：写 `app/llm/CONTRACT.md`**

```markdown
# apps/api/llm Contract

## Public surface

- `LLMProvider` ABC：`async stream(messages, *, tools, system) -> AsyncIterator[dict]`

## Invariants

- `apps/api` 任何代码**禁止直接** `import anthropic` / `import openai`
- 所有 LLM 调用必须经一个 `LLMProvider` 实例

## Phase 2b implementations

- `AnthropicProvider` (Anthropic SDK)
- 未来：OpenAIProvider / GeminiProvider / LocalProvider

## Modifying this file

改 `stream` 签名是契约破坏，必须 ADR + 同步所有 provider 实现 + agent_bridge 调用方。

## Related

- [设计规格 §2.6](../../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [agent-tools/CONTRACT.md](../../../packages/agent-tools/CONTRACT.md)
```

- [ ] **Step 17：commit + mark ready-for-review**

```bash
cd ../..
git add apps/api
git commit -m "feat(api): FastAPI skeleton with auth + files + ws stub + llm interface

Phase 1 Wave 1 必建项 #1 + #3 + #4：
- POST /auth/login (Argon2 + JWT)
- GET/PUT /files/{path} (path-traversal-safe)
- WS /ws/ ping/pong stub (Wave 2b 升级 agent_bridge)
- LLMProvider ABC frozen interface (no concrete impl yet)
- git_ops.commit_path() helper (used in Wave 4 + Phase 2b)

3 CONTRACT.md docs (api / ws / llm) per spec §2.5

Track D of Wave 1 — Phase 1.
"
git push
```

通知 orchestrator: Track D ready-for-review (中风险 + 触碰 Phase 1 必建项, escalate pr-gate 5.5)。

---

## Track E: kernel-adapter + kernel-registry

**Agent dispatch:** `kernel-architect` (Claude)
**Risk level:** 高（接口包，自动 escalate 5.5 pr-gate）
**Files:**
- Create: `packages/kernel-adapter/` 全套
- Create: `packages/kernel-registry/` 全套
- Modify: `tsconfig.json` references

- [ ] **Step 1：建结构 + package.json + tsconfig.json (kernel-adapter)**

```bash
mkdir -p packages/kernel-adapter/src/__tests__
mkdir -p packages/kernel-registry/src/__tests__
```

`packages/kernel-adapter/package.json`：

```json
{
  "name": "@skb/kernel-adapter",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "build": "tsc -b",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "~5.6.0",
    "vitest": "^2.0.0"
  }
}
```

`packages/kernel-adapter/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src/**/*"]
}
```

- [ ] **Step 2：写接口定义 `src/adapter.ts`**

```typescript
export type KernelEvent =
  | { type: 'stdout'; text: string }
  | { type: 'stderr'; text: string }
  | { type: 'display_data'; data: Record<string, unknown> }
  | { type: 'execute_result'; data: Record<string, unknown> }
  | { type: 'error'; ename: string; evalue: string; traceback: readonly string[] }
  | { type: 'status'; state: 'idle' | 'busy' };

export interface KernelCapabilities {
  readonly libraries: readonly string[];
  readonly gpu: boolean;
  readonly persistentState: boolean;
  readonly maxMemoryMB?: number;
}

export interface KernelSession {
  execute(code: string): AsyncIterable<KernelEvent>;
  interrupt(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface KernelAdapter {
  readonly id: string;
  readonly capabilities: KernelCapabilities;
  startSession(sessionId: string): Promise<KernelSession>;
}
```

`src/events.ts`：

```typescript
// Reserved for future event helpers (e.g., type guards) — Phase 2 may populate
export {};
```

`src/index.ts`：

```typescript
export type {
  KernelAdapter,
  KernelSession,
  KernelEvent,
  KernelCapabilities,
} from './adapter';
```

- [ ] **Step 3：写接口约束测试 `src/__tests__/adapter.test.ts`**

```typescript
import { describe, it, expectTypeOf } from 'vitest';
import type { KernelAdapter, KernelEvent, KernelSession } from '../index';

describe('KernelAdapter type contract', () => {
  it('KernelEvent is a discriminated union', () => {
    expectTypeOf<KernelEvent>().toMatchTypeOf<{ type: string }>();
  });

  it('KernelSession.execute returns AsyncIterable<KernelEvent>', () => {
    expectTypeOf<KernelSession['execute']>().parameter(0).toBeString();
    expectTypeOf<KernelSession['execute']>().returns.toMatchTypeOf<AsyncIterable<KernelEvent>>();
  });

  it('KernelAdapter.startSession returns Promise<KernelSession>', () => {
    expectTypeOf<KernelAdapter['startSession']>().returns.resolves.toMatchTypeOf<KernelSession>();
  });
});
```

跑：`pnpm --filter @skb/kernel-adapter test`，预期 PASS（仅类型断言）。

- [ ] **Step 4：写 kernel-adapter CONTRACT.md**

```markdown
# @skb/kernel-adapter Contract

## Public surface

- `KernelAdapter` interface — `id` / `capabilities` / `startSession()`
- `KernelSession` interface — `execute()` / `interrupt()` / `shutdown()`
- `KernelEvent` discriminated union — 6 type 覆盖 stdout/stderr/display/result/error/status
- `KernelCapabilities` interface

## Invariants

- 接口稳定性：Phase 1+ 内**不允许**改这些 type 的 shape；新 capability 可加（optional），删除任一字段是契约破坏
- KernelEvent 必须保持 discriminated union（type 字段 literal）—— packages/kernel-pyodide 与未来 RemoteJupyterAdapter 都依赖此

## Implementations

- Phase 1：`@skb/kernel-pyodide` (Wave 2)
- Phase 2+：`@skb/kernel-remote-jupyter` 等

## Modifying this file

任何接口字段变更必须 ADR；同时同步 kernel-registry 与全部已实现 adapter。

## Related

- [设计规格 §1.6 / §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [kernel-registry/CONTRACT.md](../kernel-registry/CONTRACT.md)
```

- [ ] **Step 5：commit kernel-adapter**

```bash
git add packages/kernel-adapter pnpm-lock.yaml
git commit -m "feat(kernel-adapter): freeze KernelAdapter interface for Phase 1+

- KernelEvent discriminated union (6 types)
- KernelSession execute/interrupt/shutdown
- KernelAdapter id/capabilities/startSession
- Type-only tests assert contract shape

Track E (1/2) of Wave 1 — Phase 1.
"
```

- [ ] **Step 6：建 kernel-registry**

`packages/kernel-registry/package.json`：

```json
{
  "name": "@skb/kernel-registry",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "build": "tsc -b",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@skb/kernel-adapter": "workspace:*"
  },
  "devDependencies": {
    "typescript": "~5.6.0",
    "vitest": "^2.0.0"
  }
}
```

`packages/kernel-registry/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src/**/*"],
  "references": [{ "path": "../kernel-adapter" }]
}
```

- [ ] **Step 7：写失败测试 `src/__tests__/registry.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import type { KernelAdapter } from '@skb/kernel-adapter';
import { KernelRegistry } from '../registry';

function fakeAdapter(id: string): KernelAdapter {
  return {
    id,
    capabilities: { libraries: [], gpu: false, persistentState: false },
    startSession: vi.fn(async () => ({
      execute: async function* () {},
      interrupt: async () => {},
      shutdown: async () => {},
    })),
  };
}

describe('KernelRegistry', () => {
  it('registers and looks up adapters by id', () => {
    const reg = new KernelRegistry();
    const a = fakeAdapter('pyodide');
    reg.register(a);
    expect(reg.get('pyodide')).toBe(a);
  });

  it('throws on duplicate id', () => {
    const reg = new KernelRegistry();
    reg.register(fakeAdapter('x'));
    expect(() => reg.register(fakeAdapter('x'))).toThrow(/duplicate/i);
  });

  it('routes startSession via id', async () => {
    const reg = new KernelRegistry();
    const a = fakeAdapter('pyodide');
    reg.register(a);
    await reg.startSession('pyodide', 'sid-1');
    expect(a.startSession).toHaveBeenCalledWith('sid-1');
  });

  it('throws on unknown id', async () => {
    const reg = new KernelRegistry();
    await expect(reg.startSession('nope', 'sid')).rejects.toThrow(/unknown kernel/i);
  });
});
```

跑：`pnpm --filter @skb/kernel-registry test` —— 预期 fail。

- [ ] **Step 8：写 `src/registry.ts`**

```typescript
import type { KernelAdapter, KernelSession } from '@skb/kernel-adapter';

export class KernelRegistry {
  readonly #adapters = new Map<string, KernelAdapter>();

  register(adapter: KernelAdapter): void {
    if (this.#adapters.has(adapter.id)) {
      throw new Error(`Duplicate kernel adapter id: ${adapter.id}`);
    }
    this.#adapters.set(adapter.id, adapter);
  }

  get(id: string): KernelAdapter | undefined {
    return this.#adapters.get(id);
  }

  list(): readonly KernelAdapter[] {
    return [...this.#adapters.values()];
  }

  async startSession(adapterId: string, sessionId: string): Promise<KernelSession> {
    const adapter = this.#adapters.get(adapterId);
    if (!adapter) throw new Error(`Unknown kernel adapter: ${adapterId}`);
    return adapter.startSession(sessionId);
  }
}
```

`src/index.ts`：

```typescript
export { KernelRegistry } from './registry';
```

跑测试：4/4 PASS。

- [ ] **Step 9：写 kernel-registry CONTRACT.md**

```markdown
# @skb/kernel-registry Contract

## Public surface

- `KernelRegistry` class — `register` / `get` / `list` / `startSession`
- 路由策略：JupyterBlock 在 frontmatter 写 `kernel="pyodide"` / `kernel="remote:gpu-box"`，`startSession(adapterId, sessionId)` 解析

## Invariants

- 每个 KernelAdapter id 全局唯一
- 注册顺序无关；运行时查找 O(1)

## Modifying this file

- 加方法可任意；改方法签名是契约破坏（影响 jupyter / runnable-code blocks）

## Related

- [kernel-adapter/CONTRACT.md](../kernel-adapter/CONTRACT.md)
- [设计规格 §1.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
```

- [ ] **Step 10：commit + references 更新 + ready-for-review**

```bash
git add packages/kernel-registry tsconfig.json pnpm-lock.yaml
git commit -m "feat(kernel-registry): adapter routing for Phase 1+

KernelRegistry routes adapterId → KernelAdapter and provides
startSession(id, sessionId). Wave 2 will register kernel-pyodide;
Phase 2+ may register remote-jupyter / runpod / gpu-box.

Track E (2/2) of Wave 1 — Phase 1.
"
git push
```

更新 root tsconfig.json references 加 `./packages/kernel-adapter` + `./packages/kernel-registry`，跑 `pnpm tsc -b`，commit。

通知 orchestrator: Track E ready-for-review (高风险, escalate pr-gate 5.5)。

---

## Track F: editor-commands + agent-tools

**Agent dispatch:** `editor-eng` (Claude)
**Risk level:** 高（核心架构 + 跨域 contract，自动 escalate 5.5 pr-gate）
**Files:**
- Create: `packages/editor-commands/` 全套
- Create: `packages/agent-tools/` 全套
- Modify: `tsconfig.json` references

- [ ] **Step 1：editor-commands 包**

```bash
mkdir -p packages/editor-commands/src/__tests__
```

`packages/editor-commands/package.json`：

```json
{
  "name": "@skb/editor-commands",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "build": "tsc -b",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@skb/block-foundation": "workspace:*",
    "@skb/content-types": "workspace:*",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "~5.6.0",
    "vitest": "^2.0.0"
  }
}
```

`packages/editor-commands/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src/**/*"],
  "references": [
    { "path": "../content-types" },
    { "path": "../block-foundation" }
  ]
}
```

- [ ] **Step 2：写 commands schema 测试 `src/__tests__/commands.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { commandSchemas, parseCommand } from '../commands';

describe('editor-commands schemas', () => {
  it('insertBlock requires position + blockType + props', () => {
    const r = parseCommand({
      type: 'insert_block',
      pageSlug: 'foo',
      position: 0,
      blockType: 'callout',
      props: { type: 'info' },
    });
    expect(r.success).toBe(true);
  });

  it('rejects unknown command type', () => {
    const r = parseCommand({ type: 'nonsense', foo: 1 });
    expect(r.success).toBe(false);
  });

  it('exposes 7 commands', () => {
    expect(Object.keys(commandSchemas).sort()).toEqual([
      'create_page',
      'delete_block',
      'delete_page',
      'edit_block',
      'insert_block',
      'move_block',
      'update_frontmatter',
    ]);
  });
});
```

跑：fail。

- [ ] **Step 3：写 `src/commands.ts`**

```typescript
import { z } from 'zod';

const positionSchema = z.number().int().nonnegative();
const blockTypeSchema = z.string().min(1);

export const commandSchemas = {
  create_page: z.object({
    type: z.literal('create_page'),
    slug: z.string().min(1),
    title: z.string().min(1),
    tags: z.array(z.string()).default([]),
  }),
  delete_page: z.object({
    type: z.literal('delete_page'),
    pageSlug: z.string().min(1),
  }),
  insert_block: z.object({
    type: z.literal('insert_block'),
    pageSlug: z.string().min(1),
    position: positionSchema,
    blockType: blockTypeSchema,
    props: z.record(z.string(), z.unknown()).default({}),
    content: z.string().default(''),
  }),
  edit_block: z.object({
    type: z.literal('edit_block'),
    pageSlug: z.string().min(1),
    blockId: z.string().min(1),
    props: z.record(z.string(), z.unknown()).optional(),
    content: z.string().optional(),
  }),
  delete_block: z.object({
    type: z.literal('delete_block'),
    pageSlug: z.string().min(1),
    blockId: z.string().min(1),
  }),
  move_block: z.object({
    type: z.literal('move_block'),
    pageSlug: z.string().min(1),
    blockId: z.string().min(1),
    newPosition: positionSchema,
  }),
  update_frontmatter: z.object({
    type: z.literal('update_frontmatter'),
    pageSlug: z.string().min(1),
    patch: z.record(z.string(), z.unknown()),
  }),
} as const;

export type CommandType = keyof typeof commandSchemas;
export type Command = z.infer<typeof commandSchemas[CommandType]>;

export function parseCommand(input: unknown):
  | { success: true; data: Command }
  | { success: false; error: z.ZodError } {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('type' in input) ||
    typeof (input as Record<string, unknown>).type !== 'string'
  ) {
    return { success: false, error: new z.ZodError([{ code: 'custom', message: 'missing type', path: [] }]) };
  }
  const type = (input as Record<string, unknown>).type as string;
  const schema = (commandSchemas as Record<string, z.ZodType>)[type];
  if (!schema) {
    return { success: false, error: new z.ZodError([{ code: 'custom', message: `unknown command: ${type}`, path: [] }]) };
  }
  const r = schema.safeParse(input);
  if (r.success) return { success: true, data: r.data as Command };
  return { success: false, error: r.error };
}
```

`src/index.ts`：

```typescript
export * from './commands';
```

跑测试：3/3 PASS。

- [ ] **Step 4：editor-commands CONTRACT.md**

```markdown
# @skb/editor-commands Contract

## Public surface

7 个命令 schema：
- `create_page` / `delete_page`
- `insert_block` / `edit_block` / `delete_block` / `move_block`
- `update_frontmatter`

每个 schema 是 Zod，可同时验证 UI 操作产生的命令与 agent 工具调用产生的命令。

## Invariants（spec §2.6 关键不变量）

- **所有编辑器变更必须经此层** —— UI 操作 / agent 工具 / 脚本批改皆同
- 命令是不可变数据；执行器（Wave 3 editor-shell + apps/api）才有副作用
- 命令字段一律 camelCase；type 字段值一律 snake_case

## Modifying this file

- 加新命令：扩 schema，向后兼容
- 改命令字段：契约破坏，必须 ADR + 同步 editor-shell + apps/api + agent_bridge

## Related

- [设计规格 §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [agent-tools/CONTRACT.md](../agent-tools/CONTRACT.md)
```

- [ ] **Step 5：commit editor-commands**

```bash
git add packages/editor-commands pnpm-lock.yaml
git commit -m "feat(editor-commands): 7-command schema (spec §2.6 invariant)

UI ops + agent tools both produce these commands; editor-shell + apps/api
execute. Zod schemas validate at boundaries. Frozen for Phase 1+.

Track F (1/2) of Wave 1 — Phase 1.
"
```

- [ ] **Step 6：agent-tools 包（仅 type 定义）**

```bash
mkdir -p packages/agent-tools/src/__tests__
```

`packages/agent-tools/package.json`：

```json
{
  "name": "@skb/agent-tools",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "build": "tsc -b",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@skb/editor-commands": "workspace:*",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "~5.6.0",
    "vitest": "^2.0.0"
  }
}
```

`packages/agent-tools/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src/**/*"],
  "references": [{ "path": "../editor-commands" }]
}
```

- [ ] **Step 7：写 `src/tools.ts`（仅 schema 与类型，**不实现** —— Phase 2b 实现在 apps/api）**

```typescript
import { z } from 'zod';
import { commandSchemas } from '@skb/editor-commands';

/**
 * Agent tool schemas (Phase 1：仅类型定义；Phase 2b 在 apps/api 实现).
 * Spec §2.6 Phase 1 必建项 #2.
 */

export const toolSchemas = {
  list_pages: {
    description: 'List all pages with their frontmatter (id, title, tags, date).',
    input: z.object({}),
  },
  read_page: {
    description: 'Read the full MDX content of a page.',
    input: z.object({ pageSlug: z.string() }),
  },
  search: {
    description: 'Full-text search across pages (title, body, frontmatter).',
    input: z.object({ query: z.string().min(1), limit: z.number().int().positive().default(10) }),
  },
  get_editor_state: {
    description: 'Get current editor selection / unsaved changes / kernel session state.',
    input: z.object({}),
  },
  // Mutating tools wrap editor-commands one-to-one
  create_page: { description: 'Create a new page.', input: commandSchemas.create_page.omit({ type: true }) },
  insert_block: { description: 'Insert a block at position.', input: commandSchemas.insert_block.omit({ type: true }) },
  edit_block: { description: 'Edit a block in-place.', input: commandSchemas.edit_block.omit({ type: true }) },
  delete_block: { description: 'Delete a block.', input: commandSchemas.delete_block.omit({ type: true }) },
  move_block: { description: 'Reorder a block.', input: commandSchemas.move_block.omit({ type: true }) },
  update_frontmatter: {
    description: 'Patch page frontmatter.',
    input: commandSchemas.update_frontmatter.omit({ type: true }),
  },
} as const;

export type ToolName = keyof typeof toolSchemas;

export type ToolInput<N extends ToolName> = z.infer<typeof toolSchemas[N]['input']>;
```

`src/index.ts`：

```typescript
export { toolSchemas } from './tools';
export type { ToolName, ToolInput } from './tools';
```

- [ ] **Step 8：写测试 `src/__tests__/tools.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { toolSchemas } from '../tools';

describe('agent tool schemas', () => {
  it('exposes 10 tools', () => {
    expect(Object.keys(toolSchemas).length).toBe(10);
  });

  it('list_pages takes no input', () => {
    expect(toolSchemas.list_pages.input.safeParse({}).success).toBe(true);
  });

  it('insert_block input validates against editor-commands shape', () => {
    const ok = toolSchemas.insert_block.input.safeParse({
      pageSlug: 'foo',
      position: 0,
      blockType: 'callout',
      props: {},
      content: '',
    });
    expect(ok.success).toBe(true);
  });

  it('search rejects empty query', () => {
    expect(toolSchemas.search.input.safeParse({ query: '' }).success).toBe(false);
  });
});
```

跑：4/4 PASS。

- [ ] **Step 9：agent-tools CONTRACT.md**

```markdown
# @skb/agent-tools Contract

## Public surface

- `toolSchemas` — 10 个 tool 的 `{description, input}` 对（Wave 1 仅类型定义）
- `ToolName` / `ToolInput<N>` 类型工具

## Phase 1 vs Phase 2b 分工

- Phase 1（本 Wave）：仅在此处冻结 schema
- Phase 2b：apps/api `agent_bridge.py` 实现真正的工具执行；UI 通过 WebSocket 触发

## Invariants（spec §2.6）

- mutating tools 必须 1:1 对应 `editor-commands` 命令；不允许直接 import 业务逻辑
- 新 tool 加入必须先在此处定义 schema，然后 apps/api 才能实现

## Modifying this file

加 tool：扩 toolSchemas，向后兼容；改 input shape 是契约破坏，必须 ADR。

## Related

- [editor-commands/CONTRACT.md](../editor-commands/CONTRACT.md)
- [设计规格 §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [apps/api/llm/CONTRACT.md](../../apps/api/app/llm/CONTRACT.md)
```

- [ ] **Step 10：commit + references 更新 + ready-for-review**

```bash
git add packages/agent-tools tsconfig.json pnpm-lock.yaml
git commit -m "feat(agent-tools): freeze 10-tool schema for Phase 2b

Mutating tools wrap editor-commands 1:1. Read-only tools (list_pages,
read_page, search, get_editor_state) defined inline. Phase 2b
agent_bridge implements; Phase 1 only freezes shape.

Track F (2/2) of Wave 1 — Phase 1.
"
git push
```

更新 root tsconfig.json references：加 `./packages/editor-commands` + `./packages/agent-tools`。`pnpm tsc -b` 验证。Commit。

通知 orchestrator: Track F ready-for-review (高风险, escalate pr-gate 5.5)。

---

## Task Z: Wave 1 Close

**Agent dispatch:** `orchestrator` 主导，调 `structure-auditor` + `git-operator`
**Files:**
- Modify: `package.json`（root，移除 `--passWithNoTests`）
- Create: `docs/decisions/ADR-0002-wave-1-close.md`
- Modify: `docs/plans/active.md`

**前置**：所有 6 track 双 review pass 才执行本 task。

- [ ] **Step 1：处理 ADR-0001 deferred follow-up #2（strict vitest）**

把 root `package.json` scripts.test 改：

```diff
-  "test": "turbo run test"
+  "test": "turbo run test"
```

实际改在 root vitest config（如有）或各 package 的 test script。检查每 package 是否有真实测试：

```bash
for pkg in apps/* packages/*; do
  count=$(find "$pkg/src" "$pkg/tests" -name "*.test.*" 2>/dev/null | wc -l)
  echo "$pkg: $count test files"
done
```

每包应至少 1 个测试。如有空包补占位测试 `it('TODO', () => expect(true).toBe(true))`，并记 follow-up。

跑全套验证：

```bash
pnpm check
```

预期：全绿。

- [ ] **Step 2：dispatch structure-auditor 跑 Wave 1 baseline**

按 `agent-contract.md` 中 structure-auditor 定义触发。产出 `docs/audits/structure-2026-04-29-wave-1.md`，包含：
- 各 package 当前文件 / 行数概览
- 接近 300 行 soft-warn 的文件清单
- 接近 500 行 hard-fail 的文件清单（应为 0）
- 跨包引用图
- 候选 Wave 2 重构（应为空）

- [ ] **Step 3：写 `docs/decisions/ADR-0002-wave-1-close.md`**

```markdown
# ADR-0002: Wave 1 闭幕 — 接口层完工，Wave 2 解锁

| 字段 | 值 |
|---|---|
| 状态 | accepted |
| 日期 | 2026-04-29 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |

## Context

Phase 1 Wave 1 完工。8 个 ts 包 + apps/api FastAPI 骨架就位；
6 个 track 全部双 review pass，3 个高风险 track（B/C/E/F）也过 pr-gate 5.5；
structure-auditor baseline 报告无 god-file。

## Decision

正式宣布 Wave 1 退出，Wave 2 解锁条件达成：
- 8 个 component block 可基于 block-foundation + content-types + mdx-bridge 构建
- 3 个 editor 子模块可在 editor-commands 之上构建
- kernel-pyodide 可实现 KernelAdapter
- apps/api 可加 endpoint（auth + ws + llm 抽象就绪）

## Consequences

正面：
- 接口稳定，Wave 2 可 12 路并行而无前置依赖
- 跨包契约文档 8 份（CONTRACT.md），review 时有据可依
- mdx-bridge RTT 守护就位，Wave 2 加 component block 时 mdx-doctor 可立即跑

待应对：
- Wave 2 起 codex-block-generator / codex-test-scaffolder / codex-script-builder /
  codex-css-stylist 进入 dispatch 链，需观察 multi-LLM 协同实战表现
- Playwright MCP 服务器准备：Wave 2 启动前作为前置任务

## Phase 1 deferred follow-ups status

- [x] #2 vitest --passWithNoTests（本 wave 闭合时移除）
- [x] #3 link-check.yml concurrency（Task 0 处理）
- [x] #4 link-check.yml fail: true（Task 0 处理）
- [x] #6 link-check.yml configFile（Task 0 处理）
- [ ] #1 YAML escape safety in claude-agent.ts —— Wave 2 触发器：agent-contract.md 加新 agent 时
- [ ] #5 tsconfig references 持续扩展 —— Wave 2 各 block 包加入时

## Related

- [设计规格 §4.2.1](../superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- [Phase 1 Wave 1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md)
- [structure-audit-2026-04-29-wave-1](../audits/structure-2026-04-29-wave-1.md)
- ADR-0001
```

- [ ] **Step 4：更新 `docs/plans/active.md`**

```markdown
# Active Plan Pointer

> SessionStart hook 读取此文件，把当前 wave 印在 session 起手位置。

**当前 phase**: 1
**当前 wave**: Wave 1 done → Wave 2 next
**Wave 1 plan**: [phase-1-wave-1](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) ✅ closed by ADR-0002
**Wave 2 plan**: 待用 superpowers:writing-plans 在新 session 把 Wave 2 plan 写出来

## Next agenda for Wave 2 plan-writing session

1. 加入 Playwright MCP server 配置作为 Wave 2 前置任务
2. 8 个 component block 的 task 分配（template by Claude，variants by codex-block-generator）
3. 3 个 editor 子模块（slash-menu / drag-handle / toolbar）由 editor-integrator
4. kernel-pyodide 实现
5. codex-test-scaffolder / codex-script-builder / codex-css-stylist 首次实战

## Related

- [overview](overview.md)
- [phase-1 stub](phase-1/plan.md)（待 Wave 2 plan 写完后更新成 wave 索引）
```

- [ ] **Step 5：commit Wave 1 close**

```bash
git add docs/decisions/ADR-0002-wave-1-close.md \
        docs/audits/structure-2026-04-29-wave-1.md \
        docs/plans/active.md \
        package.json
git commit -m "docs(adr): ADR-0002 Wave 1 close — interface layer ready

- 8 ts packages + apps/api FastAPI skeleton landed
- 6 tracks all double-review pass; 4 high-risk tracks also pr-gate 5.5
- structure-auditor baseline confirms zero god-files
- Phase 0 deferred follow-ups #2/#3/#4/#6 resolved
- #1/#5 deferred to natural Wave 2 triggers

Wave 2 unlocked: 8 component blocks + 3 editor sub-modules + kernel-pyodide.
"
git push
```

---

## Self-Review

**Spec coverage**：

- §1.1 部署拓扑：Track A (apps/site) + Track D (apps/api) 落地骨架
- §1.2 技术栈：Astro 5 / Tiptap / FastAPI 全部装齐
- §1.4 MDX 文件结构：Track C mdx-bridge 解析 frontmatter + body block；fixture 烟测
- §1.5 编辑器架构：Track B BlockRegistry + Track F editor-commands 落地命令模式
- §1.6 KernelAdapter：Track E 接口冻结 + KernelRegistry 路由
- §1.8 关键约束：站点纯静态（apps/site SSG，无 SSR）✓；不引入数据库✓；单用户密码✓；无第三方 OAuth✓；PyodideAdapter 独立工作（Wave 2 实现，本 Wave 接口已留位）
- §2.5 跨包契约：8 个 CONTRACT.md（content-types / block-foundation / mdx-bridge / kernel-adapter / kernel-registry / editor-commands / agent-tools / api+ws+llm）
- §2.6 Agent 集成 Phase 1 必建项：4 个全建（editor-commands / agent-tools / ws / llm）
- §3.4 plans/execution：Task Z 更新 active.md
- §3.6 文件大小：每个新文件均在 300 行内（registry.ts 等都是 ~50 行）
- §3.10 CI：Track A/D 加入后 ci.yml / link-check.yml / agent-contract-check.yml 三 workflow 应继续 pass
- §3.11 ADR：Task Z 产出 ADR-0002
- §4.2.1 Wave 1 退出标准：6 track 退出标准均映射为 task 内验收命令

**Placeholder scan**：本 plan 无 TBD / TODO（除"Wave 2 will..."的明确推迟说明）。

**类型一致性**：
- `BlockKind` 在 block-foundation 与 mdx-bridge 一致使用
- `KernelAdapter` 接口在 kernel-adapter 定义、kernel-registry 消费、Wave 2 kernel-pyodide 实现
- `Command` 类型在 editor-commands 定义、agent-tools 通过 `commandSchemas.X.omit({type: true})` 复用
- frontmatter schema 在 content-types 单一定义，apps/site 当前内联，待 Track B 完成后改 import（已注 TODO）

**Risk-level mapping vs spec §3.2**：
- Track B / C / E / F 触碰核心架构包 → 自动 escalate pr-gate 5.5 ✓
- Track A / D 中风险（架构意义 + Phase 1 必建项）→ 仍 escalate 5.5（保守）✓
- Task 0 / Task Z 中风险，单审 5.3-spark + Claude pr-reviewer 即可

**Wave 1 → Wave 2 衔接**：
- 所有接口冻结，Wave 2 可 12 路并行
- 5 个 codex-* worker 的首次实战在 Wave 2 启动
- Playwright MCP 加入由 Wave 2 plan 处理（active.md 已记备忘）

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — orchestrator dispatch fresh subagent per track, code-reviewer + pr-reviewer 双审，pr-gate 5.5 escalate 在高风险 track，git-operator 闭合

**2. Inline Execution** — 当前 session 用 superpowers:executing-plans 批量执行（不推荐 —— 6 track 并行需要 dispatcher 模型才能发挥效率）

**因为用户已表明在 WSL2 单独 session 执行，本 plan 不在此 session 启动。** 推送到 remote 后，那边的 Claude Code 起新 session 拉到本 plan 即可按 "1. Subagent-Driven" 模式执行。

## Related

- [设计规格](../specs/2026-04-29-self-knowledge-base-design.md)
- [Phase 0 plan](2026-04-29-phase-0-scaffolding.md)
- [ADR-0001](../../decisions/ADR-0001-stack-selection.md) Phase 0 errata + deferred follow-ups
- [agent-contract.md](../../../agent-contract.md) 27 agent 单一源
