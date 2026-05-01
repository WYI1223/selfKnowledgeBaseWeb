import type { ReactNode } from 'react';
import type { z } from 'zod';
import { codeCore } from '../core/core-definition';

type CodeProps = z.infer<typeof codeCore.propsSchema>;

export interface CodeBodyProps {
  readonly props: CodeProps;
}

function splitLines(code: string): string[] {
  if (code === '') return [''];
  return code.split('\n');
}

/**
 * Visual primitive shared by `CodeEditorView` and `CodeRenderView`.
 * The two views differ only in where they source input elsewhere; here we keep
 * a strict shared DOM shape so editor and SSR output remain byte-close.
 *
 * Styling lives in `./code.css` and is gated on `[data-code-language]`.
 */
export function CodeBody({ props }: CodeBodyProps): ReactNode {
  const code = props.code;
  const lines = splitLines(code);

  return (
    <figure
      className="skb-code-frame"
      data-code-language={props.language}
      role="region"
      aria-label={`Code block: ${props.language}`}
      tabIndex={0}
    >
      <div className="skb-code-language-label">{props.language}</div>
      <pre
        className={`skb-code-pre${props.showLineNumbers ? ' skb-code-line-numbers' : ''}`}
        data-language={props.language}
      >
        {props.showLineNumbers ? (
          <code data-language={props.language}>
            {lines.map((line, index) => (
              <span key={index} className="skb-code-line">
                <span className="skb-code-lineno" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="skb-code-line-content">{line}</span>
              </span>
            ))}
          </code>
        ) : (
          <code data-language={props.language}>{code}</code>
        )}
      </pre>
    </figure>
  );
}
