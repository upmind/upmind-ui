export const useImageUrl = (
  url?: string,
  size?: string
): string | undefined => {
  if (!url) return undefined;
  // Brand-config image urls can be relative or otherwise unparseable — pass
  // them through untouched rather than letting new URL() throw mid-render.
  let imageUrl;
  try {
    imageUrl = new URL(url);
  } catch {
    return url;
  }
  if (size) imageUrl.searchParams.set("size", size);
  return imageUrl.toString();
};
