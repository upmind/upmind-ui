export const useImageUrl = (
  url?: string,
  size?: string
): string | undefined => {
  if (!url) return undefined;
  // Brand-config image urls can be relative or otherwise unparseable — pass
  // them through untouched rather than letting URL.parse() return null.
  const imageUrl = URL.parse(url);
  if (!imageUrl) return url;
  if (size) imageUrl.searchParams.set("size", size);
  return imageUrl.toString();
};
