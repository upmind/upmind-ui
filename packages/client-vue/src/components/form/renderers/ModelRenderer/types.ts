export type ModelListRendererItemProps = {
  id: string;
  title: string;
  description: string;
  regNumber: string;
  vatNumber: string;
  isSelected: boolean;
  allowEdit: boolean;
};

export type ModelRendererProps = {
  id: string;
  label: string;
  composable: any;
};
