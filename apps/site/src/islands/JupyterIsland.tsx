import type { ReactElement } from 'react';
import { heavyBoundaryDimensions as jupyterDims } from '@skb/block-jupyter/ui-default/heavy-boundary-dimensions';
import type { FlatProps } from '../lib/mdx-adapter';

function JupyterPlaceholder({
  dims,
}: {
  readonly dims: typeof jupyterDims;
}): ReactElement {
  return (
    <div
      role="status"
      data-block="jupyter"
      aria-busy="false"
      data-loaded="true"
      className="heavy-block-skeleton heavy-block-skeleton--jupyter heavy-block-skeleton--placeholder"
      style={{ width: dims.width, minHeight: dims.height }}
    >
      <span aria-hidden="true" className="heavy-block-placeholder__icon">
        🔌
      </span>
      <span className="heavy-block-placeholder__label">
        Jupyter · plugin runtime (Phase 2+)
      </span>
    </div>
  );
}

export default function JupyterIsland(_props: FlatProps): ReactElement {
  return <JupyterPlaceholder dims={jupyterDims} />;
}
