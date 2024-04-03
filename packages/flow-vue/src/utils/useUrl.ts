export function useUrl() {
  /**
   * @name getParamFromUrl
   * @desc Here we retrieve a search param from the URL
   */

  function getParamFromUrl(name: string) {
    if (!name) return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /**
   * @name syncParamToUrl
   * @desc Here we sync a search param to the URL
   */

  function syncParamToUrl(name: string, value?: string) {
    const url = new URL(window.location.toString());
    if (!value) url.searchParams.delete(name);
    else url.searchParams.set(name, value);
    window.history.replaceState(null, "", url.toString());
  }

  return {
    getParamFromUrl,
    syncParamToUrl,
  };
}
