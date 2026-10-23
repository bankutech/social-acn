/**
 * Client-side high performance image compressor.
 * Downscales large smartphone camera photos (e.g. 10MB+) to lightweight
 * high-quality web images (150KB - 400KB) to prevent 413 FUNCTION_PAYLOAD_TOO_LARGE
 * on serverless deployments like Vercel.
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.82,
    mimeType = 'image/jpeg'
  } = options;

  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // GIFs and SVGs shouldn't be flattened to JPEG
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Maintain aspect ratio while bounding within maxWidth/maxHeight
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Draw and export compressed blob
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const fileName = file.name ? file.name.replace(/\.[^.]+$/, '.jpg') : 'compressed.jpg';
          const compressedFile = new File([blob], fileName, {
            type: mimeType,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
