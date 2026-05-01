import type { ComponentType } from 'react';
import type { BlockViewProps } from '@skb/block-foundation';
import { codeCore } from '../core/core-definition';
import { CodeBody } from './CodeBody';

export const CodeEditorView: ComponentType<
  BlockViewProps<typeof codeCore.propsSchema>
> = ({ props }) => <CodeBody props={props} />;
