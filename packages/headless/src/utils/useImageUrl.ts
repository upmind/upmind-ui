export const useImageUrl = (
  url?: string,
  size?: string
): string | undefined => {
  if (!url) return undefined;
  const imageUrl = new URL(url);
  if (size) imageUrl.searchParams.set("size", size);
  return imageUrl.toString();
};
