export function useCookies() {
  function getCookie(name: string) {
    return new Promise((resolve, reject) => {
      const nameEQ = `${name}=`;
      const ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) {
          const value = c.substring(nameEQ.length, c.length);
          if (value) return resolve(value);
        }
      }
      reject("Cookie not found");
    });
  }

  function setCookie(name: string, value: any, maxAge: number) {
    if (!name || !value) return;
    let expires = "";
    if (maxAge) expires = "; max-age=" + `${maxAge}`;
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  function deleteCookie(name: string) {
    document.cookie = `${name}=; expires=${new Date()}; path=/`;
  }

  return {
    getCookie,
    setCookie,
    deleteCookie,
  };
}
