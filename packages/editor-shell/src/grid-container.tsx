import type { CSSProperties, ReactNode } from 'react';

/**
 * Editor-side grid wrapper for Wave 5.
 *
 * ADR-0016 D5 / D8 / D9 / D11 keep Tiptap content inside and the grid
 * container outside: this component only emits the `.skb-grid` host
 * element and forwards caller-owned children. The CSS selector authority
 * remains `apps/site/src/styles/grid.css`; editor-shell consumers import
 * that stylesheet at the mount site, mirroring the SSR phase.
 *
 * NodeView attr validation and the Wave 5 plan v1.1 row C.2-3.5
 * hard-throw flip are orthogonal to this passive React wrapper.
 */
export interface GridContainerProps {
  /** EditorContent or any other React children to place inside the grid. */
  children?: ReactNode;
  /** Optional consumer class appended after the required `skb-grid` class. */
  className?: string;
  /** Optional CSS variable overrides such as `--row-h`, `--gap`, or `--total-cols`. */
  style?: CSSProperties;
}

export function GridContainer(props: GridContainerProps) {
  const { children, className, style } = props;
  const gridClassName = className ? `skb-grid ${className}` : 'skb-grid';

  return (
    <div className={gridClassName} style={style}>
      {children}
    </div>
  );
}
