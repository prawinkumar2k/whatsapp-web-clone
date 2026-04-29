const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const API_BASE_URL = (() => {
  const url = import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) {
    return '';
  }

  return url ? trimTrailingSlash(url.trim()) : '';
})();
