// --- external
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import type {
  InterstitialProps,
  TabItem,
  LinkProps
} from "@upmind-automation/upmind-ui";

export type I18nText = {
  key: string;
  plural?: number;
};

export type InterstitialExtendedProps = InterstitialProps & {
  i18nTitle?: I18nText;
};

export type SectionActionProps = LinkProps & {
  handler?: Function | string;
  type?: HTMLButtonElement["type"];
  visible?: boolean;
};

export interface SectionItem extends TabItem {
  actions?: SectionActionProps[];
  active?: boolean;
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
  uiConfig?: {
    section: {
      root: CxOptions;
      header: CxOptions;
      title: CxOptions;
      content: CxOptions;
    };
  };
};

export type UseSectionProps = {
  card?: boolean;
  border?: boolean;
  inset?: boolean;
};
