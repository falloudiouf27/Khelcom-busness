/**
 * Utility to process and compress images uploaded from device gallery or files.
 * Resizes large smartphone camera photos to max 1280px maintaining aspect ratio
 * and encodes to optimized JPEG/WebP data URLs (~80-150KB per photo)
 * to ensure fast rendering and safe localStorage persistence.
 */
export async function optimizeImageFile(file: File, maxWidth = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if valid image type
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Le fichier sélectionné n\'est pas une image valide.'));
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaling if image is larger than maxWidth
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw data url if canvas context fails
          return resolve(readerEvent.target?.result as string);
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as optimized JPEG
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(optimizedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Erreur lors du chargement de l\'image.'));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Impossible de lire le fichier sélectionné.'));
    };

    reader.readAsDataURL(file);
  });
}

export async function optimizeMultipleImageFiles(files: FileList | File[]): Promise<string[]> {
  const fileArray = Array.from(files);
  const results: string[] = [];

  for (const file of fileArray) {
    if (file.type.startsWith('image/')) {
      try {
        const optimized = await optimizeImageFile(file);
        results.push(optimized);
      } catch (err) {
        console.warn('Skipping file due to compression error:', file.name, err);
      }
    }
  }

  return results;
}
