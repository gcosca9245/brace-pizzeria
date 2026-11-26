import { asset } from '@/lib/asset';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  alt: string;
  widths: [number, number];
  sizes: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

/** AVIF mit WebP-Fallback in zwei Breiten. Maße sind gesetzt, damit nichts springt. */
export function Picture({ name, alt, widths, sizes, width, height, className, priority }: Props) {
  const set = (ext: string) => widths.map((w) => `${asset(`/media/img/${name}-${w}.${ext}`)} ${w}w`).join(', ');
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <img
        src={asset(`/media/img/${name}-${widths[1]}.webp`)}
        srcSet={set('webp')}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={cn('block', className)}
      />
    </picture>
  );
}
