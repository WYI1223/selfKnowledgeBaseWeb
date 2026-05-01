import type { ComponentType } from 'react';
import type { BlockViewProps } from '@skb/block-foundation';
import { imageCore } from '../core/core-definition';
import { ImageBody } from './ImageBody';

export const ImageEditorView: ComponentType<
  BlockViewProps<typeof imageCore.propsSchema>
> = ({ props }) => <ImageBody props={props} />;
