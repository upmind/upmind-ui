import { reduce, set, get } from "lodash-es";

export const useSystemParser = (data: Object) =>
  reduce(
    data,
    (result, value, key) => {
      set(result, key, value);
      return result;
    },
    {}
  );

export const useFileSrcParser = (data: any) => {
  return URL.createObjectURL(data);
};

export const useFileParser = (data: any) => {
  const file = new FormData();
  file.append("image", data);
  return file;
};
