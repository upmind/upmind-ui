export interface FormComposable {
  getModel: () => Function;
  setDefault: (value: any) => Promise<any>;
  update: () => Promise<any>;
  input: (value: any) => Promise<any>;
  clear: () => void;
  stop: () => void;
  isReady: () => Promise<boolean>;
  state: () => any;
  context: () => any;
  errors: () => any;
  schema: any;
  uischema: any;
}
