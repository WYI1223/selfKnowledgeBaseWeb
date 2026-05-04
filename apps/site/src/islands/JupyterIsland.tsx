import type { ReactElement } from 'react';
import { heavyBoundaryDimensions as jupyterDims } from '@skb/block-jupyter/ui-default/heavy-boundary-dimensions';
import { HeavyBlockBoundary } from '@skb/heavy-block-boundary';
import { makeMdxAdapter, type FlatProps } from '../lib/mdx-adapter';

const loadJupyter = () =>
  import('@skb/block-jupyter/ui-default').then((m) => ({
    default: makeMdxAdapter(m.JupyterRenderView as never),
  }));

export default function JupyterIsland(props: FlatProps): ReactElement {
  return (
    <HeavyBlockBoundary<FlatProps>
      kind="jupyter"
      dims={jupyterDims}
      load={loadJupyter}
      childProps={props}
    />
  );
}
