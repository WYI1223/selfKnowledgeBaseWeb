import type {
  ArrayExpression,
  Expression,
  ObjectExpression,
  Program,
  Property,
  TemplateLiteral,
  UnaryExpression,
} from 'estree';

/**
 * Wave 6 carry-forward #16 (2026-05-08) — shape of an `mdxJsxAttribute`
 * `value` field as emitted by `remark-mdx` / `mdast-util-mdx-jsx`. Three
 * forms:
 *
 *   - `string`  → `<X foo="bar">` (string-literal attribute)
 *   - `null`    → `<X foo>` (boolean shorthand)
 *   - `MdxJsxAttributeValueExpression` → `<X foo={...}>` (JSX expression).
 *     The expression source text is on `value`; the parsed estree AST is
 *     on `data.estree`. `evalAttrExpression` walks the estree.
 *
 * Wave 2 block stubs declared the value as `string | null` and threw
 * when handed an expression. The Wave 2 stubs deferred expression-attr
 * support to "Wave 3 mdx-bridge expression-attr upgrade" but that
 * upgrade was never delivered — sample-blocks fixtures using
 * expression form (`page={1}`, `libraries={["x"]}`, `layers={[{...}]}`,
 * etc.) tripped the per-block parse functions and surfaced as
 * `[unsupported block <X>: ...]` placeholders in the editor under
 * Wave 6 hotfix softParse fault tolerance.
 */
export interface MdxJsxAttributeValueExpression {
  readonly type: 'mdxJsxAttributeValueExpression';
  readonly value: string;
  readonly data?: { readonly estree?: Program };
}

export type MdastJsxAttributeValue = string | null | MdxJsxAttributeValueExpression;

/**
 * Extract a static JS value from an `mdxJsxAttribute`'s value. Returns:
 *
 *   - `string` for `<X foo="bar">` (passes through)
 *   - `null` for `<X foo>` (boolean shorthand; passes through)
 *   - the literal JS value for `<X foo={...}>` after walking the
 *     attached estree AST. Supported expression node types:
 *       - `Literal` — number / string / boolean / null
 *       - `TemplateLiteral` (no interpolations) — joined `quasi.value.cooked`
 *       - `ArrayExpression` — recursive walk
 *       - `ObjectExpression` — recursive walk; keys are `Identifier.name`
 *         or `Literal` (string/number)
 *       - `UnaryExpression` operator `+` / `-` on a numeric `Literal`
 *       - `Identifier` named `undefined` / `NaN` / `Infinity`
 *
 * Throws on every other expression kind (`CallExpression`,
 * `BinaryExpression`, dynamic identifiers, template interpolations,
 * sparse arrays, computed object keys, getters/setters, spread, etc.).
 * Per-block parse functions catch the throw and surface it via
 * `mdx-bridge` softParse's `[unsupported block <X>: <reason>]`
 * placeholder.
 */
export function evalAttrExpression(value: MdastJsxAttributeValue): unknown {
  if (value === null || typeof value === 'string') return value;
  const estree = value.data?.estree;
  if (!estree) {
    throw new Error(
      `evalAttrExpression: expression has no estree AST attached; raw source: ${value.value}`,
    );
  }
  if (estree.body.length !== 1) {
    throw new Error(
      `evalAttrExpression: expected a single ExpressionStatement, got ${estree.body.length} body nodes`,
    );
  }
  const stmt = estree.body[0];
  if (stmt?.type !== 'ExpressionStatement') {
    throw new Error(
      `evalAttrExpression: expected an ExpressionStatement, got ${stmt?.type ?? 'undefined'}`,
    );
  }
  return walkExpression(stmt.expression);
}

function walkExpression(node: Expression): unknown {
  switch (node.type) {
    case 'Literal':
      return walkLiteral(node);
    case 'TemplateLiteral':
      return walkTemplateLiteral(node);
    case 'ArrayExpression':
      return walkArrayExpression(node);
    case 'ObjectExpression':
      return walkObjectExpression(node);
    case 'UnaryExpression':
      return walkUnaryExpression(node);
    case 'Identifier':
      if (node.name === 'undefined') return undefined;
      if (node.name === 'NaN') return NaN;
      if (node.name === 'Infinity') return Infinity;
      throw new Error(
        `evalAttrExpression: identifier "${node.name}" cannot be statically evaluated`,
      );
    default:
      throw new Error(`evalAttrExpression: unsupported expression type: ${node.type}`);
  }
}

function walkLiteral(node: Extract<Expression, { type: 'Literal' }>): string | number | boolean | null {
  // RegExpLiteral: estree marks via `regex` field on the literal; reject — we
  // only promise primitive literals.
  if ('regex' in node && node.regex) {
    throw new Error('evalAttrExpression: RegExp literals are not supported');
  }
  // BigIntLiteral: estree marks via `bigint` field; reject for the same reason.
  if ('bigint' in node && (node as { bigint?: unknown }).bigint !== undefined) {
    throw new Error('evalAttrExpression: BigInt literals are not supported');
  }
  const value = node.value;
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  throw new Error(`evalAttrExpression: unsupported literal value type: ${typeof value}`);
}

function walkTemplateLiteral(node: TemplateLiteral): string {
  if (node.expressions.length > 0) {
    throw new Error(
      'evalAttrExpression: template literal with interpolations is not statically evaluable',
    );
  }
  return node.quasis.map((q) => q.value.cooked ?? q.value.raw).join('');
}

function walkArrayExpression(node: ArrayExpression): unknown[] {
  return node.elements.map((el) => {
    if (el === null) {
      throw new Error('evalAttrExpression: sparse array elements are not supported');
    }
    if (el.type === 'SpreadElement') {
      throw new Error('evalAttrExpression: spread elements in arrays are not supported');
    }
    return walkExpression(el);
  });
}

function walkObjectExpression(node: ObjectExpression): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const prop of node.properties) {
    if (prop.type !== 'Property') {
      throw new Error(`evalAttrExpression: unsupported object property type: ${prop.type}`);
    }
    obj[propertyKey(prop)] = walkExpression(prop.value as Expression);
  }
  return obj;
}

function propertyKey(prop: Property): string {
  if (prop.kind !== 'init') {
    throw new Error(`evalAttrExpression: unsupported object property kind: ${prop.kind}`);
  }
  if (prop.computed) {
    throw new Error('evalAttrExpression: computed object keys are not supported');
  }
  if (prop.key.type === 'Identifier') return prop.key.name;
  if (
    prop.key.type === 'Literal' &&
    (typeof prop.key.value === 'string' || typeof prop.key.value === 'number')
  ) {
    return String(prop.key.value);
  }
  throw new Error(`evalAttrExpression: unsupported object key type: ${prop.key.type}`);
}

function walkUnaryExpression(node: UnaryExpression): unknown {
  if (!node.prefix) {
    throw new Error('evalAttrExpression: postfix unary expressions are not supported');
  }
  if (node.operator === '-' || node.operator === '+') {
    const inner = walkExpression(node.argument);
    if (typeof inner !== 'number') {
      throw new Error(
        `evalAttrExpression: unary ${node.operator} requires a numeric operand, got ${typeof inner}`,
      );
    }
    return node.operator === '-' ? -inner : inner;
  }
  throw new Error(`evalAttrExpression: unsupported unary operator ${node.operator}`);
}
