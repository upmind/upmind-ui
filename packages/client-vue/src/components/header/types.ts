export enum HEADER_TEMPLATE {
  DEFAULT = "default",
  ENCLOSED = "enclosed",
  FULL = "full",
  TWO_COLUMN_LTR = "twoColumnLTR",
  TWO_COLUMN_RTL = "twoColumnRTL",
  SPLIT = "split",
  CANVAS_CARD = "canvasCard",
  SURFACE_BOX = "surfaceBox"
}

export type HeaderProps = {
  visible?: boolean;
  template?: HEADER_TEMPLATE;
  noSession?: boolean;
  noBasket?: boolean;
  noLogo?: boolean;
};
