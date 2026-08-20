/**
 * FYF Client-Side HTML5 Canvas SVG-to-PNG Exporter & Downloader
 * 1080x1080 Vector to High-Resolution Raster PNG
 */

/**
 * Converts a raw SVG XML string into a safe Data URI.
 * Uses encodeURIComponent to cleanly handle Burmese Unicode characters and reserved XML entities.
 */
export function svgStringToDataUrl(svgString: string): string {
  const cleanSvg = svgString.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`;
}

/**
 * Converts an SVG string into a PNG Blob using an offscreen HTML5 `<canvas width="1080" height="1080">`.
 */
export async function exportBannerSvgToPngBlob(
  svgString: string,
  width = 1080,
  height = 1080
): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Canvas PNG export is only supported in browser environments.');
  }

  const dataUrl = svgStringToDataUrl(svgString);

  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    // Allow cross-origin images if embedded
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to acquire 2D canvas context.'));
          return;
        }

        // Draw image at native 1080x1080 resolution
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create PNG blob from canvas.'));
            }
          },
          'image/png',
          1.0
        );
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load SVG data into Image for canvas rendering.'));
    };

    img.src = dataUrl;
  });
}

/**
 * Triggers a browser download for the generated PNG banner.
 */
export async function downloadBannerAsPng(
  svgString: string,
  filename = 'fyf-banner-1080x1080.png',
  width = 1080,
  height = 1080
): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const blob = await exportBannerSvgToPngBlob(svgString, width, height);
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Triggers a browser download for the raw SVG banner file.
 */
export function downloadBannerAsSvg(
  svgString: string,
  filename = 'fyf-banner-1080x1080.svg'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
