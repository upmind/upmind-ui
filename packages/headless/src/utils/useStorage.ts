// -----------------------------------------------------------------------------

export function useSafeParse(value: any) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

export const useSessionStorage = () => {
  return {
    get(key: string, fallback?: any) {
      const value = sessionStorage.getItem(key) || fallback || null;
      return useSafeParse(value);
    },
    set(key: string, value: any) {
      sessionStorage.setItem(key, JSON.stringify(value));
      return value;
    },
    remove(key: string) {
      sessionStorage.removeItem(key);
      return null;
    },

    clear() {
      sessionStorage.clear();
      return null;
    },
  };
};

export const useLocalStorage = () => {
  return {
    get(key: string, fallback?: any) {
      const value = localStorage.getItem(key) || fallback || null;
      return useSafeParse(value);
    },
    set(key: string, value: any) {
      localStorage.setItem(key, JSON.stringify(value));
      return value;
    },
    remove(key: string) {
      localStorage.removeItem(key);
      return null;
    },

    clear() {
      localStorage.clear();
      return null;
    },
  };
};
