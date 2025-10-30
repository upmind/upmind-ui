import { extendTailwindMerge } from "tailwind-merge";

/**
 * Custom Tailwind Merge configuration that understands our design system utilities.
 *
 * This is necessary because we have custom utilities that use the `text-` prefix for
 * different purposes (colors vs typography), and the default tailwind-merge would
 * incorrectly treat them as conflicting.
 *
 * Pattern matching approach:
 * - Typography sizes: text-{xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl}[-tight|-loose]?
 * - Text colors: any other text-* class (text-muted, text-base, text-accent-*, etc.)
 */

// Regex to match typography size utilities: text-xs, text-md-tight, text-2xl-loose, etc.
const isTypography = (value: string): boolean => {
  return /^(xs|sm|md|lg|xl|[2-6]xl)(-tight|-loose)?$/.test(value);
};

export const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Typography size utilities - automatically matches any text-{size}[-variant] pattern
      "font-size": [
        {
          text: [isTypography]
        }
      ],
      // Text color utilities - matches any text-* that's NOT a typography size
      // Automatically includes: text-muted, text-base, text-primary, text-accent-*, text-button-*, etc.
      "text-color": [
        {
          text: [(value: string) => !isTypography(value)]
        }
      ]
    }
  }
});
