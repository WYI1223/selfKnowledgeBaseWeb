import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import type { ComponentType } from 'react';
import type {
  BlockGridKind,
  BlockGridPosition,
  RowSpanSemantic,
} from './types';

export type BlockKind = 'prose' | 'component' | 'render' | 'viz';

/**
 * BlockCore：headless 层 —— 无 React 依赖，纯逻辑（props schema + MDX 序列化在
 * mdx-bridge 处理）。Core 可被 Adopter 复用并配自定义 UI。
 */
export interface BlockCoreDefinition<TSchema extends ZodTypeAny = ZodTypeAny> {
  /** kebab-case identifier，全局唯一 */
  readonly name: string;
  readonly kind: BlockKind;
  readonly propsSchema: TSchema;
  /** MDX 中实际使用的 PascalCase 组件名，例如 "Callout" / "JupyterBlock" */
  readonly mdxComponent: string;
}

export interface BlockViewProps<TSchema extends ZodTypeAny> {
  readonly props: ZodInfer<TSchema>;
  readonly content?: string;
  /** Wave 2 起追加 runtime context（kernel session / theme / etc.） */
}

/**
 * BlockUI：presentational 层 —— React 组件，绑定到已注册的 core。
 * 同一 core 可挂多个 UI（uiId 区分），Adopter 可写自己的 UI 替代 ui-default。
 */
export interface BlockUIDefinition<TSchema extends ZodTypeAny = ZodTypeAny> {
  /** 必须指向已 registerCore 的 core */
  readonly coreName: string;
  /** UI 实现 id：'default' / 'minimal' / 用户自定义 */
  readonly uiId: string;
  readonly EditorView: ComponentType<BlockViewProps<TSchema>>;
  readonly RenderView: ComponentType<BlockViewProps<TSchema>>;
  /**
   * ADR-0016 D2/D10 grid default. No block-foundation runtime default;
   * editor-shell/mdx-bridge consumers may override on block insertion.
   */
  readonly gridDefault?: BlockGridPosition;
  /**
   * ADR-0016 D3/D10 row-span semantics. Default is 'integer' for backward
   * compatibility when omitted.
   */
  readonly rowSpanSemantic?: RowSpanSemantic;
  /**
   * ADR-0016 D10 grid serialize/parse kind. Default mirrors BlockKind;
   * runtime mirror wiring is deferred to C.2-4.
   */
  readonly gridKind?: BlockGridKind;
}

export function defineCore<T extends ZodTypeAny>(
  def: BlockCoreDefinition<T>,
): BlockCoreDefinition<T> {
  return def;
}

export function defineUI<T extends ZodTypeAny>(
  def: BlockUIDefinition<T>,
): BlockUIDefinition<T> {
  return def;
}

/**
 * BlockRegistry：双层注册表（ADR-0003）。
 * registerCore：挂业务定义；registerUI：挂视觉实现。
 * 同 core 多 UI 场景：getUI(name) 不带 uiId 时取首个注册的（约定为 'default'）。
 */
export class BlockRegistry {
  readonly #cores = new Map<string, BlockCoreDefinition>();
  readonly #uis = new Map<string, BlockUIDefinition[]>();

  registerCore(core: BlockCoreDefinition): void {
    if (this.#cores.has(core.name)) {
      throw new Error(`Duplicate core name: ${core.name}`);
    }
    this.#cores.set(core.name, core);
  }

  registerUI(ui: BlockUIDefinition): void {
    if (!this.#cores.has(ui.coreName)) {
      throw new Error(`Unknown core for UI registration: ${ui.coreName}`);
    }
    const existing = this.#uis.get(ui.coreName) ?? [];
    if (existing.some((u) => u.uiId === ui.uiId)) {
      throw new Error(
        `Duplicate UI registration: core=${ui.coreName} uiId=${ui.uiId}`,
      );
    }
    existing.push(ui);
    this.#uis.set(ui.coreName, existing);
  }

  getCore(name: string): BlockCoreDefinition | undefined {
    return this.#cores.get(name);
  }

  listCores(): readonly BlockCoreDefinition[] {
    return [...this.#cores.values()];
  }

  /** 不传 uiId 时返回首个（约定为 'default'）；传了精确匹配 */
  getUI(coreName: string, uiId?: string): BlockUIDefinition | undefined {
    const list = this.#uis.get(coreName);
    if (!list || list.length === 0) return undefined;
    if (uiId === undefined) return list[0];
    return list.find((u) => u.uiId === uiId);
  }

  listUIs(coreName: string): readonly BlockUIDefinition[] {
    return [...(this.#uis.get(coreName) ?? [])];
  }
}
