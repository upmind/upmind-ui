export enum Views {
  loading = "loading",
  default = "default",
  list = "list",
  add = "add",
}

export interface ListProps {
  view: Views;
}
