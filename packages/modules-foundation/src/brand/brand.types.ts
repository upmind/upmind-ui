/**
 * @module foundation/brand
 * @description The brand-invariant read: ADR 023 §10 Axis 1.
 */

/**
 * The brand-invariant slice resolved from the one BE settings bundle. Identical
 * for every user of a brand, so it is cached under that bundle's own id.
 */
export type BrandConfig = {
  /** The BE settings-bundle id this config was resolved from. */
  id: string;
  name?: string;
  faviconUrl?: string;
  /** The `data-theme` id the brand prefers. */
  themeId?: string;
  brandColor?: string;
  brandFont?: string;
};

export type BrandConfigMeta = {
  isAvailable: boolean;
  isResolved: boolean;
};

export type TermsAndConditionsProps = {
  class?: string;
  label?: string;
  action?: string;
  close?: string;
};
