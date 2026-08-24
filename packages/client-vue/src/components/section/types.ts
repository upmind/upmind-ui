import type { DataAttrs, InterstitialProps, LinkVariants } from "@upmind/ui";
import type { HTMLAttributes } from "vue";

export type I18nText = {
  key: string;
  plural?: number;
};

export type InterstitialExtendedProps = InterstitialProps & {
  i18nTitle?: I18nText;
};

export type SectionActionProps = LinkVariants & {
  to?: string | object;
  href?: string;
  label?: string;
  icon?: string;
  handler?: ((...args: unknown[]) => unknown) | string;
  type?: HTMLButtonElement["type"];
  visible?: boolean;
  /** data-* attributes (e.g. test ids) forwarded to the action element. */
  dataAttrs?: DataAttrs;
};

export interface SectionItem {
  label: string;
  value: string;
  icon?: string;
  eager?: boolean;
  dataAttrs?: DataAttrs;
  actions?: SectionActionProps[];
}

export type SectionsProps = {
  card?: boolean;
  border?: boolean;
  /** Draw the section header inside the card. Defaults from the section store, set by the active template. */
  inset?: boolean;
  active?: boolean;
  disabled?: boolean;
  class?: HTMLAttributes["class"];
  sections: SectionItem[];
  modelValue?: string;
  dataAttrs?: DataAttrs;
};

export type UseSectionProps = {
  card?: boolean;
  border?: boolean;
  inset?: boolean;
};
