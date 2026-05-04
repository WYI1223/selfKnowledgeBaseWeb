import type { ReactElement } from 'react';
import { heavyBoundaryDimensions as nnVizDims } from '@skb/block-nn-viz/ui-default/heavy-boundary-dimensions';
import { HeavyBlockBoundary } from '@skb/heavy-block-boundary';
import { makeMdxAdapter, type FlatProps } from '../lib/mdx-adapter';

const loadNnViz = () =>
  import('@skb/block-nn-viz/ui-default').then((m) => ({
    default: makeMdxAdapter(m.NnVizRenderView as never),
  }));

export default function NnVizIsland(props: FlatProps): ReactElement {
  return (
    <HeavyBlockBoundary<FlatProps>
      kind="nn-viz"
      dims={nnVizDims}
      load={loadNnViz}
      childProps={props}
    />
  );
}
