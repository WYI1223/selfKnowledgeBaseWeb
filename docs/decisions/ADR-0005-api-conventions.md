# ADR-0005: REST API conventions

| 字段 | 值 |
|---|---|
| 状态 | accepted |
| 日期 | 2026-04-29 |
| 作者 | orchestrator (Claude Opus 4.7 1M ctx) |
| 触发 | 用户提问"有没有规定写 RESTful API"；Track D 即将启动需要预先定约定 |
| 替代 | 不替代任何 ADR；扩展 ADR-0001 §1.2 / spec §2.5 |

## Context

Wave 1 Track D 即将实现 `apps/api` 的 4 类端点（auth / pages CRUD / ws / llm 抽象）。原 plan code 样例风格不统一：

- 端点路径无版本前缀（`/auth/login` 而非 `/v1/auth/login`）
- 资源名用 "files" 偏文件系统视角，不够语义化
- `write_file` 返回裸 `dict[str, str]` 缺 `response_model`
- 字段直接 snake_case 出 JSON（与 TS 客户端不友好，OpenAPI → TS 派生后有命名负担）
- 错误格式 ad-hoc（裸 `HTTPException(detail="...")`）
- 状态码语义不全（201 / 204 / 422 / 409 没明确说哪类用例触发）

api-builder 在 Wave 1 + 未来 codex-api-crud-builder 协同（Wave 2 起）会让风格漂移加剧。开源（ADR-0003）目标进一步要求外部使用者拿到稳定 / 文档化的 API。

## Decision

新增 `apps/api/CONVENTIONS.md` 作为**约束契约文档**。10 条核心约定：

1. **版本前缀** `/v1/*`（含 WS 端点 `/v1/ws/`）
2. **资源化命名**：复数名词 + kebab-case 多词；嵌套表层级
3. **HTTP 方法语义**：PUT 兼任 create + replace；不用 PATCH（YAGNI）
4. **状态码语义全面化**：201 + Location header / 204 / 422 / 7807 错误
5. **JSON 字段命名 camelCase**：Pydantic `alias_generator=to_camel + populate_by_name=True`
6. **错误 RFC 7807 Problem Details lite**：`{type, title, detail, status, instance?, errors?}`
7. **ISO 8601 UTC 时间戳**（`Z` 后缀）
8. **WS 单点 `/v1/ws/`** + JSON `type`-tagged messages（细节 ws/CONTRACT.md）
9. **api-client 由 OpenAPI 自动生成**，只读
10. **Phase 1/2 不维护严格向后兼容**；重大变化经 ADR + `/v2` 双跑

## Consequences

### 正面

- **多 agent 协作风格统一**：api-builder + codex-api-crud-builder + 未来 Phase 2b agent_bridge 都依据同一份 CONVENTIONS.md，PR review 时违背能被快速识别
- **TS 客户端 camelCase 直接可用**：前端无需手写 case 转换层
- **错误格式统一**：客户端错误处理代码 DRY，`switch (error.type)` 即可分发
- **开源就绪**（ADR-0003 D7 配套）：约定明确，外部使用者文档化路径清晰
- **OpenAPI / TS codegen 流水线干净**：Pydantic schema → OpenAPI → TS interface 字段名一致，无后期修补

### 待应对

- **Wave 1 Track D code 样例需随之改动**（plan 已配套更新；api-builder 起手必读 CONVENTIONS.md）
- **Phase 0 erratum 候选**：原 plan code 用 snake_case + 无 /v1 前缀；这是 plan 原稿的 implicit 风格，并非 Phase 0 实操错；记入 Track D 实操时按 CONVENTIONS.md 修正即可
- **路径限制收紧**：slug 只允许 `[a-z0-9-]`，asset filename 只允许已知扩展名 —— Track D 实现 `_safe_slug` / `_safe_asset_name` helpers
- **错误 handler 全局注册**：Track D Step 8 main.py 加 `app.add_exception_handler(...)` × 3（HTTPException / RequestValidationError / SkbError）

## 影响 plan / spec

| 文档 | 改动 |
|---|---|
| [Wave 1 plan](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) Track D | 新增 Step 0「读 CONVENTIONS.md」；Step 4 schemas 用 camelCase alias；Step 8 router prefix `/v1/auth`；Step 9 files.py → pages.py + `/v1/pages`；Step 14 CONTRACT.md reference CONVENTIONS.md |
| [设计规格](../superpowers/specs/2026-04-29-self-knowledge-base-design.md) decision log | 加 ADR-0005 条目 |
| [apps/api/CONVENTIONS.md](../../apps/api/CONVENTIONS.md) | **新建** |
| [decisions/README.md](README.md) | ADR 索引 +0005 |

## 不选某些常见替代的理由

- **不用 JSON:API 的 `{data, included, meta}` envelope**：太重；单用户场景资源不需要 hypermedia 关联
- **不用 GraphQL**：YAGNI；REST 足够覆盖 page CRUD + agent_bridge；GraphQL 引入额外 schema 维护
- **不用 PATCH 局部更新**：page 写入是全文替换语义（用户编辑器提交完整 MDX）；PATCH 仅 frontmatter 部分修改有用，等用例出现再加
- **不用 OAuth 2.0**：单用户场景过度设计；spec §1.8 已锁定密码 + JWT
- **不用 base64 嵌 binary**：资产上传更适合 multipart；Phase 1 暂不实施

## Related

- [apps/api/CONVENTIONS.md](../../apps/api/CONVENTIONS.md) —— 实操约束
- [ADR-0001](ADR-0001-stack-selection.md) §1.2 技术栈
- [ADR-0003](ADR-0003-headless-presentational-split.md) 开源就绪 (D7 推迟 npm 发布)
- [ADR-0004](ADR-0004-agent-team-dispatch-model.md) team dispatch
- [Wave 1 plan Track D](../superpowers/plans/2026-04-29-phase-1-wave-1-foundation.md) 实施
