export const useFileSrcParser = (data: any) => {
  return URL.createObjectURL(data);
};

export const useFileParser = (data: any) => {
  const file = new FormData();
  file.append("image", data);
  return file;
};
