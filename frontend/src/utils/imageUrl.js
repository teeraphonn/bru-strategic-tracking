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

/**
 * Compresses an image file before upload (resizes to max dimension and converts to JPEG quality 0.8)
 * Result is typically ~60KB - 150KB for crisp display without wasting bandwidth or storage.
 */
export const compressImage = (file, maxDim = 1280, quality = 0.8) => {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressed = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'),
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            resolve(compressed);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default getImageUrl;
