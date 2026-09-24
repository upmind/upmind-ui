/**
 * @module foundation/brand
 * @description The brand-invariant read.
 */

export type BrandConfig = {
  id: string;
  name?: string;
  faviconUrl?: string;
  themeId?: string;
  brandColor?: string;
  brandFont?: string;
};

export type BrandConfigMeta = {
  isAvailable: boolean;
  isResolved: boolean;
};
