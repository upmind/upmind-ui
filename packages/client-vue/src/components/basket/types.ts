export interface BasketModalProps {
  open: boolean;
  modal?: boolean;
  // ---
  title?: string;
  text?: string;
  avatar?: {
    size?: string;
    shape?: string;
    color?: string;
    icon?: string;
    fit?: string;
  };
  action?: {
    label?: string;
    color?: string;
    handler?: () => void;
    auto?: boolean;
  };
  // ---
  size?: string;
  skrim?: string;
}
