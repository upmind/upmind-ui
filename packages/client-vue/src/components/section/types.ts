import type {
  InterstitialProps,
  TabItem,
  LinkProps
} from "@upmind-automation/upmind-ui";
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

export type I18nText = {
  key: string;
  plural?: number;
};

export type InterstitialExtendedProps = InterstitialProps & {
  i18nTitle?: I18nText;
};

export type SectionActionProps = LinkProps & {
  handler?: ((...args: unknown[]) => unknown) | string;
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
  active?: boolean;
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
};
