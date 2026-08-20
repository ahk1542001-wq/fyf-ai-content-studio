/**
 * SVG Text Sanitizer, Burmese Unicode Wrap, and XML Escape Utilities
 */

/**
 * Escapes characters that are reserved in XML/SVG attribute and node text.
 * Preserves Burmese Unicode glyphs, numbers, punctuation, and valid symbols.
 */
export function escapeXml(unsafeStr: string | null | undefined): string {
  if (!unsafeStr) return '';
  return String(unsafeStr)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Splits text into grapheme clusters so Burmese tone marks and virama combinations are never split mid-character.
 */
export function getGraphemeClusters(text: string): string[] {
  if (!text) return [];
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter('my', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), (s) => s.segment);
    } catch {
      // Fallback below
    }
  }
  // Fallback regex for Unicode characters & combining marks (including Myanmar \u1000-\u109F)
  const graphemeRegex = /[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FF][\u102B-\u103E\u1039\u103A\u1036\u1037\u1038]*|./gu;
  const matches = text.match(graphemeRegex);
  return matches || Array.from(text);
}

export interface WrapSvgTextOptions {
  maxCharsPerLine: number;
  maxLines?: number;
  ellipsis?: boolean;
}

/**
 * Intelligently wraps text into multiple lines for SVG text/tspan rendering.
 * Respects word boundaries, spaces, Burmese punctuation (၊ ၊ ။), and syllable clusters.
 */
export function wrapSvgText(
  text: string | null | undefined,
  options: WrapSvgTextOptions
): string[] {
  if (!text) return [];
  const rawText = String(text).trim();
  if (rawText.length === 0) return [];

  const { maxCharsPerLine, maxLines = 4, ellipsis = true } = options;

  // If text already contains explicit newlines, respect them first
  const explicitLines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const resultLines: string[] = [];

  for (const expLine of explicitLines) {
    // If it fits on one line, keep it
    if (expLine.length <= maxCharsPerLine) {
      resultLines.push(expLine);
      continue;
    }

    // Split on whitespace or space-delimited words
    const words = expLine.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        if (word.length <= maxCharsPerLine) {
          currentLine = word;
        } else {
          // Long continuous word / Burmese phrase without spaces
          const clusters = getGraphemeClusters(word);
          let subChunk = '';
          for (const cluster of clusters) {
            if ((subChunk + cluster).length <= maxCharsPerLine) {
              subChunk += cluster;
            } else {
              resultLines.push(subChunk);
              subChunk = cluster;
            }
          }
          currentLine = subChunk;
        }
      } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine += ' ' + word;
      } else {
        resultLines.push(currentLine);
        if (word.length <= maxCharsPerLine) {
          currentLine = word;
        } else {
          const clusters = getGraphemeClusters(word);
          let subChunk = '';
          for (const cluster of clusters) {
            if ((subChunk + cluster).length <= maxCharsPerLine) {
              subChunk += cluster;
            } else {
              resultLines.push(subChunk);
              subChunk = cluster;
            }
          }
          currentLine = subChunk;
        }
      }
    }

    if (currentLine) {
      resultLines.push(currentLine);
    }
  }

  // Enforce maxLines limit if specified
  if (resultLines.length > maxLines) {
    const truncated = resultLines.slice(0, maxLines);
    if (ellipsis && truncated.length > 0) {
      const last = truncated[truncated.length - 1];
      truncated[truncated.length - 1] = last.replace(/[.၊။ ]+$/, '') + '...';
    }
    return truncated;
  }

  return resultLines;
}

/**
 * Calculates and formats SVG `<tspan>` elements for multi-line text blocks.
 */
export function calculateTspanLines(
  lines: string[],
  x: number | string,
  startY: number,
  lineSpacing: number
): string {
  if (!lines || lines.length === 0) return '';
  return lines
    .map((line, index) => {
      const y = startY + index * lineSpacing;
      return `<tspan x="${x}" y="${y}">${escapeXml(line)}</tspan>`;
    })
    .join('\n      ');
}

/**
 * Strips potentially dangerous script tags or javascript attributes from untrusted SVG text.
 */
export function sanitizeSvgSnippet(svgSnippet: string): string {
  if (!svgSnippet) return '';
  return svgSnippet
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}
