export type ModelListRendererItemProps = {
  id: string;
  title: string;
  description: string;
  regNumber?: string;
  vatNumber?: string;
  isDefault?: boolean;
  allowEdit?: boolean;
};

export type ModelRendererProps = {
  is: string;
  id: string;
  label: string;
  composable: any;
  open: boolean;
};
