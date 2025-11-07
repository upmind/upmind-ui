// --- external
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import type {
  InterstitialProps,
  TabItem,
  LinkProps
} from "@upmind-automation/upmind-ui";

// --- internal

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

export type SectionItem = TabItem & {
  actions?: Record<string, SectionActionProps>;
  active?: boolean;
};

export type SectionsProps = {
  active?: boolean;
  class?: HTMLAttributes["class"];
  sections: SectionItem[];
  defaultValue?: string;
  uiConfig?: {
    section: {
      root: CxOptions;
      header: CxOptions;
      title: CxOptions;
      content: CxOptions;
    };
  };
};
