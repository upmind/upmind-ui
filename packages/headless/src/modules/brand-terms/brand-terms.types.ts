export type TermsAndConditions = {
  id: string;
  title: string;
  content?: string;
  url?: string;
  meta: {
    isUrl: boolean;
  };
};
