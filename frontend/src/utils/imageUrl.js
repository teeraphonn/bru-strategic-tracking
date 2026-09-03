/**
 * Resolves a full, accessible URL for any uploaded image/file path
 * Handles:
 *   - Absolute URLs (http://, https://, data:, blob:) -> returned as is
 *   - Relative /uploads/... paths -> dynamically prepends the backend origin based on VITE_API_URL
 */
export const getImageUrl = (path) => {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  const cleanPath = String(path).replace(/\\/g, '/');
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // If VITE_API_URL is e.g. "https://bru-strategic-tracking.onrender.com/api", strip "/api"
    const backendOrigin = apiUrl.replace(/\/api\/?$/, '');
    return `${backendOrigin}${normalized}`;
  }

  // If in production environment without VITE_API_URL, use relative path
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return normalized;
  }

  return `http://localhost:5000${normalized}`;
};

export default getImageUrl;
