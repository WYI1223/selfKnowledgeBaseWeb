import type { ReactNode } from 'react';
import type { z } from 'zod';
import { imageCore } from '../core/core-definition';

type ImageProps = z.infer<typeof imageCore.propsSchema>;

export interface ImageBodyProps {
  readonly props: ImageProps;
}

export function ImageBody({ props }: ImageBodyProps): ReactNode {
  const { src, alt, width, height } = props;

  return (
    <figure
      data-image-loading="lazy"
      className="skb-image"
      role="figure"
      aria-label={alt || 'image'}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className="skb-image-media"
      />
      <figcaption className="skb-image-caption">{alt}</figcaption>
    </figure>
  );
}
