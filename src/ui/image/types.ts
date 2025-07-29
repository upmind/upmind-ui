export interface ImageItem {
  url: string;
  alt: string;
}

export interface ImageProps {
  images: ImageItem[] | ImageItem;
  class?: string;
}
