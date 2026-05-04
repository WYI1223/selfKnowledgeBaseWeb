import type { ReactElement } from 'react';
import { heavyBoundaryDimensions as nnVizDims } from '@skb/block-nn-viz/ui-default/heavy-boundary-dimensions';
import type { FlatProps } from '../lib/mdx-adapter';

function NnVizPlaceholder({
  dims,
}: {
  readonly dims: typeof nnVizDims;
}): ReactElement {
  return (
    <div
      role="status"
      data-block="nn-viz"
      aria-busy="false"
      data-loaded="true"
      className="heavy-block-skeleton heavy-block-skeleton--nn-viz heavy-block-skeleton--placeholder"
      style={{ width: dims.width, minHeight: dims.height }}
    >
      <span aria-hidden="true" className="heavy-block-placeholder__icon">
        🔌
      </span>
      <span className="heavy-block-placeholder__label">
        NnViz · plugin runtime (Phase 2+)
      </span>
    </div>
  );
}

export default function NnVizIsland(_props: FlatProps): ReactElement {
  return <NnVizPlaceholder dims={nnVizDims} />;
}
