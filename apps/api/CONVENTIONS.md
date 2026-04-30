# apps/api REST API Conventions

> 本项目所有 HTTP 端点遵循以下约定。新加端点必须 conform；改动既有端点的形状是契约破坏，必须 ADR。
> 由 [ADR-0005](../../docs/decisions/ADR-0005-api-conventions.md) ratify。

## 1. URL 结构

### 版本前缀

所有端点以 `/v1` 开头：`POST /v1/auth/login`、`GET /v1/pages/{slug}`、`WS /v1/ws/`。
将来破坏性变更走 `/v2`（与 `/v1` 共存一段时间），不直接覆盖 `/v1`。

### 资源命名

- 复数名词：`/v1/pages` · `/v1/assets` · `/v1/agent-sessions`
- kebab-case 多词：`/v1/agent-sessions`，不是 `agentSessions` 也不是 `agent_sessions`
- 嵌套表层级：`/v1/pages/{slug}/assets/{filename}`
- 操作 verb 不进 URL（用 HTTP method 表达）。**例外**：明显非 CRUD 的 RPC 风格端点用动词路径（如 `POST /v1/auth/login`）

### 路径参数

- 路径段必须经 URL encoding（FastAPI 默认）
- `slug` 限定字符 `[a-z0-9-]`，禁止 `..` 或 `/`（防 traversal）
- asset filename 限定已知扩展名：`.ipynb` `.pdf` `.png` `.jpg` `.jpeg` `.svg` `.gif` `.webp`

## 2. HTTP 方法

| 方法 | 语义 | 幂等 | 用法示例 |
|---|---|---|---|
| `GET` | 读取，无副作用 | ✓ | `GET /v1/pages` 列表；`GET /v1/pages/{slug}` 详情 |
| `POST` | 创建新资源 / 非幂等动作 | ✗ | `POST /v1/auth/login` 登录 |
| `PUT` | 全量替换；幂等（含创建） | ✓ | `PUT /v1/pages/{slug}` 完整内容写入（创建或替换） |
| `PATCH` | 局部更新；**Phase 1 暂不使用** | ✗ | YAGNI；将来 frontmatter 部分修改可能引入 |
| `DELETE` | 删除；幂等 | ✓ | `DELETE /v1/pages/{slug}` |

约定：用 `PUT` 同时覆盖"创建"与"完整替换"两个语义（page slug 由 client 选定，无需服务端生成 id）。状态码区分新建 vs 更新（见 §3）。

## 3. 状态码语义

| Code | 何时用 |
|---|---|
| `200 OK` | 读取成功 / 已存在的资源被 PUT 更新 |
| `201 Created` | PUT 创建了之前不存在的资源；**必须**返回 `Location: /v1/pages/{slug}` header |
| `204 No Content` | DELETE 成功，body 为空 |
| `400 Bad Request` | 请求体无法解析（JSON 错误等） |
| `401 Unauthorized` | 缺少 token / token 无效 / 已过期 |
| `403 Forbidden` | token 有效但操作无权限（单用户暂未用） |
| `404 Not Found` | 资源不存在 |
| `409 Conflict` | 操作冲突（暂未用例；如未来加 ETag 乐观锁） |
| `422 Unprocessable Entity` | Pydantic validation 错（FastAPI 默认抛此） |
| `500 Internal Server Error` | 服务端 bug；只 log，不暴露栈 |

## 4. 请求 / 响应 body

### JSON 字段命名：camelCase

请求与响应 JSON 体一律 **camelCase**。Pydantic 用 alias 转换：

```python
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class PageReadResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,  # 接受 snake_case 输入也能解析（容错）
    )
    slug: str
    content: str
    last_modified: datetime  # JSON 输出 lastModified
```

理由：
- TypeScript 客户端（自动从 OpenAPI 生成）期望 camelCase；JS 生态约定
- Python 内部仍 snake_case（PEP 8）；alias_generator 自动桥接
- `populate_by_name=True` 让客户端发 snake 或 camel 都被接受（鲁棒性）

### 时间戳

- ISO 8601 UTC，例：`2026-04-29T20:35:12.345Z`（注意末尾 `Z`）
- Pydantic `datetime` 默认输出此格式
- **服务端永远 UTC 存储与返回**；时区转换由客户端处理

### 数字 / 布尔

- 显式 JSON `true` / `false`；不接受 `"true"` / `"false"` 字符串（Pydantic 默认行为）
- ID 类字段（如未来用 UUID）一律字符串

### 二进制内容

- **不**在 JSON 体里嵌 base64（YAGNI）
- 资产上传走 `multipart/form-data` 或 `application/octet-stream`（Wave 2+ 实施时定）

## 5. 错误响应：RFC 7807 Problem Details lite

所有 4xx / 5xx 响应 body 形如：

```json
{
  "type": "https://skb.local/errors/page-not-found",
  "title": "Page not found",
  "detail": "Page 'transformer-attention' does not exist",
  "status": 404
}
```

字段：

- `type` — URI 标识错误类别（用 `skb.local` 域作纯标识，无需联通）
  - 常用值：
    - `https://skb.local/errors/auth-failed`
    - `https://skb.local/errors/auth-token-expired`
    - `https://skb.local/errors/auth-token-invalid`
    - `https://skb.local/errors/auth-token-missing`
    - `https://skb.local/errors/page-not-found`
    - `https://skb.local/errors/path-traversal-blocked`
    - `https://skb.local/errors/validation-error`
    - `https://skb.local/errors/not-found`
    - `https://skb.local/errors/method-not-allowed`
    - `https://skb.local/errors/http-error` (fallback for other framework HTTPException status codes)
    - `https://skb.local/errors/internal-error`
