export enum FOOTER_TEMPLATE {
  DEFAULT = "default",
  ENCLOSED = "enclosed",
  FULL = "full",
  TWO_COLUMN_LTR = "twoColumnLTR",
  TWO_COLUMN_RTL = "twoColumnRTL",
  SPLIT = "split",
  CANVAS_CARD = "canvasCard",
  SURFACE_BOX = "surfaceBox"
}

export type FooterProps = {
  visible?: boolean;
  template?: FOOTER_TEMPLATE;
  noLocale?: boolean;
  noCurrency?: boolean;
  noPoweredBy?: boolean;
  noLogo?: boolean;
  noCopyright?: boolean;
};
