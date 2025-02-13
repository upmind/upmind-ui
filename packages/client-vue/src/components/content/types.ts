export interface Mask {
  text: string;
  mask?: string;
  bold?: string;
}

export interface SmartTitleProps {
  title: string | Mask;
  color?: string;
}
