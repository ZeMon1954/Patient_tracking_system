// composables/useApi.js
// Custom Nuxt 3 fetch wrapper to centralize API base URL and automatic JWT Bearer token injection.
export const useApi = (path, options = {}) => {
  const config = useRuntimeConfig();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Standardize the path by ensuring it starts with /
  const sanitizedPath = path.startsWith('http')
    ? path
    : path.startsWith('/')
      ? path
      : `/${path}`;

  return $fetch(sanitizedPath, {
    baseURL: config.public.apiBase,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
};
