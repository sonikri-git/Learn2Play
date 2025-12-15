export const TokenStorage = {
  get: () => localStorage.getItem('accessToken'),
  set: (t: string) => localStorage.setItem('accessToken', t),
  clear: () => localStorage.removeItem('accessToken'),
};