- `title` — 人类可读简短分类（不暴露栈）
- `detail` — 具体出错描述（业务级信息，不含敏感数据）
- `status` — HTTP 状态码（重复，便于客户端 dispatch）

可选字段：

- `instance` — 出错请求的 URL
- `errors` — Pydantic validation 时的字段级错误数组（422 专用）

实现：FastAPI 注册全局 exception handler 捕获 `HTTPException` + `RequestValidationError` + 自定义 `SkbError` + bare `Exception`，统一渲染成 Problem Details JSON。

> **Pitfall**: register the HTTPException handler against `starlette.exceptions.HTTPException`, **not** `fastapi.HTTPException`. The framework router raises 404 / 405 from the Starlette base class; registering only against the FastAPI subclass silently misses those. `fastapi.HTTPException` is a subclass of the Starlette one, so registering against the base catches both. Also remember to forward `exc.headers` into the JSONResponse so 401 keeps `WWW-Authenticate: Bearer` (RFC 7235 §3.1) and 405 keeps `Allow: ...` (RFC 7231 §7.4.1). And register a catch-all `Exception` handler too, otherwise unhandled bug-class exceptions return raw plain-text `Internal Server Error` instead of RFC 7807.

> **Pitfall (continued)**: WWW-Authenticate / Allow / similar framework-mandated 4xx headers apply to **every** response path emitting that status code, not just the framework-raised path. Custom error handlers (e.g. `SkbError → skb_error_handler`) MUST emit the same mandated headers. Test EVERY 401 path (framework-raised AND custom-error-raised: `auth-failed`, `auth-token-invalid`, `auth-token-expired`, `auth-token-missing`) emits `WWW-Authenticate: Bearer`. Test EVERY 405 path emits `Allow: ...`. RFC 7235 §3.1 + RFC 7231 §7.4.1 are unconditional.

```python
# app/errors.py 示例
from fastapi import Request
from fastapi.responses import JSONResponse


class SkbError(Exception):
    status_code: int = 500
    error_type: str = "https://skb.local/errors/internal-error"
    title: str = "Internal error"

    def __init__(self, detail: str = "") -> None:
        self.detail = detail


async def skb_error_handler(request: Request, exc: SkbError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": exc.error_type,
            "title": exc.title,
            "detail": exc.detail,
            "status": exc.status_code,
            "instance": str(request.url),
        },
    )
```

## 6. 认证

- **POST `/v1/auth/login`** 接 `{username, password}`，返回 `{accessToken, tokenType: "bearer"}`
- 后续请求 `Authorization: Bearer <token>` header
- token TTL 12 小时（spec §1.2）；过期返回 401 + `type=auth-token-expired`
- **不刷新 token**：过期重新登录（YAGNI；单用户场景）
- 不存在 OAuth flow / refresh token / multi-session（参 spec §1.8 关键约束 #2）

## 7. 分页（暂未实施，预留约定）

- cursor-based：`GET /v1/pages?cursor=<opaque>&limit=20`
- 响应含 `meta.nextCursor`（`null` 表示无更多）
- 不用 offset-based（避免大列表分页 inconsistency）
- Phase 1 单用户、笔记数量小，不实施分页；超过 ~200 篇笔记或 Phase 3+ 引入再加

## 8. WebSocket

- 单一端点 `WS /v1/ws/`
- 协议：JSON 消息，每条含 `type` 字段
- 详细 wire format 见 `apps/api/app/ws/CONTRACT.md`（Track D Step 15 创建后查阅）
- Phase 2b 加 agent_bridge 后协议扩展；`type` 字段约定不变

## 9. 类型同步

- Pydantic 模型定义在 `apps/api/app/schemas.py`（**单一源**）
- CI 跑 `openapi-typescript` 从 OpenAPI spec（FastAPI `/openapi.json` 自动生成）派生 `packages/api-client/src/index.ts`
- **api-client 是只读生成产物**；改 TS 类型必须先改 Pydantic 模型再 regenerate
- 工具：[openapi-typescript](https://openapi-ts.dev) 命令行；CI workflow 步骤名 `codegen`

## 10. Migrations / 向后兼容性

Phase 1 / 2 假定单用户、自部署，**不维护严格向后兼容**。重大形状变化经：

1. 写一份新 ADR 描述变化与影响
2. 启用 `/v2/...` 端点；`/v1` 短期保留并标 `Deprecation` header
3. 一个 ADR 周期后下线 `/v1`

Phase 3 开源后才考虑严格 SemVer（详见 ADR-0003 D7）。

## Related

- [ADR-0005](../../docs/decisions/ADR-0005-api-conventions.md) — ratify 本约定
- [ADR-0001](../../docs/decisions/ADR-0001-stack-selection.md) — Phase 0 + Phase 1 架构基础
- [ADR-0003](../../docs/decisions/ADR-0003-headless-presentational-split.md) — 开源就绪
- [设计规格 §1.2 / §2.5 / §2.6](../../docs/superpowers/specs/2026-04-29-self-knowledge-base-design.md)
- `apps/api/CONTRACT.md` — 当前 endpoint 列表（**Track D Step 14 创建**，本文件 commit 时尚不存在）
- `apps/api/app/ws/CONTRACT.md` — WS 协议（**Track D Step 15 创建**，同上）
