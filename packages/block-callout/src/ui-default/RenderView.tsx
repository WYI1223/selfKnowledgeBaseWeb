import type { ComponentType, ReactNode } from 'react';
import type { BlockViewProps } from '@skb/block-foundation';
import { calloutCore } from '../core/core-definition';
import { CalloutBody } from './CalloutBody';

export const CalloutRenderView: ComponentType<
  BlockViewProps<typeof calloutCore.propsSchema>
> = ({ props, content }) => {
  const body: ReactNode = content ?? '';
  return <CalloutBody props={props}>{body}</CalloutBody>;
};
